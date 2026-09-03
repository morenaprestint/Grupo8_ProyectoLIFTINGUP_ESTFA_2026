const express = require('express');
const router = express.Router();
const rutinasController = require('../controllers/rutinasController');

router.get('/', rutinasController.getRutinas);
router.get('/:id', rutinasController.getRutinaById);
router.post('/', rutinasController.createRutina);
router.put('/:id', rutinasController.updateRutina);

module.exports = router;
