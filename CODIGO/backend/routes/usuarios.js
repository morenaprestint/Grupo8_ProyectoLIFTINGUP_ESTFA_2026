const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Ruta para obtener todos los usuarios
router.get('/', usuariosController.getUsuarios);

// Ruta para login
router.post('/login', usuariosController.login);

// Ruta para crear un nuevo usuario
router.post('/', usuariosController.createUsuario);

// Ruta para actualizar un usuario
router.put('/:id', usuariosController.updateUsuario);

// Ruta para eliminar un usuario
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
