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
