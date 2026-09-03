const db = require('../config/db');

exports.getAsistencias = async (req, res) => {
    try {
        const { id_usuario } = req.query;
        let query = 'SELECT * FROM asistencias';
        const params = [];
        if (id_usuario) {
            query += ' WHERE id_usuario = ?';
            params.push(id_usuario);
        }
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
        if (!id_usuario || !fecha) {
            return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });
        }
        const [result] = await db.query(
            'INSERT INTO asistencias (id_usuario, fecha) VALUES (?, ?)',
            [id_usuario, fecha]
        );
        res.status(201).json({ success: true, data: { id_asistencia: result.insertId, id_usuario, fecha } });
    } catch (error) {
        console.error('Error al crear asistencia:', error);
        res.status(500).json({ success: false, message: 'Error al crear asistencia' });
    }
};