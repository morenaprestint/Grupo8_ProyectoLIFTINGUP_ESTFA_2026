const express = require('express');
const router = express.Router();
const equipamientoController = require('../controllers/equipamientoController');
const upload = require('../middlewares/upload');

// Middleware tolerante para subidas multipart o JSON
const handleUpload = (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// ── GET /api/equipamiento — Consultar equipamiento ──
router.get('/', equipamientoController.getEquipamiento);

// ── POST /api/equipamiento — Guardar nueva máquina ──
router.post('/', handleUpload, equipamientoController.createEquipamiento);

// ── PUT /api/equipamiento/:id — Actualizar máquina ──
router.put('/:id', handleUpload, equipamientoController.updateEquipamiento);

// ── DELETE /api/equipamiento/:id — Eliminar máquina ──
router.delete('/:id', equipamientoController.deleteEquipamiento);

module.exports = router;
