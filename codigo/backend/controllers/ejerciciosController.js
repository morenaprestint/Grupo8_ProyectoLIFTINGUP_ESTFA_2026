const db = require('../config/db');

// ─── Helper: validación estricta de URL web ─────────────────────────────
const esUrlValida = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const trimmed = urlStr.trim();
    if (!trimmed) return false;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

exports.getEjercicios = async (req, res) => {
    const { grupo, grupo_muscular } = req.query;
    try {
        let query = 'SELECT * FROM ejercicios';
        let params = [];

        // Permitir filtrar opcionalmente por grupo muscular desde el frontend
        const filtroGrupo = grupo || grupo_muscular;
        if (filtroGrupo && String(filtroGrupo).trim() !== '') {
            query += ' WHERE grupo_muscular LIKE ?';
            params.push(`%${String(filtroGrupo).trim()}%`);
        }

        query += ' ORDER BY nombre ASC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener ejercicios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ejercicios' });
    }
};

exports.createEjercicio = async (req, res) => {
    const { nombre, grupo_muscular, descripcion, gif } = req.body;
    try {
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre del ejercicio es obligatorio' });
        }

        // Validación estricta de URL en GIF demostrativo si se provee
        if (gif !== undefined && gif !== null && String(gif).trim() !== '') {
            if (!esUrlValida(gif)) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace del GIF demostrativo debe ser una URL web válida (utilizando http:// o https://).'
                });
            }
        }

        const gifValido = gif && String(gif).trim() !== '' ? gif.trim() : null;

        const [result] = await db.query(
            'INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, gif) VALUES (?, ?, ?, ?)',
            [nombre.trim(), grupo_muscular?.trim() || null, descripcion?.trim() || null, gifValido]
        );
        res.status(201).json({ success: true, data: { id_ejercicio: result.insertId, ...req.body, gif: gifValido } });
    } catch (error) {
        console.error('Error al crear ejercicio:', error);
        res.status(500).json({ success: false, message: 'Error al crear ejercicio' });
    }
};

exports.updateEjercicio = async (req, res) => {
    const { id } = req.params;
    const { nombre, grupo_muscular, descripcion, gif } = req.body;
    try {
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre del ejercicio es obligatorio' });
        }

        // Validación estricta de URL en GIF demostrativo si se provee
        if (gif !== undefined && gif !== null && String(gif).trim() !== '') {
            if (!esUrlValida(gif)) {
                return res.status(400).json({
                    success: false,
                    message: 'El enlace del GIF demostrativo debe ser una URL web válida (utilizando http:// o https://).'
                });
            }
        }

        const gifValido = gif && String(gif).trim() !== '' ? gif.trim() : null;

        await db.query(
            'UPDATE ejercicios SET nombre = ?, grupo_muscular = ?, descripcion = ?, gif = ? WHERE id_ejercicio = ?',
            [nombre.trim(), grupo_muscular?.trim() || null, descripcion?.trim() || null, gifValido, id]
        );
        res.json({ success: true, message: 'Ejercicio actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar ejercicio:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar ejercicio' });
    }
};

exports.deleteEjercicio = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM ejercicios WHERE id_ejercicio = ?', [id]);
        res.json({ success: true, message: 'Ejercicio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar ejercicio:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar ejercicio' });
    }
};