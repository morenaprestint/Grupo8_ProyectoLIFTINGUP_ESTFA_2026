const express = require('express');
const router = express.Router();
const ejerciciosController = require('../controllers/ejerciciosController');

router.get('/', ejerciciosController.getEjercicios);
router.post('/', ejerciciosController.createEjercicio);
router.put('/:id', ejerciciosController.updateEjercicio);
router.delete('/:id', ejerciciosController.deleteEjercicio);

module.exports = router;

