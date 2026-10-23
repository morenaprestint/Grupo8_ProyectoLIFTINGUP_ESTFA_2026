const express = require('express');
const router = express.Router();
const { getAsistencias, createAsistencia, deleteAsistencia } = require('../controllers/asistenciaController');

router.get('/', getAsistencias);
router.post('/', createAsistencia);
router.delete('/:id', deleteAsistencia);
router.delete('/', deleteAsistencia);

module.exports = router;