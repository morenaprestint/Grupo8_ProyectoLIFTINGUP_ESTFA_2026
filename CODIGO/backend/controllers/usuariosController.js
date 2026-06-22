const db = require('../config/db');

// Obtener todos los usuarios (Prueba de lectura)
exports.getUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Usuarios');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// Crear un nuevo usuario (Prueba de inserción)
exports.createUsuario = async (req, res) => {
    const { id_usuario, nombre, apellido, email, password } = req.body;
    
    try {
        const [result] = await db.query(
            'INSERT INTO Usuarios (id_usuario, nombre, apellido, email, password, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [id_usuario, nombre, apellido, email, password, 1] // 1 para activo por defecto
        );
        res.status(201).json({ success: true, message: 'Usuario creado exitosamente', data: result });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ success: false, message: 'Error al crear el usuario' });
    }
};

// Login para Admin o Usuario
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Buscar en Admins
        const [admins] = await db.query('SELECT * FROM Admins WHERE email = ? AND password = ?', [email, password]);
        if (admins.length > 0) {
            const admin = admins[0];
            return res.json({ success: true, data: { ...admin, rol: 'admin', id: admin.id_admin } });
        }

        // 2. Buscar en Usuarios
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE email = ? AND password = ?', [email, password]);
        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            return res.json({ success: true, data: { ...usuario, rol: 'usuario', id: usuario.id_usuario } });
        }

        // 3. No encontrado
        return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
};

// Actualizar un usuario
exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, password, fecha_nacimiento, edad, peso, altura, objetivo, nivel_entrenamiento, estado } = req.body;
    
    // Convertir estado a activo booleano
    let activo = null;
    if (estado !== undefined) {
        activo = estado === 'Activo' || estado === true || estado === 1 ? 1 : 0;
    }

    try {
        const [usuarios] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [id]);
        if (usuarios.length === 0) {
             return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        await db.query(
            `UPDATE Usuarios SET 
                nombre = COALESCE(?, nombre), 
                apellido = COALESCE(?, apellido), 
                email = COALESCE(?, email), 
                password = COALESCE(?, password), 
                fecha_nacimiento = COALESCE(?, fecha_nacimiento), 
                edad = COALESCE(?, edad), 
                peso = COALESCE(?, peso), 
                altura = COALESCE(?, altura), 
                objetivo = COALESCE(?, objetivo), 
                nivel_entrenamiento = COALESCE(?, nivel_entrenamiento),
                activo = COALESCE(?, activo)
            WHERE id_usuario = ?`,
            [
                nombre || null, 
                apellido || null, 
                email || null, 
                password || null, 
                fecha_nacimiento || null, 
                edad || null, 
                peso || null, 
                altura || null, 
                objetivo || null, 
                nivel_entrenamiento || null,
                activo,
                id
            ]
        );

        res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el usuario' });
    }
};

// Eliminar un usuario
exports.deleteUsuario = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM Usuarios WHERE id_usuario = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        
        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el usuario' });
    }
};
