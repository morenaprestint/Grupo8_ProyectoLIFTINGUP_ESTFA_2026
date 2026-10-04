const db = require('../config/db');

exports.getRutinas = async (req, res) => {
    try {
        const { id_usuario, prearmadas, solo_usuario } = req.query;
        let query = 'SELECT * FROM rutinas';
        const params = [];

        if (prearmadas === 'true') {
            query += ' WHERE id_usuario IS NULL';
        } else if (solo_usuario === 'true' && id_usuario) {
            query += ' WHERE id_usuario = ?';
            params.push(id_usuario);
        } else if (id_usuario) {
            query += ' WHERE id_usuario = ? OR id_usuario IS NULL';
            params.push(id_usuario);
        }

        query += ' ORDER BY id_rutina DESC';
        const [rutinas] = await db.query(query, params);

        // Si hay rutinas, cargar los ejercicios vinculados a cada una
        if (rutinas.length > 0) {
            const rutinaIds = rutinas.map(r => r.id_rutina);
            const placeholders = rutinaIds.map(() => '?').join(',');
            const [ejercicios] = await db.query(`
                SELECT re.id_rutina, re.id_ejercicio, re.series, re.repeticiones, re.peso,
                       e.nombre, e.grupo_muscular, e.descripcion, e.gif
                FROM rutina_ejercicio re
                JOIN ejercicios e ON re.id_ejercicio = e.id_ejercicio
                WHERE re.id_rutina IN (${placeholders})
            `, rutinaIds);

            const mapEjercicios = {};
            ejercicios.forEach(ej => {
                if (!mapEjercicios[ej.id_rutina]) {
                    mapEjercicios[ej.id_rutina] = [];
                }
                mapEjercicios[ej.id_rutina].push(ej);
            });

            rutinas.forEach(r => {
                r.ejercicios = mapEjercicios[r.id_rutina] || [];
            });
        }

        res.json({ success: true, data: rutinas });
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener rutinas' });
    }
};

exports.getRutinaById = async (req, res) => {
    const id = req.params.id || req.params.id_rutina;
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
    const { nombre, descripcion, id_usuario, es_favorita, dia_asignado, ejercicios, peso } = req.body;

    // Validación: si el peso enviado supera los 2000 kg, retorna 400 antes de ejecutar la consulta SQL
    const pesoInvalido = (p) => p !== undefined && p !== null && Number(p) > 2000;
    if (pesoInvalido(peso) || (Array.isArray(ejercicios) && ejercicios.some(e => pesoInvalido(e.peso)))) {
        return res.status(400).json({ error: 'El peso no puede superar los 2000 kg.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO rutinas (nombre, descripcion, id_usuario, es_favorita, dia_asignado) VALUES (?, ?, ?, ?, ?)',
            [
                nombre,
                descripcion || null,
                id_usuario || null,
                es_favorita ? 1 : 0,
                dia_asignado || null
            ]
        );
        const id_rutina = result.insertId;

        if (Array.isArray(ejercicios) && ejercicios.length > 0) {
            for (const e of ejercicios) {
                const idEj = e.id_ejercicio || e.id;
                if (idEj) {
                    await db.query(
                        'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES (?, ?, ?, ?, ?)',
                        [
                            id_rutina,
                            idEj,
                            Number(e.series) || 3,
                            Number(e.repeticiones) || 10,
                            Number(e.peso) || 0
                        ]
                    );
                }
            }
        }

        res.status(201).json({ success: true, data: { id_rutina, ...req.body } });
    } catch (error) {
        console.error('Error al crear rutina:', error);
        res.status(500).json({ success: false, message: 'Error al crear rutina' });
    }
};

exports.updateRutina = async (req, res) => {
    const id = req.params.id || req.params.id_rutina;
    const { nombre, descripcion, es_favorita, dia_asignado, ejercicios, peso } = req.body;

    // Validación: si el peso enviado supera los 2000 kg, retorna 400 antes de ejecutar la consulta SQL
    const pesoInvalido = (p) => p !== undefined && p !== null && Number(p) > 2000;
    if (pesoInvalido(peso) || (Array.isArray(ejercicios) && ejercicios.some(e => pesoInvalido(e.peso)))) {
        return res.status(400).json({ error: 'El peso no puede superar los 2000 kg.' });
    }

    try {
        const fields = [];
        const values = [];

        if (nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(nombre);
        }
        if (descripcion !== undefined) {
            fields.push('descripcion = ?');
            values.push(descripcion);
        }
        if (es_favorita !== undefined) {
            fields.push('es_favorita = ?');
            values.push(es_favorita ? 1 : 0);
        }
        if (dia_asignado !== undefined) {
            fields.push('dia_asignado = ?');
            values.push(dia_asignado || null);
        }

        if (fields.length > 0) {
            values.push(id);
            await db.query(`UPDATE rutinas SET ${fields.join(', ')} WHERE id_rutina = ?`, values);
        }

        if (Array.isArray(ejercicios)) {
            await db.query('DELETE FROM rutina_ejercicio WHERE id_rutina = ?', [id]);
            for (const e of ejercicios) {
                const idEj = e.id_ejercicio || e.id;
                if (idEj) {
                    await db.query(
                        'INSERT INTO rutina_ejercicio (id_rutina, id_ejercicio, series, repeticiones, peso) VALUES (?, ?, ?, ?, ?)',
                        [
                            id,
                            idEj,
                            Number(e.series) || 3,
                            Number(e.repeticiones) || 10,
                            Number(e.peso) || 0
                        ]
                    );
                }
            }
        }

        res.json({ success: true, message: 'Rutina actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar rutina:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar rutina' });
    }
};

exports.deleteRutina = async (req, res) => {
    const id = req.params.id || req.params.id_rutina;
    try {
        await db.query('DELETE FROM rutina_ejercicio WHERE id_rutina = ?', [id]);
        await db.query('DELETE FROM rutinas WHERE id_rutina = ?', [id]);
        res.json({ success: true, message: 'Rutina eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar rutina:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar rutina' });
    }
};