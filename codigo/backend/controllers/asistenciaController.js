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

        // Tomar la fecha enviada por el frontend o usar la actual si viene vacía
        const fechaRegistro = fecha || new Date().toISOString().slice(0, 10);

        // 1. Validar si ya existe asistencia registrada PARA ESA FECHA ESPECÍFICA
        const [asistenciaExistente] = await db.query(
            `SELECT id_asistencia FROM asistencias 
             WHERE id_usuario = ? AND DATE(fecha) = ?`,
            [id_usuario, fechaRegistro]
        );

        if (asistenciaExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Ya has registrado tu asistencia para el día ${fechaRegistro}.`
            });
        }

        // 2. Insertar la fecha exacta que seleccionó el atleta (o el día actual)
        const [result] = await db.query(
            'INSERT INTO asistencias (id_usuario, fecha) VALUES (?, ?)',
            [id_usuario, fechaRegistro]
        );

        const [newRow] = await db.query(
            "SELECT a.id_asistencia, a.id_usuario, a.fecha, DATE_FORMAT(a.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_formateada FROM asistencias a WHERE a.id_asistencia = ?",
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Asistencia registrada con éxito',
            data: newRow[0] || { id_asistencia: result.insertId, id_usuario, fecha: fechaRegistro }
        });
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al registrar asistencia' });
    }
};

exports.deleteAsistencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_usuario, fecha } = req.query || {};

        let query = 'DELETE FROM asistencias WHERE ';
        const params = [];

        if (id) {
            query += 'id_asistencia = ?';
            params.push(id);
        } else if (id_usuario && fecha) {
            query += 'id_usuario = ? AND DATE(fecha) = ?';
            params.push(id_usuario, fecha);
        } else if (id_usuario) {
            query += 'id_usuario = ?';
            params.push(id_usuario);
        } else {
            return res.status(400).json({ success: false, message: 'Faltan parámetros para eliminar la asistencia' });
        }

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró el registro de asistencia para eliminar' });
        }

        res.json({
            success: true,
            message: 'Asistencia eliminada con éxito'
        });
    } catch (error) {
        console.error('Error al eliminar asistencia:', error);
        res.status(500).json({ success: false, message: error.message || 'Error al eliminar asistencia' });
    }
};