const db = require('../config/db');

// ─── POST /api/admins — Crear administrador ────────────────────────────────
exports.createAdmin = async (req, res) => {
    const { nombre, apellido, email, password } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, apellido, email y contraseña son obligatorios'
        });
    }

    try {
        // Verificar email duplicado en admins y en usuarios (opcional, pero buena práctica)
        const [adminsExistentes] = await db.query('SELECT id_admin FROM admins WHERE email = ?', [email]);
        if (adminsExistentes.length > 0) {
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });
        }

        const [result] = await db.query(
            `INSERT INTO admins (nombre, apellido, email, password) VALUES (?, ?, ?, ?)`,
            [nombre, apellido, email, password]
        );

        const [newRows] = await db.query('SELECT * FROM admins WHERE id_admin = ?', [result.insertId]);
        
        // Remover la contraseña antes de devolver los datos
        const adminData = newRows[0];
        const { password: _pw, ...adminSafe } = adminData;

        res.status(201).json({
            success: true,
            message: 'Administrador creado correctamente',
            data: {
                ...adminSafe,
                id: adminData.id_admin,
                rol: 'admin'
            }
        });
    } catch (error) {
        console.error('Error al crear administrador:', error);
        res.status(500).json({ success: false, message: 'Error al crear el administrador' });
    }
};

// ─── GET /api/admins — Obtener todos los administradores ───────────────────
exports.getAdmins = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_admin, nombre, apellido, email FROM admins ORDER BY id_admin ASC');
        
        // Mapear para añadir el rol explícito y el id que usa el frontend
        const data = rows.map(admin => ({
            ...admin,
            id: admin.id_admin,
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
            [rows] = await db.query('SELECT id_admin, nombre, apellido, email, password FROM admins WHERE id_admin = ?', [id]);
        } else if (email) {
            [rows] = await db.query('SELECT id_admin, nombre, apellido, email, password FROM admins WHERE email = ?', [email]);
        } else {
            [rows] = await db.query('SELECT id_admin, nombre, apellido, email, password FROM admins LIMIT 1');
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
    const { id, id_admin, nombre, apellido, email, password } = req.body;
    const adminId = id || id_admin || req.query.id || req.headers['x-user-id'];

    if (!adminId) {
        return res.status(400).json({ success: false, message: 'ID de administrador requerido' });
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

        if (fields.length > 0) {
            values.push(adminId);
            await db.query(`UPDATE admins SET ${fields.join(', ')} WHERE id_admin = ?`, values);
        }

        const [rows] = await db.query('SELECT id_admin, nombre, apellido, email, password FROM admins WHERE id_admin = ?', [adminId]);
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
                password: admin.password || '',
                rol: 'admin'
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil admin:', error);
        res.status(500).json({ success: false, message: 'Error del servidor', error: error.message });
    }
};

