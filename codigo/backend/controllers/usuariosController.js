const db = require('../config/db');
const { enviarCodigoVerificacion, enviarCodigoRecuperacion } = require('../services/emailService');
const bcrypt = require('bcryptjs');

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

// ─── Helper: verificar contraseña (bcrypt hash o texto plano legado) ─────────
const verifyPassword = async (candidate, stored) => {
    if (!candidate || !stored) return false;
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
        return await bcrypt.compare(candidate, stored);
    }
    return candidate === stored;
};

// ─── Helper: validación estricta de altura y peso (40 a 200 kg) ───────────────
const validarCamposFisicos = ({ altura, peso }) => {
    if (altura !== undefined && altura !== null && altura !== '') {
        const h = Number(altura);
        if (isNaN(h) || h < 1.00 || h > 2.50) {
            return 'La altura debe estar estrictamente en el rango de 1.00 a 2.50 metros.';
        }
    }
    if (peso !== undefined && peso !== null && peso !== '') {
        const p = Number(peso);
        if (isNaN(p) || p < 40 || p > 200) {
            return 'Error: Ingrese un peso válido (el peso corporal debe estar estrictamente entre 40 kg y 200 kg).';
        }
    }
    return null;
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

// ─── Helper: validación estricta de formato de correo electrónico ────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const validarFormatoEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

// ─── Helper: normalizar usuario para el frontend ───────────────────────────
const normalizeUsuario = (u) => {
    const esAdmin = u.es_admin === 1 || u.es_admin === true || u.es_admin === '1' ? 1 : 0;
    const esAtleta = u.es_atleta === 1 || u.es_atleta === true || u.es_atleta === '1' ? 1 : 0;
    const dobleRol = esAdmin === 1 && esAtleta === 1;

    let rol = 'atleta';
    if (esAdmin && !esAtleta) rol = 'admin';
    else if (esAdmin && esAtleta) rol = 'admin';

    return {
        id: u.id_usuario,
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        email_pendiente: u.email_pendiente || null,
        foto_perfil: u.foto_perfil || null,
        es_admin: esAdmin,
        es_atleta: esAtleta,
        doble_rol: dobleRol,
        peso: u.peso != null ? Number(u.peso) : null,
        altura: u.altura != null ? Number(u.altura) : null,
        fecha_nacimiento: formatearAFechaISO(u.fecha_nacimiento),
        edad: u.edad != null ? Number(u.edad) : null,
        objetivo: u.objetivo || '',
        nivel_entrenamiento: u.nivel_entrenamiento || 'Principiante',
        email_verificado: u.email_verificado,
        estado: u.activo === 1 || u.activo === true ? 'Activo' : 'Inactivo',
        activo: u.activo,
        rol
    };
};

// ─── GET /api/usuarios — Obtener todos los usuarios ────────────────────────
exports.getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                    es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                    objetivo, nivel_entrenamiento, activo, email_verificado 
             FROM usuarios ORDER BY id_usuario ASC`
        );
        const data = rows.map(normalizeUsuario);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error detallado en ruta usuarios:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar la tabla de usuarios',
            error: error.message
        });
    }
};

// ─── GET /api/usuarios/:id — Obtener uno por ID ───────────────────────────
exports.getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                    es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                    objetivo, nivel_entrenamiento, activo, email_verificado 
             FROM usuarios WHERE id_usuario = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: normalizeUsuario(rows[0]) });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── POST /api/usuarios — Crear usuario ───────────────────────────────────
exports.createUsuario = async (req, res) => {
    const {
        nombre, apellido, email, password,
        peso, altura,
        objetivo, nivel_entrenamiento,
        fecha_nacimiento, es_admin, es_atleta
    } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, apellido, email y contraseña son obligatorios'
        });
    }

    if (!validarFormatoEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)'
        });
    }

    if (fecha_nacimiento) {
        const errorEdad = validarEdad(fecha_nacimiento);
        if (errorEdad) {
            return res.status(400).json({ success: false, message: errorEdad });
        }
    }

    const esAtletaCheck = es_atleta !== undefined ? (es_atleta === true || es_atleta === 1 || es_atleta === '1') : true;
    let pesoFinal = null;
    let alturaFinal = null;
    let objetivoFinal = null;
    let nivelEntrenamientoFinal = null;

    if (esAtletaCheck) {
        if (
            peso === undefined || peso === null || String(peso).trim() === '' ||
            altura === undefined || altura === null || String(altura).trim() === '' ||
            !nivel_entrenamiento || String(nivel_entrenamiento).trim() === '' ||
            !objetivo || String(objetivo).trim() === ''
        ) {
            return res.status(400).json({
                success: false,
                message: 'Debe completar los datos físicos del atleta'
            });
        }

        const errorFisico = validarCamposFisicos({ altura, peso });
        if (errorFisico) {
            return res.status(400).json({ success: false, message: errorFisico });
        }

        pesoFinal = peso != null && peso !== '' ? Number(peso) : null;
        alturaFinal = altura != null && altura !== '' ? Number(altura) : null;
        objetivoFinal = objetivo || null;
        nivelEntrenamientoFinal = nivel_entrenamiento || 'Principiante';
    } else {
        pesoFinal = null;
        alturaFinal = null;
        objetivoFinal = null;
        nivelEntrenamientoFinal = null;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
        });
    }

    try {
        const [existentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        if (existentes.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();

        const [result] = await db.query(
            `INSERT INTO usuarios 
                (nombre, apellido, email, password, peso, altura, 
                 objetivo, nivel_entrenamiento, activo, es_admin, es_atleta, fecha_nacimiento,
                 email_verificado, codigo_verificacion, codigo_expira, ultimo_reenvio)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())`,
            [
                nombre.trim(),
                apellido.trim(),
                email.trim().toLowerCase(),
                hashedPassword,
                pesoFinal,
                alturaFinal,
                objetivoFinal,
                nivelEntrenamientoFinal,
                es_admin ? 1 : 0,
                esAtletaCheck ? 1 : 0,
                fecha_nacimiento ? formatearAFechaISO(fecha_nacimiento) : null,
                codigo_verificacion
            ]
        );

        enviarCodigoVerificacion(email.trim().toLowerCase(), codigo_verificacion).catch(err => console.error('Error enviando email:', err));

        const [newRows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            data: normalizeUsuario(newRows[0])
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ success: false, message: 'Error al crear el usuario' });
    }
};

// ─── PUT /api/usuarios/:id — Actualizar usuario (Protegido contra verificación fantasma) ─────────
exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const {
        nombre, apellido, email, password, password_actual,
        peso, altura,
        objetivo, nivel_entrenamiento, estado, activo,
        fecha_nacimiento, es_admin, es_atleta
    } = req.body;

    const errorFisico = validarCamposFisicos({ altura, peso });
    if (errorFisico) {
        return res.status(400).json({ success: false, message: errorFisico });
    }

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const usuarioActual = usuarios[0];

        const requesterId = req.headers['x-user-id'] || req.query.admin_id;
        const requesterEmail = req.headers['x-user-email'];
        const esMismoAdmin = Boolean(
            (requesterId && String(requesterId) === String(id)) ||
            (requesterEmail && usuarioActual.email && requesterEmail.trim().toLowerCase() === usuarioActual.email.trim().toLowerCase())
        );

        if (esMismoAdmin && usuarioActual.es_admin === 1 && es_admin !== undefined) {
            const nuevoEsAdmin = es_admin === 1 || es_admin === true || es_admin === '1' ? 1 : 0;
            if (nuevoEsAdmin === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Acción prohibida: No puedes revocar tu propio rol de administrador.'
                });
            }
        }

        if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && String(fecha_nacimiento).trim() !== '') {
            const errorEdad = validarEdad(fecha_nacimiento);
            if (errorEdad) {
                return res.status(400).json({ success: false, message: errorEdad });
            }
        }

        const esAtletaCheck = es_atleta !== undefined
            ? (es_atleta === true || es_atleta === 1 || es_atleta === '1')
            : (usuarioActual.es_atleta === 1 || usuarioActual.es_atleta === true || usuarioActual.es_atleta === '1');

        let pesoFinal = null;
        let alturaFinal = null;
        let objetivoFinal = null;
        let nivelEntrenamientoFinal = null;

        if (esAtletaCheck) {
            const pesoEval = peso !== undefined ? peso : usuarioActual.peso;
            const alturaEval = altura !== undefined ? altura : usuarioActual.altura;
            const nivelEval = nivel_entrenamiento !== undefined ? nivel_entrenamiento : usuarioActual.nivel_entrenamiento;
            const objetivoEval = objetivo !== undefined ? objetivo : usuarioActual.objetivo;

            if (
                pesoEval === undefined || pesoEval === null || String(pesoEval).trim() === '' ||
                alturaEval === undefined || alturaEval === null || String(alturaEval).trim() === '' ||
                !nivelEval || String(nivelEval).trim() === '' ||
                !objetivoEval || String(objetivoEval).trim() === ''
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe completar los datos físicos del atleta'
                });
            }

            const errorFisicoEval = validarCamposFisicos({ altura: alturaEval, peso: pesoEval });
            if (errorFisicoEval) {
                return res.status(400).json({ success: false, message: errorFisicoEval });
            }

            pesoFinal = pesoEval != null && pesoEval !== '' ? Number(pesoEval) : null;
            alturaFinal = alturaEval != null && alturaEval !== '' ? Number(alturaEval) : null;
            objetivoFinal = String(objetivoEval).trim();
            nivelEntrenamientoFinal = String(nivelEval).trim();
        } else {
            pesoFinal = null;
            alturaFinal = null;
            objetivoFinal = null;
            nivelEntrenamientoFinal = null;
        }

        let fechaNacFinal = formatearAFechaISO(usuarioActual.fecha_nacimiento);
        if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && String(fecha_nacimiento).trim() !== '') {
            fechaNacFinal = formatearAFechaISO(fecha_nacimiento);
        }

        // ─── GESTIÓN SEGURA Y AISLADA DE EMAIL (Evita falsos reseteos o verificaciones fantasma) ───
        let emailFinal = usuarioActual.email;
        let emailPendienteFinal = usuarioActual.email_pendiente;
        let emailVerificadoFinal = usuarioActual.email_verificado;
        let codigoVerificacionFinal = usuarioActual.codigo_verificacion;
        let emailCambioSolicitado = false;

        if (email !== undefined && email !== null) {
            const emailLimpio = email.trim().toLowerCase();
            if (emailLimpio !== usuarioActual.email.toLowerCase()) {
                if (!validarFormatoEmail(emailLimpio)) {
                    return res.status(400).json({
                        success: false,
                        message: 'El correo electrónico debe ser una cuenta válida de Gmail (@gmail.com)'
                    });
                }

                const [duplicado] = await db.query(
                    'SELECT id_usuario FROM usuarios WHERE (email = ? OR email_pendiente = ?) AND id_usuario != ?',
                    [emailLimpio, emailLimpio, id]
                );
                if (duplicado.length > 0) {
                    return res.status(409).json({ success: false, message: 'El nuevo correo electrónico ya está en uso por otra cuenta.' });
                }

                emailPendienteFinal = emailLimpio;
                emailVerificadoFinal = 0;
                codigoVerificacionFinal = Math.floor(100000 + Math.random() * 900000).toString();
                emailCambioSolicitado = true;

                enviarCodigoVerificacion(emailLimpio, codigoVerificacionFinal).catch(err => console.error('Error enviando email:', err));
            }
        }

        let activoVal = usuarioActual.activo;
        if (activo !== undefined) {
            activoVal = activo === true || activo === 1 || activo === '1' ? 1 : 0;
        } else if (estado !== undefined) {
            activoVal = (estado === 'Activo' || estado === true || estado === 1) ? 1 : 0;
        }

        let passFinal = usuarioActual.password;
        if (password && password.trim() !== '' && password !== password_actual) {
            const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!pwdRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
                });
            }
            passFinal = await bcrypt.hash(password, 10);
        }

        await db.query(
            `UPDATE usuarios SET
                nombre               = COALESCE(?, nombre),
                apellido             = COALESCE(?, apellido),
                email                = ?,
                email_pendiente      = ?,
                password             = ?,
                peso                 = ?,
                altura               = ?,
                objetivo             = ?,
                nivel_entrenamiento  = ?,
                activo               = ?,
                es_admin             = COALESCE(?, es_admin),
                es_atleta            = ?,
                fecha_nacimiento     = ?,
                email_verificado     = ?,
                codigo_verificacion  = ?,
                codigo_expira        = ${emailCambioSolicitado ? 'DATE_ADD(NOW(), INTERVAL 15 MINUTE)' : 'codigo_expira'},
                ultimo_reenvio       = ${emailCambioSolicitado ? 'NOW()' : 'ultimo_reenvio'}
            WHERE id_usuario = ?`,
            [
                nombre ? nombre.trim() : null,
                apellido ? apellido.trim() : null,
                emailFinal,
                emailPendienteFinal,
                passFinal,
                pesoFinal,
                alturaFinal,
                objetivoFinal,
                nivelEntrenamientoFinal,
                activoVal,
                es_admin !== undefined ? (es_admin ? 1 : 0) : null,
                esAtletaCheck ? 1 : 0,
                fechaNacFinal,
                emailVerificadoFinal,
                codigoVerificacionFinal,
                id
            ]
        );

        const [updated] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        const emailCambioSolicitadoResponse = Boolean(emailPendienteFinal && emailPendienteFinal !== usuarioActual.email);
        const requiereRevalidar = Boolean(esMismoAdmin && emailCambioSolicitadoResponse);

        res.json({
            success: true,
            emailPendiente: emailCambioSolicitadoResponse,
            requiereRevalidarSesion: requiereRevalidar,
            message: emailCambioSolicitadoResponse
                ? 'Usuario actualizado. Se envió un código de verificación de 6 dígitos al nuevo correo electrónico.'
                : 'Usuario actualizado exitosamente',
            data: normalizeUsuario(updated[0])
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
    }
};

// ─── PUT /api/usuarios/cambiar-email — Endpoint dedicado de seguridad ────────
exports.cambiarEmail = async (req, res) => {
    const id = req.body.id || req.body.id_usuario || req.params.id || req.headers['x-user-id'];
    const { nuevo_email, password_actual } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido' });
    }
    if (!nuevo_email || !nuevo_email.trim()) {
        return res.status(400).json({ success: false, message: 'El nuevo correo electrónico es obligatorio' });
    }
    if (!password_actual) {
        return res.status(400).json({
            success: false,
            message: 'Debes ingresar tu contraseña actual para confirmar el cambio de correo electrónico.'
        });
    }

    const cleanEmail = nuevo_email.trim().toLowerCase();
    if (!validarFormatoEmail(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: 'El nuevo correo electrónico no tiene un formato válido con dominio completo (ej. usuario@gmail.com).'
        });
    }

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const usuario = rows[0];

        const esValida = await verifyPassword(password_actual, usuario.password);
        if (!esValida) {
            return res.status(401).json({ success: false, message: 'La contraseña actual ingresada es incorrecta.' });
        }

        if (cleanEmail === usuario.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'El nuevo correo electrónico debe ser diferente al actual.' });
        }

        const [duplicados] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE (email = ? OR email_pendiente = ?) AND id_usuario != ?',
            [cleanEmail, cleanEmail, id]
        );
        if (duplicados.length > 0) {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado por otra cuenta.' });
        }

        const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            `UPDATE usuarios SET
                email_pendiente = ?,
                email_verificado = 0,
                codigo_verificacion = ?,
                codigo_expira = DATE_ADD(NOW(), INTERVAL 15 MINUTE),
                ultimo_reenvio = NOW()
             WHERE id_usuario = ?`,
            [cleanEmail, codigo_verificacion, id]
        );

        enviarCodigoVerificacion(cleanEmail, codigo_verificacion).catch(err => console.error('Error enviando email:', err));

        const [updatedRows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        return res.json({
            success: true,
            emailPendiente: true,
            requiereRevalidarSesion: true,
            message: 'Se ha enviado un código de verificación de 6 dígitos al nuevo correo electrónico.',
            data: normalizeUsuario(updatedRows[0])
        });
    } catch (error) {
        console.error('Error al cambiar email:', error);
        res.status(500).json({ success: false, message: 'Error del servidor al cambiar el correo electrónico' });
    }
};

// ─── POST /api/usuarios/:id/foto — Subida de Foto de Perfil con Multer ─────────
exports.uploadFotoPerfil = async (req, res) => {
    const id = req.params.id || req.body.id || req.body.id_usuario;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido para subir foto' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se ha seleccionado ningún archivo de imagen' });
    }

    try {
        const rutaRelativa = `/uploads/${req.file.filename}`;

        const [result] = await db.query(
            'UPDATE usuarios SET foto_perfil = ? WHERE id_usuario = ?',
            [rutaRelativa, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const [rows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        const userNormalized = normalizeUsuario(rows[0]);

        return res.json({
            success: true,
            message: 'Foto de perfil actualizada correctamente',
            foto_perfil: rutaRelativa,
            data: userNormalized
        });
    } catch (error) {
        console.error('Error al subir foto de perfil:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor al guardar la foto de perfil' });
    }
};

// ─── DELETE /api/usuarios/:id — Eliminar usuario ──────────────────────────
exports.deleteUsuario = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.headers['x-user-id'] || req.query.admin_id;
    const requesterEmail = req.headers['x-user-email'];

    if (requesterId && String(requesterId) === String(id)) {
        return res.status(403).json({
            success: false,
            message: 'Acción prohibida: Un administrador no puede eliminarse a sí mismo.'
        });
    }

    try {
        const [usuarios] = await db.query('SELECT id_usuario, email, nombre, apellido, es_admin FROM usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        if (
            (requesterId && String(requesterId) === String(usuario.id_usuario)) ||
            (requesterEmail && usuario.email && requesterEmail.trim().toLowerCase() === usuario.email.trim().toLowerCase())
        ) {
            return res.status(403).json({
                success: false,
                message: 'Acción prohibida: Un administrador no puede eliminarse a sí mismo.'
            });
        }

        const [result] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'No se pudo eliminar el usuario' });
        }

        res.json({
            success: true,
            message: `Usuario ${usuario.nombre} ${usuario.apellido} eliminado correctamente`
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el usuario' });
    }
};

// ─── POST /api/usuarios/login — Login Unificado ────────────────────────
exports.login = async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    email = String(email).trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    if (!validarFormatoEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Por favor ingresa un correo electrónico válido con dominio completo (ej. usuario@gmail.com).'
        });
    }

    try {
        const [usuarios] = await db.query(
            `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                    es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                    objetivo, nivel_entrenamiento, activo, email_verificado 
             FROM usuarios WHERE LOWER(TRIM(email)) = LOWER(?)`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
        }

        const usuario = usuarios[0];
        const matchUser = await verifyPassword(cleanPassword, usuario.password);

        if (!matchUser) {
            return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
        }

        const normalized = normalizeUsuario(usuario);
        const { password: _pw, ...usuarioSafe } = normalized;

        if (Number(usuario.email_verificado) === 0) {
            return res.status(403).json({
                success: false,
                email_no_verificado: true,
                message: 'Debes verificar tu correo electrónico antes de ingresar.',
                data: usuarioSafe
            });
        }

        if (usuario.activo === 0) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta se encuentra deshabilitada. Contacta al administrador.'
            });
        }

        return res.json({
            success: true,
            data: usuarioSafe
        });
    } catch (error) {
        console.error('Error detallado en login:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error al consultar la tabla de usuarios',
            error: error.message
        });
    }
};

// ─── POST /api/usuarios/verificar-email — Verificar email ─────────────────
exports.verificarEmail = async (req, res) => {
    let { email, codigo } = req.body;

    if (!email || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'El campo email es requerido' });
    }
    if (!validarFormatoEmail(email)) {
        return res.status(400).json({ success: false, message: 'El formato del correo electrónico no es válido.' });
    }
    if (!codigo) {
        return res.status(400).json({ success: false, message: 'El código es requerido' });
    }

    email = email.trim().toLowerCase();

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? OR email_pendiente = ?',
            [email, email]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        if (usuario.email_verificado === 1 && !usuario.email_pendiente) {
            return res.status(400).json({ success: false, message: 'El email ya está verificado' });
        }

        if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo.toString()) {
            return res.status(400).json({ success: false, message: 'El código ingresado es incorrecto.' });
        }

        const [vigentes] = await db.query(
            'SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND codigo_expira >= NOW()',
            [usuario.id_usuario]
        );
        if (vigentes.length === 0) {
            return res.status(400).json({ success: false, message: 'El código de verificación ha vencido. Debes solicitar uno nuevo.' });
        }

        if (usuario.email_pendiente) {
            const nuevoEmail = usuario.email_pendiente;
            const [dups] = await db.query(
                'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?',
                [nuevoEmail, usuario.id_usuario]
            );
            if (dups.length > 0) {
                return res.status(409).json({ success: false, message: 'El nuevo correo electrónico ya está registrado por otra cuenta.' });
            }

            await db.query(
                `UPDATE usuarios SET
                    email = ?,
                    email_pendiente = NULL,
                    email_verificado = 1,
                    activo = 1,
                    codigo_verificacion = NULL,
                    codigo_expira = NULL
                 WHERE id_usuario = ?`,
                [nuevoEmail, usuario.id_usuario]
            );

            return res.json({
                success: true,
                message: 'Correo electrónico verificado y actualizado correctamente.',
                nuevoEmail
            });
        }

        await db.query(
            'UPDATE usuarios SET email_verificado = 1, activo = 1, codigo_verificacion = NULL, codigo_expira = NULL WHERE id_usuario = ?',
            [usuario.id_usuario]
        );

        res.json({ success: true, message: 'Email verificado correctamente' });
    } catch (error) {
        console.error('Error SQL al verificar email:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── POST /api/usuarios/reenviar-codigo — Reenviar código ─────────────────
exports.reenviarCodigo = async (req, res) => {
    let { email } = req.body;

    if (!email || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'El campo email es requerido' });
    }
    if (!validarFormatoEmail(email)) {
        return res.status(400).json({ success: false, message: 'El formato del correo electrónico no es válido.' });
    }

    email = email.trim().toLowerCase();

    try {
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? OR email_pendiente = ?',
            [email, email]
        );
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        if (usuario.email_verificado === 1 && !usuario.email_pendiente) {
            return res.status(400).json({ success: false, message: 'El email ya está verificado' });
        }

        if (usuario.ultimo_reenvio) {
            const [diffRows] = await db.query(
                'SELECT TIMESTAMPDIFF(SECOND, ultimo_reenvio, NOW()) AS diff FROM usuarios WHERE id_usuario = ?',
                [usuario.id_usuario]
            );
            const diff = diffRows[0]?.diff;
            if (diff !== null && diff !== undefined && diff >= 0 && diff < 60) {
                const tiempoFaltante = 60 - diff;
                return res.status(400).json({
                    success: false,
                    message: `Debes esperar ${tiempoFaltante} segundos antes de solicitar otro código.`
                });
            }
        }

        const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            'UPDATE usuarios SET codigo_verificacion = ?, codigo_expira = DATE_ADD(NOW(), INTERVAL 15 MINUTE), ultimo_reenvio = NOW() WHERE id_usuario = ?',
            [nuevoCodigo, usuario.id_usuario]
        );

        const emailDestino = usuario.email_pendiente || usuario.email;
        enviarCodigoVerificacion(emailDestino, nuevoCodigo).catch(err => console.error('Error enviando email:', err));

        res.json({ success: true, message: 'Código reenviado con éxito. Revisa tu casilla de correo.' });
    } catch (error) {
        console.error('Error al reenviar código:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── GET /api/usuarios/perfil — Obtener perfil del usuario ──────────────────
exports.getPerfil = async (req, res) => {
    const id = req.query.id || req.headers['x-user-id'];
    const email = req.query.email;

    try {
        let rows = [];
        if (id) {
            [rows] = await db.query(
                `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                        es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                        objetivo, nivel_entrenamiento, activo, email_verificado 
                 FROM usuarios WHERE id_usuario = ?`,
                [id]
            );
        } else if (email) {
            [rows] = await db.query(
                `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                        es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                        objetivo, nivel_entrenamiento, activo, email_verificado 
                 FROM usuarios WHERE email = ?`,
                [email.trim().toLowerCase()]
            );
        } else {
            [rows] = await db.query(
                `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                        es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                        objetivo, nivel_entrenamiento, activo, email_verificado 
                 FROM usuarios LIMIT 1`
            );
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil de usuario no encontrado' });
        }

        const usuario = rows[0];
        const data = normalizeUsuario(usuario);
        data.nombre_completo = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Atleta';

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        res.status(500).json({ success: false, message: 'Error al consultar el perfil', error: error.message });
    }
};

// ─── PUT /api/usuarios/perfil — Actualizar datos personales ─────────────────
exports.updatePerfil = async (req, res) => {
    const { id, id_usuario, nombre, apellido, peso, altura, objetivo, nivel_entrenamiento, fecha_nacimiento } = req.body;
    const userId = id || id_usuario || req.query.id || req.headers['x-user-id'];

    if (!userId) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido para actualizar el perfil' });
    }

    const errorFisico = validarCamposFisicos({ altura, peso });
    if (errorFisico) {
        return res.status(400).json({ success: false, message: errorFisico });
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
        if (peso !== undefined) {
            fields.push('peso = ?');
            values.push(peso != null && peso !== '' ? Number(peso) : null);
        }
        if (altura !== undefined) {
            fields.push('altura = ?');
            values.push(altura != null && altura !== '' ? Number(altura) : null);
        }
        if (objetivo !== undefined) {
            fields.push('objetivo = ?');
            values.push(objetivo);
        }
        if (nivel_entrenamiento !== undefined) {
            fields.push('nivel_entrenamiento = ?');
            values.push(nivel_entrenamiento);
        }
        if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && String(fecha_nacimiento).trim() !== '') {
            const errorEdad = validarEdad(fecha_nacimiento);
            if (errorEdad) {
                return res.status(400).json({ success: false, message: errorEdad });
            }
            fields.push('fecha_nacimiento = ?');
            values.push(formatearAFechaISO(fecha_nacimiento));
        }

        if (fields.length > 0) {
            values.push(userId);
            await db.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`, values);
        }

        const [rows] = await db.query(
            `SELECT id_usuario, nombre, apellido, email, email_pendiente, password, foto_perfil,
                    es_admin, es_atleta, fecha_nacimiento, edad, peso, altura,
                    objetivo, nivel_entrenamiento, activo, email_verificado 
             FROM usuarios WHERE id_usuario = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const data = normalizeUsuario(rows[0]);
        data.nombre_completo = `${rows[0].nombre || ''} ${rows[0].apellido || ''}`.trim() || 'Atleta';

        res.json({ success: true, message: 'Datos personales actualizados correctamente', data });
    } catch (error) {
        console.error('Error al actualizar datos personales:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el perfil', error: error.message });
    }
};

exports.cambiarPassword = async (req, res) => {
    const { id, id_usuario, password_actual, password, nueva_password } = req.body;
    const userId = id || id_usuario || req.headers['x-user-id'];
    const passwordNuevaFinal = nueva_password || password;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido para cambiar contraseña' });
    }

    if (!password_actual || !password_actual.trim()) {
        return res.status(400).json({ success: false, message: 'Debes ingresar tu contraseña actual.' });
    }

    if (!passwordNuevaFinal || !passwordNuevaFinal.trim()) {
        return res.status(400).json({ success: false, message: 'Debes ingresar la nueva contraseña.' });
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!PASSWORD_REGEX.test(passwordNuevaFinal)) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.'
        });
    }

    try {
        const [rows] = await db.query('SELECT id_usuario, password FROM usuarios WHERE id_usuario = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = rows[0];

        const coincide = typeof verifyPassword === 'function'
            ? await verifyPassword(password_actual, usuario.password)
            : await bcrypt.compare(password_actual, usuario.password);

        if (!coincide) {
            return res.status(400).json({ success: false, message: 'La contraseña actual ingresada es incorrecta.' });
        }

        const hashed = await bcrypt.hash(passwordNuevaFinal, 10);
        await db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hashed, userId]);

        res.json({
            success: true,
            message: '¡Contraseña actualizada exitosamente!'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ success: false, message: 'Error interno al cambiar la contraseña' });
    }
};