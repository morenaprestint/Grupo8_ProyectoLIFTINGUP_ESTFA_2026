const db = require('../config/db');

exports.getEjercicios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ejercicios ORDER BY nombre ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener ejercicios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ejercicios' });
    }
};

exports.createEjercicio = async (req, res) => {
    const { nombre, grupo_muscular, descripcion, gif } = req.body;
    try {
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre del ejercicio es obligatorio' });
        }
        const [result] = await db.query(
            'INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, gif) VALUES (?, ?, ?, ?)',
            [nombre.trim(), grupo_muscular?.trim() || null, descripcion?.trim() || null, gif?.trim() || null]
        );
        res.status(201).json({ success: true, data: { id_ejercicio: result.insertId, ...req.body } });
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
        await db.query(
            'UPDATE ejercicios SET nombre = ?, grupo_muscular = ?, descripcion = ?, gif = ? WHERE id_ejercicio = ?',
            [nombre.trim(), grupo_muscular?.trim() || null, descripcion?.trim() || null, gif?.trim() || null, id]
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

