const db = require('../config/db');

exports.getRutinas = async (req, res) => {
    try {
        const { id_usuario } = req.query;
        let query = 'SELECT * FROM rutinas';
        const params = [];
        if (id_usuario) {
            query += ' WHERE id_usuario = ? OR id_usuario IS NULL';
            params.push(id_usuario);
        }
        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener rutinas' });
    }
};

exports.getRutinaById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rutinas] = await db.query('SELECT * FROM rutinas WHERE id_rutina = ?', [id]);
        if (rutinas.length === 0) {
            return res.status(404).json({ success: false, message: 'Rutina no encontrada' });
        }
        const [ejercicios] = await db.query(`
            SELECT re.*, e.nombre, e.grupo_muscular, e.descripcion, e.gif 
            FROM rutina_ejercicio re
            JOIN ejercicios e ON re.id_ejercicio = e.id_ejercicio
            WHERE re.id_rutina = ?
        `, [id]);
        
        res.json({ success: true, data: { ...rutinas[0], ejercicios } });
    } catch (error) {
        console.error('Error al obtener rutina:', error);
        res.status(500).json({ success: false, message: 'Error al obtener rutina' });
    }
};

exports.createRutina = async (req, res) => {
    const { nombre, descripcion, id_usuario, es_favorita, dia_asignado, ejercicios } = req.body;
    try {
        // En la base de datos, rutinas puede no tener es_favorita y dia_asignado si no lo agregué.
        // Verificando `liftingup.sql`, `rutinas` tiene: id_rutina, nombre, descripcion, id_usuario.
        // Wait, the prompt says:
        // Tabla `rutinas`: `id_rutina`, `nombre`, `descripcion`, `id_usuario`, `es_favorita` (0 o 1), `dia_asignado` (ej. "Lunes", "Miércoles").
        // I need to alter the table if it's missing these columns, or assume they are added based on "estructura de la base de datos MySQL recién actualizada"
        
        const [result] = await db.query(
            'INSERT INTO rutinas (nombre, descripcion, id_usuario, es_favorita, dia_asignado) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion || null, id_usuario || null, es_favorita || 0, dia_asignado || null]
        );
        const id_rutina = result.insertId;

        if (ejercicios && ejercicios.length > 0) {
            const values = ejercicios.map(e => [id_rutina, e.id_ejercicio, e.series, e.repeticiones, e.peso || 0]);
            // Rutina_Ejercicio in db has: id_rutina, id_ejercicio, series, repeticiones. Wait, prompt says it has peso too.
            await db.query(
                'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES ?',
                [values]
            );
        }

        res.status(201).json({ success: true, data: { id_rutina, ...req.body } });
    } catch (error) {
        console.error('Error al crear rutina:', error);
        res.status(500).json({ success: false, message: 'Error al crear rutina' });
    }
};

exports.updateRutina = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, es_favorita, dia_asignado } = req.body;
    try {
        await db.query(
            'UPDATE rutinas SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), es_favorita = COALESCE(?, es_favorita), dia_asignado = COALESCE(?, dia_asignado) WHERE id_rutina = ?',
            [nombre, descripcion, es_favorita, dia_asignado, id]
        );
        res.json({ success: true, message: 'Rutina actualizada' });
    } catch (error) {
        console.error('Error al actualizar rutina:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar rutina' });
    }
};
