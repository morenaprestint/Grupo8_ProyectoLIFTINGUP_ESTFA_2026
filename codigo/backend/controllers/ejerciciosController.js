const db = require('../config/db');

exports.getEjercicios = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ejercicios');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error al obtener ejercicios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ejercicios' });
    }
};

exports.createEjercicio = async (req, res) => {
    const { nombre, grupo_muscular, descripcion, gif } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO ejercicios (nombre, grupo_muscular, descripcion, gif) VALUES (?, ?, ?, ?)',
            [nombre, grupo_muscular || null, descripcion || null, gif || null]
        );
        res.status(201).json({ success: true, data: { id_ejercicio: result.insertId, ...req.body } });
    } catch (error) {
        console.error('Error al crear ejercicio:', error);
        res.status(500).json({ success: false, message: 'Error al crear ejercicio' });
    }
};
