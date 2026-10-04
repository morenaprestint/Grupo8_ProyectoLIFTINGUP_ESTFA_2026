const db = require('../config/db');
const { enviarCodigoVerificacion } = require('../services/emailService');



// ─── Helper: normalizar usuario para el frontend ───────────────────────────
// El frontend espera { id, nombre, apellido, email, ... }
// La BD retorna { id_usuario, nombre, apellido, email, ... }
const normalizeUsuario = (u) => ({
    id: u.id_usuario,
    id_usuario: u.id_usuario,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    password: u.password,
    peso: u.peso,
    altura: u.altura,
    objetivo: u.objetivo,
    nivel_entrenamiento: u.nivel_entrenamiento,
    email_verificado: u.email_verificado,
    estado: u.activo === 1 || u.activo === true ? 'Activo' : 'Inactivo',
    activo: u.activo,
    id_admin: u.id_admin,
    rol: 'atleta'
});

// ─── GET /api/usuarios — Obtener todos ────────────────────────────────────
exports.getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios ORDER BY id_usuario ASC'
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
        const [rows] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
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
        objetivo, nivel_entrenamiento, id_admin
    } = req.body;

    // Validaciones mínimas
    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, apellido, email y contraseña son obligatorios'
        });
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
        });
    }

    try {
        // Verificar email duplicado
        const [existentes] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
        if (existentes.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });
        }

        const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const codigo_expira = new Date(Date.now() + 15 * 60000);
        const ultimo_reenvio = new Date();

        const [result] = await db.query(
            `INSERT INTO usuarios 
                (nombre, apellido, email, password, peso, altura, 
                 objetivo, nivel_entrenamiento, activo, id_admin,
                 email_verificado, codigo_verificacion, codigo_expira, ultimo_reenvio)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?, ?, ?)`,
            [
                nombre, apellido, email, password,
                peso || null,
                altura || null,
                objetivo || null,
                nivel_entrenamiento || 'Principiante',
                id_admin || null,
                codigo_verificacion,
                codigo_expira,
                ultimo_reenvio
            ]
        );

        // Enviar código por correo
        enviarCodigoVerificacion(email, codigo_verificacion).catch(err => console.error('Error enviando email:', err));

        // Devolver el usuario creado completo
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

// ─── PUT /api/usuarios/:id — Actualizar usuario ───────────────────────────
exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const {
        nombre, apellido, email, password,
        peso, altura,
        objetivo, nivel_entrenamiento, estado, activo
    } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: 'La contraseña es obligatoria al editar el usuario.' });
    }

    try {
        // Verificar que existe
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Resolver campo activo
        let activoVal = null;
        if (activo !== undefined) {
            activoVal = activo === true || activo === 1 ? 1 : 0;
        } else if (estado !== undefined) {
            activoVal = (estado === 'Activo' || estado === true || estado === 1) ? 1 : 0;
        }

        await db.query(
            `UPDATE usuarios SET
                nombre               = COALESCE(?, nombre),
                apellido             = COALESCE(?, apellido),
                email                = COALESCE(?, email),
                password             = COALESCE(?, password),
                peso                 = COALESCE(?, peso),
                altura               = COALESCE(?, altura),
                objetivo             = COALESCE(?, objetivo),
                nivel_entrenamiento  = COALESCE(?, nivel_entrenamiento),
                activo               = COALESCE(?, activo)
            WHERE id_usuario = ?`,
            [
                nombre || null,
                apellido || null,
                email || null,
                password || null,
                peso || null,
                altura || null,
                objetivo || null,
                nivel_entrenamiento || null,
                activoVal,
                id
            ]
        );

        // Devolver el usuario actualizado
        const [updated] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: normalizeUsuario(updated[0])
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
    }
};

// ─── DELETE /api/usuarios/:id — Eliminar usuario ──────────────────────────
exports.deleteUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar que existe antes de borrar
        const [usuarios] = await db.query('SELECT id_usuario, nombre, apellido FROM usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        // Eliminar el usuario (las tablas relacionadas tienen ON DELETE CASCADE)
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

// ─── POST /api/usuarios/login — Login Admin o Atleta ─────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    try {
        // 1. Buscar en Admins
        const [admins] = await db.query(
            'SELECT * FROM admins WHERE email = ? AND password = ?',
            [email, password]
        );
        if (admins.length > 0) {
            const admin = admins[0];
            const { password: _pw, ...adminSafe } = admin;
            return res.json({
                success: true,
                data: {
                    ...adminSafe,
                    id: admin.id_admin,
                    rol: 'admin'
                }
            });
        }

        // 2. Buscar en Usuarios (sin filtrar activo ni verificado en el WHERE)
        const [usuarios] = await db.query(
            'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios WHERE email = ? AND password = ?',
            [email, password]
        );

        if (usuarios.length > 0) {
            const usuario = usuarios[0];

            // Si la cuenta está deshabilitada administrativamente
            if (usuario.activo === 0 && usuario.email_verificado === 1) {
                return res.status(403).json({
                    success: false,
                    message: 'Tu cuenta se encuentra deshabilitada.'
                });
            }

            const normalized = normalizeUsuario(usuario);
            const { password: _pw, ...usuarioSafe } = normalized;

            // Retornamos 200 siempre que el usuario y la contraseña coincidan.
            // El objeto incluye email_verificado (0 o 1) para que el frontend decida si va a /home o /verify-email.
            return res.json({
                success: true,
                data: usuarioSafe
            });
        }

        // 3. Credenciales incorrectas
        return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
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
    console.log("Req Body recibida:", req.body);
    let { email, codigo } = req.body;

    if (!email || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'El campo email es requerido' });
    }
    if (!codigo) {
        return res.status(400).json({ success: false, message: 'El código es requerido' });
    }

    email = email.trim().toLowerCase();

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        if (usuario.email_verificado === 1) {
            return res.status(400).json({ success: false, message: 'El email ya está verificado' });
        }

        if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo.toString()) {
            return res.status(400).json({ success: false, message: 'El código ingresado es incorrecto.' });
        }

        if (new Date(usuario.codigo_expira) < new Date()) {
            return res.status(400).json({ success: false, message: 'El código venció. Solicitá uno nuevo.' });
        }

        await db.query(
            'UPDATE usuarios SET email_verificado = 1, activo = 1, codigo_verificacion = NULL, codigo_expira = NULL WHERE email = ?',
            [email]
        );

        res.json({ success: true, message: 'Email verificado correctamente' });
    } catch (error) {
        console.error('Error SQL al verificar email:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── POST /api/usuarios/reenviar-codigo — Reenviar código ─────────────────
exports.reenviarCodigo = async (req, res) => {
    console.log("Req Body recibida:", req.body);
    let { email } = req.body;

    if (!email || email.trim() === '') {
        return res.status(400).json({ success: false, message: 'El campo email es requerido' });
    }

    email = email.trim().toLowerCase();

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        if (usuario.email_verificado === 1) {
            return res.status(400).json({ success: false, message: 'El email ya está verificado' });
        }

        if (usuario.ultimo_reenvio) {
            const tiempoTranscurrido = new Date() - new Date(usuario.ultimo_reenvio);
            const tiempoMinimo = 60 * 1000; // 60 segundos
            if (tiempoTranscurrido < tiempoMinimo) {
                const tiempoFaltante = Math.ceil((tiempoMinimo - tiempoTranscurrido) / 1000);
                return res.status(400).json({
                    success: false,
                    message: `Debes esperar ${tiempoFaltante} segundos antes de solicitar otro código.`
                });
            }
        }

        const codigo_verificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const codigo_expira = new Date(Date.now() + 15 * 60000);
        const ultimo_reenvio = new Date();

        await db.query(
            'UPDATE usuarios SET codigo_verificacion = ?, codigo_expira = ?, ultimo_reenvio = ? WHERE email = ?',
            [codigo_verificacion, codigo_expira, ultimo_reenvio, email]
        );

        // Enviar nuevo código
        enviarCodigoVerificacion(email, codigo_verificacion).catch(err => console.error('Error enviando email:', err));

        res.json({ success: true, message: 'Código reenviado correctamente' });
    } catch (error) {
        console.error('Error SQL al reenviar código:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── GET /api/usuarios/perfil — Obtener perfil del usuario atleta ────────────
exports.getPerfil = async (req, res) => {
    const id = req.query.id || req.headers['x-user-id'];
    const email = req.query.email;

    try {
        let rows = [];
        if (id) {
            [rows] = await db.query(
                'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios WHERE id_usuario = ?',
                [id]
            );
        } else if (email) {
            [rows] = await db.query(
                'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios WHERE email = ?',
                [email]
            );
        } else {
            [rows] = await db.query(
                'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios LIMIT 1'
            );
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil de usuario no encontrado' });
        }

        const usuario = rows[0];
        const data = {
            id: usuario.id_usuario,
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre || '',
            apellido: usuario.apellido || '',
            nombre_completo: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Atleta',
            email: usuario.email || '',
            password: usuario.password || '',
            peso: usuario.peso != null ? Number(usuario.peso) : 82,
            altura: usuario.altura != null ? Number(usuario.altura) : 1.80,
            objetivo: usuario.objetivo,
            nivel_entrenamiento: usuario.nivel_entrenamiento,
            rol: 'atleta'
        };

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        res.status(500).json({ success: false, message: 'Error al consultar el perfil', error: error.message });
    }
};

// ─── PUT /api/usuarios/perfil — Actualizar perfil del usuario atleta ───────────
exports.updatePerfil = async (req, res) => {
    const { id, id_usuario, nombre, apellido, email, password, peso, altura } = req.body;
    const userId = id || id_usuario || req.query.id || req.headers['x-user-id'];

    if (!userId) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido para actualizar el perfil' });
    }

    try {
        const fields = [];
        const values = [];

        if (nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(nombre.trim());
        }
        if (apellido !== undefined) {
            fields.push('apellido = ?');
            values.push(apellido.trim());
        }
        if (email !== undefined) {
            fields.push('email = ?');
            values.push(email.trim().toLowerCase());
        }
        if (password !== undefined && password.trim() !== '') {
            fields.push('password = ?');
            values.push(password.trim());
        }
        if (peso !== undefined) {
            fields.push('peso = ?');
            values.push(Number(peso) || 0);
        }
        if (altura !== undefined) {
            fields.push('altura = ?');
            values.push(Number(altura) || 0);
        }

        if (fields.length > 0) {
            values.push(userId);
            await db.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id_usuario = ?`, values);
        }

        const [rows] = await db.query(
            'SELECT id_usuario, nombre, apellido, email, password, peso, altura, objetivo, nivel_entrenamiento, activo, id_admin, email_verificado FROM usuarios WHERE id_usuario = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = rows[0];
        const data = {
            id: usuario.id_usuario,
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre || '',
            apellido: usuario.apellido || '',
            nombre_completo: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Atleta',
            email: usuario.email || '',
            password: usuario.password || '',
            peso: usuario.peso != null ? Number(usuario.peso) : 82,
            altura: usuario.altura != null ? Number(usuario.altura) : 1.80,
            rol: 'atleta'
        };

        res.json({ success: true, message: 'Perfil actualizado correctamente', data });
    } catch (error) {
        console.error('Error al actualizar perfil de usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el perfil', error: error.message });
    }
};

