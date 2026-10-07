const express = require('express');
const router = express.Router();
const equipamientoController = require('../controllers/equipamientoController');

// ── GET /api/equipamiento — Consultar equipamiento ──
router.get('/', equipamientoController.getEquipamiento);

// ── POST /api/equipamiento — Guardar nueva máquina ──
router.post('/', equipamientoController.createEquipamiento);

// ── PUT /api/equipamiento/:id — Actualizar máquina ──
router.put('/:id', equipamientoController.updateEquipamiento);

// ── DELETE /api/equipamiento/:id — Eliminar máquina ──
router.delete('/:id', equipamientoController.deleteEquipamiento);

module.exports = router;
