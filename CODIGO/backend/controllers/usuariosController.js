const db = require('../config/db');

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
    estado: u.activo === 1 || u.activo === true ? 'Activo' : 'Inactivo',
    activo: u.activo,
    id_admin: u.id_admin,
    rol: 'atleta'
});

// ─── GET /api/usuarios — Obtener todos ────────────────────────────────────
exports.getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios ORDER BY id_usuario ASC');
        const data = rows.map(normalizeUsuario);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// ─── GET /api/usuarios/:id — Obtener uno por ID ───────────────────────────
exports.getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [id]);
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

    try {
        // Verificar email duplicado
        const [existentes] = await db.query('SELECT id_usuario FROM Usuarios WHERE email = ?', [email]);
        if (existentes.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });
        }

        const [result] = await db.query(
            `INSERT INTO Usuarios 
                (nombre, apellido, email, password, peso, altura, 
                 objetivo, nivel_entrenamiento, activo, id_admin)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
                nombre, apellido, email, password,
                peso || null,
                altura || null,
                objetivo || null,
                nivel_entrenamiento || 'Principiante',
                id_admin || null
            ]
        );

        // Devolver el usuario creado completo
        const [newRows] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [result.insertId]);
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
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

    try {
        // Verificar que existe
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [id]);
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
            `UPDATE Usuarios SET
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
        const [updated] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [id]);
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
        const [usuarios] = await db.query('SELECT id_usuario, nombre, apellido FROM Usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        // Eliminar el usuario (las tablas relacionadas tienen ON DELETE CASCADE)
        const [result] = await db.query('DELETE FROM Usuarios WHERE id_usuario = ?', [id]);

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
            'SELECT * FROM Admins WHERE email = ? AND password = ?',
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

        // 2. Buscar en Usuarios
        const [usuarios] = await db.query(
            'SELECT * FROM Usuarios WHERE email = ? AND password = ? AND activo = 1',
            [email, password]
        );
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            const normalized = normalizeUsuario(usuario);
            const { password: _pw, ...usuarioSafe } = normalized;
            return res.json({ success: true, data: usuarioSafe });
        }

        // 3. No encontrado
        return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};
