const db = require('../config/db');

exports.getAsistencias = async (req, res) => {
    try {
        const { id_usuario, fecha } = req.query;
        let query = `
            SELECT 
                a.id_asistencia, 
                a.id_usuario, 
                a.fecha, 
                DATE_FORMAT(a.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_formateada,
                u.nombre, 
                u.apellido, 
                u.email,
                COALESCE(CONCAT(u.nombre, ' ', u.apellido), u.nombre, u.email, 'Usuario') AS nombre_completo
            FROM asistencias a
            LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
        `;
        const params = [];
        const conditions = [];

        if (id_usuario) {
            conditions.push('a.id_usuario = ?');
            params.push(id_usuario);
        }
        if (fecha) {
            conditions.push('DATE(a.fecha) = ?');
            params.push(fecha);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY a.fecha DESC, a.id_asistencia DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener asistencias:', error);
        res.status(500).json({ success: false, message: 'Error al obtener asistencias' });
    }
};

exports.createAsistencia = async (req, res) => {
    const { id_usuario, fecha } = req.body;
    try {
        if (!id_usuario) {
            return res.status(400).json({ success: false, message: 'Falta el id de usuario' });
        }
        const fechaHora = fecha ? fecha : new Date();
        const [result] = await db.query(
            'INSERT INTO asistencias (id_usuario, fecha) VALUES (?, ?)',
            [id_usuario, fechaHora]
        );
        res.status(201).json({ success: true, data: { id_asistencia: result.insertId, id_usuario, fecha: fechaHora } });
    } catch (error) {
        console.error('Error al crear asistencia:', error);
        res.status(500).json({ success: false, message: 'Error al crear asistencia' });
    }
};