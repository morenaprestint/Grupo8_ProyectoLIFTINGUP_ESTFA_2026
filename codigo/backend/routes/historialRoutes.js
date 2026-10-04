const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');

// POST /api/historial - Registrar sesión completada
router.post('/', historialController.createHistorial);

// GET /api/historial/:id_usuario - Obtener sesiones del usuario
router.get('/:id_usuario', historialController.getHistorialByUsuario);

module.exports = router;
