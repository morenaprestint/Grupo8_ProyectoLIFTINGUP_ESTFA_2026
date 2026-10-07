const db = require('../config/db');

// ─── GET /api/equipamiento — Obtener listado de equipamiento ────────────────
exports.getEquipamiento = async (req, res) => {
    try {
        const { estatus } = req.query;
        let query = 'SELECT * FROM equipamiento';
        const params = [];

        if (estatus) {
            query += ' WHERE estatus = ?';
            params.push(estatus);
        }

        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener equipamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al consultar el equipamiento',
            error: error.message
        });
    }
};

// ─── POST /api/equipamiento — Registrar nueva máquina / equipo ─────────────
exports.createEquipamiento = async (req, res) => {
    const {
        nombre,
        marca,
        modelo,
        ubicacion,
        imagen_url,
        estatus,
        fecha_adquisicion
    } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({
            success: false,
            message: 'El nombre de la máquina es obligatorio'
        });
    }

    try {
        const estadoValido = (estatus === 'En Mantenimiento') ? 'En Mantenimiento' : 'Disponible';
        let fechaSql = null;
        if (fecha_adquisicion && fecha_adquisicion.trim() !== '') {
            // Acepta formato YYYY-MM-DD o fechas parseables
            const d = new Date(fecha_adquisicion);
            if (!isNaN(d.getTime())) {
                fechaSql = d.toISOString().slice(0, 10);
            }
        }

        const [result] = await db.query(
            `INSERT INTO equipamiento 
                (nombre, marca, modelo, ubicacion, imagen_url, estatus, fecha_adquisicion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre.trim(),
                marca ? marca.trim() : null,
                modelo ? modelo.trim() : null,
                ubicacion ? ubicacion.trim() : null,
                imagen_url || null,
                estadoValido,
                fechaSql
            ]
        );

        const [newRow] = await db.query('SELECT * FROM equipamiento WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Máquina guardada exitosamente',
            data: newRow[0]
        });
    } catch (error) {
        console.error('Error al guardar equipamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el equipamiento',
            error: error.message
        });
    }
};

// ─── PUT /api/equipamiento/:id — Actualizar máquina / estatus ───────────────
exports.updateEquipamiento = async (req, res) => {
    const { id } = req.params;
    const {
        nombre,
        marca,
        modelo,
        ubicacion,
        imagen_url,
        estatus,
        fecha_adquisicion
    } = req.body;

    try {
        const fields = [];
        const values = [];

        if (nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(nombre.trim());
        }
        if (marca !== undefined) {
            fields.push('marca = ?');
            values.push(marca.trim());
        }
        if (modelo !== undefined) {
            fields.push('modelo = ?');
            values.push(modelo.trim());
        }
        if (ubicacion !== undefined) {
            fields.push('ubicacion = ?');
            values.push(ubicacion.trim());
        }
        if (imagen_url !== undefined) {
            fields.push('imagen_url = ?');
            values.push(imagen_url);
        }
        if (estatus !== undefined) {
            fields.push('estatus = ?');
            values.push(estatus === 'En Mantenimiento' ? 'En Mantenimiento' : 'Disponible');
        }
        if (fecha_adquisicion !== undefined) {
            fields.push('fecha_adquisicion = ?');
            let fechaSql = null;
            if (fecha_adquisicion && fecha_adquisicion.trim() !== '') {
                const d = new Date(fecha_adquisicion);
                if (!isNaN(d.getTime())) {
                    fechaSql = d.toISOString().slice(0, 10);
                }
            }
            values.push(fechaSql);
        }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar' });
        }

        values.push(id);
        await db.query(`UPDATE equipamiento SET ${fields.join(', ')} WHERE id = ?`, values);

        const [updated] = await db.query('SELECT * FROM equipamiento WHERE id = ?', [id]);
        res.json({
            success: true,
            message: 'Equipamiento actualizado correctamente',
            data: updated[0]
        });
    } catch (error) {
        console.error('Error al actualizar equipamiento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el equipamiento',
            error: error.message
        });
    }
};

// ─── DELETE /api/equipamiento/:id — Eliminar máquina ───────────────────────
exports.deleteEquipamiento = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM equipamiento WHERE id = ?', [id]);
        res.json({ success: true, message: 'Máquina eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar equipamiento:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el equipamiento' });
    }
};
