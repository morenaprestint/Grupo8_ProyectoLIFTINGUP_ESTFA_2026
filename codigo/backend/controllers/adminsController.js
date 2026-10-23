const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { enviarCodigoVerificacion } = require('../services/emailService');

// ─── Helper: formatear de forma segura a YYYY-MM-DD (ISO) ─────────────────────
const formatearAFechaISO = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        if (trimmed.includes('T')) return trimmed.split('T')[0];
        const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }
    if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getUTCFullYear();
        const m = String(val.getUTCMonth() + 1).padStart(2, '0');
        const d = String(val.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// ─── Helper: validación de edad (mínimo 14 años, máximo 100 años) ────────────
const validarEdad = (fecha_nacimiento) => {
    if (!fecha_nacimiento) return null;
    const fecha = new Date(fecha_nacimiento);
    if (isNaN(fecha.getTime())) {
        return 'La fecha de nacimiento ingresada no es válida.';
    }
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const diffMeses = hoy.getMonth() - fecha.getMonth();
    if (diffMeses < 0 || (diffMeses === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
    }
    if (edad < 14) {
        return 'La edad mínima permitida es de 14 años cumplidos.';
    }
    if (edad > 100) {
        return 'La fecha de nacimiento no es válida (edad máxima 100 años).';
    }
    return null;
};

// ─── POST /api/admins — Crear administrador en tabla usuarios (es_admin = 1) ─
exports.createAdmin = async (req, res) => {
    const { nombre, apellido, email, password, fecha_nacimiento } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, apellido, email y contraseña son obligatorios'
        });
    }

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: 'El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)'
        });
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
        });
    }

    if (fecha_nacimiento) {
        const errorEdad = validarEdad(fecha_nacimiento);
        if (errorEdad) {
            return res.status(400).json({ success: false, message: errorEdad });
        }
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        // Verificar email duplicado en usuarios
        const [existentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [cleanEmail]);
        if (existentes.length > 0) {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const codigo_expira = new Date(Date.now() + 15 * 60 * 1000);
        const ultimo_reenvio = new Date();

        const [result] = await db.query(
            `INSERT INTO usuarios 
                (nombre, apellido, email, password, es_admin, es_atleta, fecha_nacimiento, activo, email_verificado, codigo_verificacion, codigo_expira, ultimo_reenvio)
             VALUES (?, ?, ?, ?, 1, 0, ?, 1, 0, ?, ?, ?)`,
            [nombre.trim(), apellido.trim(), cleanEmail, hashedPassword, fecha_nacimiento || null, codigo_verificacion, codigo_expira, ultimo_reenvio]
        );

        // Enviar código de verificación por Brevo
        enviarCodigoVerificacion(cleanEmail, codigo_verificacion).catch(err => {
            console.error('Error enviando código de verificación al nuevo admin:', err);
        });

        const [newRows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        const adminData = newRows[0];
        const { password: _pw, ...adminSafe } = adminData;

        res.status(201).json({
            success: true,
            message: 'Administrador creado correctamente',
            data: {
                ...adminSafe,
                id: adminData.id_usuario,
                id_admin: adminData.id_usuario,
                fecha_nacimiento: formatearAFechaISO(adminData.fecha_nacimiento),
                rol: 'admin'
            }
        });
    } catch (error) {
        console.error('Error al crear administrador:', error);
        res.status(500).json({ success: false, message: 'Error al crear el administrador' });
    }
};

// ─── GET /api/admins — Obtener todos los administradores (es_admin = 1) ──────
exports.getAdmins = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_usuario AS id, id_usuario AS id_admin, id_usuario, nombre, apellido, email, foto_perfil, 
                    es_admin, es_atleta, fecha_nacimiento, edad, peso, altura, objetivo, nivel_entrenamiento, 
                    activo, email_verificado, email_pendiente 
             FROM usuarios 
             WHERE es_admin = 1 
             ORDER BY id_usuario ASC`
        );

        const data = rows.map(admin => ({
            ...admin,
            id: admin.id_admin,
            fecha_nacimiento: formatearAFechaISO(admin.fecha_nacimiento),
            rol: 'admin'
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al obtener administradores:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── GET /api/admins/perfil — Obtener perfil del administrador ──────────────
exports.getPerfil = async (req, res) => {
    const id = req.query.id || req.headers['x-user-id'];
    const email = req.query.email;

    try {
        let rows = [];
        if (id) {
            [rows] = await db.query(
                `SELECT id_usuario AS id, id_usuario AS id_admin, nombre, apellido, email, password, foto_perfil, fecha_nacimiento 
                 FROM usuarios WHERE id_usuario = ? AND es_admin = 1`,
                [id]
            );
        } else if (email) {
            [rows] = await db.query(
                `SELECT id_usuario AS id, id_usuario AS id_admin, nombre, apellido, email, password, foto_perfil, fecha_nacimiento 
                 FROM usuarios WHERE email = ? AND es_admin = 1`,
                [email.trim().toLowerCase()]
            );
        } else {
            [rows] = await db.query(
                `SELECT id_usuario AS id, id_usuario AS id_admin, nombre, apellido, email, password, foto_perfil, fecha_nacimiento 
                 FROM usuarios WHERE es_admin = 1 LIMIT 1`
            );
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil de administrador no encontrado' });
        }

        const admin = rows[0];
        res.json({
            success: true,
            data: {
                id: admin.id_admin,
                id_admin: admin.id_admin,
                nombre: admin.nombre || '',
                apellido: admin.apellido || '',
                nombre_completo: `${admin.nombre || ''} ${admin.apellido || ''}`.trim() || 'Administrador',
                email: admin.email || '',
                foto_perfil: admin.foto_perfil || null,
                fecha_nacimiento: formatearAFechaISO(admin.fecha_nacimiento),
                password: admin.password || '',
                rol: 'admin'
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil admin:', error);
        res.status(500).json({ success: false, message: 'Error del servidor', error: error.message });
    }
};

// ─── PUT /api/admins/perfil — Actualizar perfil del administrador ────────────
exports.updatePerfil = async (req, res) => {
    const { id, id_admin, nombre, apellido, email, password, password_actual } = req.body;
    const adminId = id || id_admin || req.query.id || req.headers['x-user-id'];

    if (!adminId) {
        return res.status(400).json({ success: false, message: 'ID de administrador requerido' });
    }

    try {
        const fields = [];
        const values = [];

        if (nombre !== undefined && nombre.trim() !== '') {
            fields.push('nombre = ?');
            values.push(nombre.trim());
        }
        if (apellido !== undefined && apellido.trim() !== '') {
            fields.push('apellido = ?');
            values.push(apellido.trim());
        }
        if (email !== undefined && email.trim() !== '') {
            const cleanEmail = email.trim().toLowerCase();
            const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!EMAIL_REGEX.test(cleanEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)'
                });
            }
            fields.push('email = ?');
            values.push(cleanEmail);
        }
        if (password !== undefined && password.trim() !== '') {
            if (!password_actual || !password_actual.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Para cambiar la contraseña debes ingresar tu contraseña actual.'
                });
            }

            const [adminRows] = await db.query('SELECT password FROM usuarios WHERE id_usuario = ? AND es_admin = 1', [adminId]);
            if (adminRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
            }

            const storedPass = adminRows[0].password;
            let coincide = false;
            if (storedPass && (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$'))) {
                coincide = await bcrypt.compare(password_actual.trim(), storedPass);
            } else {
                coincide = password_actual.trim() === storedPass;
            }

            if (!coincide) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña actual ingresada es incorrecta.'
                });
            }

            const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!pwdRegex.test(password.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
                });
            }

            fields.push('password = ?');
            values.push(await bcrypt.hash(password.trim(), 10));
        }
        if (req.body.fecha_nacimiento !== undefined && req.body.fecha_nacimiento !== null && req.body.fecha_nacimiento !== '') {
            const errorEdad = validarEdad(req.body.fecha_nacimiento);
            if (errorEdad) {
                return res.status(400).json({ success: false, message: errorEdad });
            }
            fields.push('fecha_nacimiento = ?');
            values.push(formatearAFechaISO(req.body.fecha_nacimiento));
        }

        if (fields.length > 0) {
            values.push(adminId);
            await db.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ? AND es_admin = 1`, values);
        }

        const [rows] = await db.query(
            `SELECT id_usuario AS id, id_usuario AS id_admin, nombre, apellido, email, password, foto_perfil 
             FROM usuarios WHERE id_usuario = ? AND es_admin = 1`,
            [adminId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
        }

        const admin = rows[0];
        res.json({
            success: true,
            message: 'Perfil de administrador actualizado correctamente',
            data: {
                id: admin.id_admin,
                id_admin: admin.id_admin,
                nombre: admin.nombre || '',
                apellido: admin.apellido || '',
                nombre_completo: `${admin.nombre || ''} ${admin.apellido || ''}`.trim() || 'Administrador',
                email: admin.email || '',
                foto_perfil: admin.foto_perfil || null,
                password: admin.password || '',
                rol: 'admin'
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil admin:', error);
        res.status(500).json({ success: false, message: 'Error del servidor', error: error.message });
    }
};
