const express = require('express');
const router = express.Router();
const adminsController = require('../controllers/adminsController');

// ── GET /api/admins — Obtener todos los administradores ──
router.get('/', adminsController.getAdmins);

// ── POST /api/admins — Crear un nuevo administrador ──
router.post('/', adminsController.createAdmin);

module.exports = router;
