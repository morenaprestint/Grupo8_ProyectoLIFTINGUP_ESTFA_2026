const express = require('express');
const router = express.Router();
const { getAsistencias, createAsistencia } = require('../controllers/asistenciaController');

router.get('/', getAsistencias);
router.post('/', createAsistencia);

module.exports = router;