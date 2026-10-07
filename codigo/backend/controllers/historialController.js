const db = require('../config/db');

// POST /api/historial - Registrar una sesión de entrenamiento completada
exports.createHistorial = async (req, res) => {
    try {
        const { id_usuario, id_rutina, duracion_segundos, peso_maximo, kilos_totales } = req.body;

        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: 'El id_usuario es obligatorio para registrar la sesión'
            });
        }

        const query = `
            INSERT INTO historial_entrenamientos 
            (id_usuario, id_rutina, fecha, duracion_segundos, peso_maximo, kilos_totales) 
            VALUES (?, ?, NOW(), ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            id_usuario,
            id_rutina || null,
            Number(duracion_segundos) || 0,
            Number(peso_maximo) || 0,
            Number(kilos_totales) || 0
        ]);

        res.status(201).json({
            success: true,
            message: 'Sesión de entrenamiento registrada correctamente',
            data: {
                id_historial: result.insertId,
                id_usuario,
                id_rutina,
                duracion_segundos,
                peso_maximo,
                kilos_totales
            }
        });
    } catch (error) {
        console.error('Error al registrar historial de entrenamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al registrar el entrenamiento',
            error: error.message
        });
    }
};

// GET /api/historial/:id_usuario - Obtener todas las sesiones finalizadas del usuario
exports.getHistorialByUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: 'Parámetro id_usuario no proporcionado'
            });
        }

        const query = `
            SELECT 
                h.id_historial,
                h.id_usuario,
                h.id_rutina,
                h.fecha,
                h.duracion_segundos,
                h.peso_maximo,
                h.kilos_totales,
                COALESCE(r.nombre, 'Entrenamiento Libre') AS nombre_rutina,
                r.descripcion AS descripcion_rutina
            FROM historial_entrenamientos h
            LEFT JOIN rutinas r ON h.id_rutina = r.id_rutina
            WHERE h.id_usuario = ?
            ORDER BY h.fecha DESC
        `;

        const [rows] = await db.query(query, [id_usuario]);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener historial del atleta:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor al obtener el historial',
            error: error.message
        });
    }
};
