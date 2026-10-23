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

// Expresiones regulares de validación para equipamiento
const NOMBRE_MAQUINA_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.]{3,50}$/;
const ALFANUMERICO_OPCIONAL_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.\/]{1,100}$/;

const validarImagen = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) return true;
    const trimmed = url.trim();
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/') || trimmed.startsWith('blob:')) return true;
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) return true;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return trimmed.startsWith('/') || trimmed.startsWith('data:');
    }
};

// ─── POST /api/equipamiento — Registrar nueva máquina / equipo ─────────────
exports.createEquipamiento = async (req, res) => {
    const {
        nombre,
        marca,
        modelo,
        ubicacion,
        estatus,
        fecha_adquisicion
    } = req.body;

    const imagen_url = req.file ? `/uploads/${req.file.filename}` : req.body.imagen_url;

    // Validación estricta del nombre (3 a 50 caracteres alfanuméricos válidos)
    if (!nombre || typeof nombre !== 'string' || !NOMBRE_MAQUINA_REGEX.test(nombre.trim())) {
        return res.status(400).json({
            success: false,
            message: 'El nombre de la máquina debe tener entre 3 y 50 caracteres válidos sin caracteres extraños.'
        });
    }

    // Validación de campos opcionales alfanuméricos
    if (marca && typeof marca === 'string' && marca.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(marca.trim())) {
        return res.status(400).json({
            success: false,
            message: 'El campo marca solo permite caracteres alfanuméricos válidos.'
        });
    }
    if (modelo && typeof modelo === 'string' && modelo.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(modelo.trim())) {
        return res.status(400).json({
            success: false,
            message: 'El campo modelo solo permite caracteres alfanuméricos válidos.'
        });
    }
    if (ubicacion && typeof ubicacion === 'string' && ubicacion.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(ubicacion.trim())) {
        return res.status(400).json({
            success: false,
            message: 'El campo ubicación solo permite caracteres alfanuméricos válidos.'
        });
    }

    // Validación de URL o Base64 de imagen si se proporciona
    if (imagen_url && !validarImagen(imagen_url)) {
        return res.status(400).json({
            success: false,
            message: 'La imagen debe ser una URL válida (http/https) o una imagen en formato Base64 (data:image/...)'
        });
    }

    try {
        const estadoValido = (estatus === 'En Mantenimiento') ? 'En Mantenimiento' : 'Disponible';

        let fechaSql = null;
        if (fecha_adquisicion && String(fecha_adquisicion).trim() !== '') {
            const d = new Date(fecha_adquisicion);
            if (isNaN(d.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de adquisición no tiene un formato válido'
                });
            }
            const anio = d.getFullYear();
            if (anio < 2010 || anio > 2030) {
                return res.status(400).json({
                    success: false,
                    message: 'El año de adquisición debe estar entre 2010 y 2030'
                });
            }
            fechaSql = d.toISOString().slice(0, 10);
        }

        const [result] = await db.query(
            `INSERT INTO equipamiento 
                (nombre, marca, modelo, ubicacion, imagen_url, estatus, fecha_adquisicion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre.trim(),
                marca ? String(marca).trim() : null,
                modelo ? String(modelo).trim() : null,
                ubicacion ? String(ubicacion).trim() : null,
                imagen_url ? String(imagen_url).trim() : null,
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
        estatus,
        fecha_adquisicion
    } = req.body;

    const imagen_url = req.file ? `/uploads/${req.file.filename}` : req.body.imagen_url;

    try {
        // Verificar si existe el registro antes de actualizar
        const [existe] = await db.query('SELECT id FROM equipamiento WHERE id = ?', [id]);
        if (!existe || existe.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El equipamiento especificado no existe'
            });
        }

        const fields = [];
        const values = [];

        if (nombre !== undefined) {
            if (!nombre || typeof nombre !== 'string' || !NOMBRE_MAQUINA_REGEX.test(nombre.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la máquina debe tener entre 3 y 50 caracteres válidos sin caracteres extraños.'
                });
            }
            fields.push('nombre = ?');
            values.push(nombre.trim());
        }
        if (marca !== undefined) {
            if (marca && typeof marca === 'string' && marca.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(marca.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo marca solo permite caracteres alfanuméricos válidos.'
                });
            }
            fields.push('marca = ?');
            values.push(marca ? String(marca).trim() : null);
        }
        if (modelo !== undefined) {
            if (modelo && typeof modelo === 'string' && modelo.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(modelo.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo modelo solo permite caracteres alfanuméricos válidos.'
                });
            }
            fields.push('modelo = ?');
            values.push(modelo ? String(modelo).trim() : null);
        }
        if (ubicacion !== undefined) {
            if (ubicacion && typeof ubicacion === 'string' && ubicacion.trim() && !ALFANUMERICO_OPCIONAL_REGEX.test(ubicacion.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo ubicación solo permite caracteres alfanuméricos válidos.'
                });
            }
            fields.push('ubicacion = ?');
            values.push(ubicacion ? String(ubicacion).trim() : null);
        }
        if (imagen_url !== undefined) {
            if (imagen_url && !validarImagen(imagen_url)) {
                return res.status(400).json({
                    success: false,
                    message: 'La imagen debe ser una URL válida (http/https) o una imagen en formato Base64 (data:image/...)'
                });
            }
            fields.push('imagen_url = ?');
            values.push(imagen_url ? String(imagen_url).trim() : null);
        }
        if (estatus !== undefined) {
            fields.push('estatus = ?');
            values.push(estatus === 'En Mantenimiento' ? 'En Mantenimiento' : 'Disponible');
        }
        if (fecha_adquisicion !== undefined) {
            let fechaSql = null;
            if (fecha_adquisicion && String(fecha_adquisicion).trim() !== '') {
                const d = new Date(fecha_adquisicion);
                if (isNaN(d.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'La fecha de adquisición no tiene un formato válido'
                    });
                }
                const anio = d.getFullYear();
                if (anio < 2010 || anio > 2030) {
                    return res.status(400).json({
                        success: false,
                        message: 'El año de adquisición debe estar entre 2010 y 2030'
                    });
                }
                fechaSql = d.toISOString().slice(0, 10);
            }
            fields.push('fecha_adquisicion = ?');
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
        const [existe] = await db.query('SELECT id FROM equipamiento WHERE id = ?', [id]);
        if (!existe || existe.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El equipamiento no existe o ya fue eliminado'
            });
        }

        await db.query('DELETE FROM equipamiento WHERE id = ?', [id]);
        res.json({ success: true, message: 'Máquina eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar equipamiento:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el equipamiento' });
    }
};