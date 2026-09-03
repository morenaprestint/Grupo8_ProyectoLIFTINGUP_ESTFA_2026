const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// ── POST /api/usuarios/login — debe ir ANTES de /:id ──
router.post('/login', usuariosController.login);

// ── GET /api/usuarios — Obtener todos los usuarios ──
router.get('/', usuariosController.getUsuarios);

// ── GET /api/usuarios/:id — Obtener un usuario por ID ──
router.get('/:id', usuariosController.getUsuarioById);

// ── POST /api/usuarios — Crear un nuevo usuario ──
router.post('/', usuariosController.createUsuario);

// ── PUT /api/usuarios/:id — Actualizar un usuario ──
router.put('/:id', usuariosController.updateUsuario);

// ── POST /api/usuarios/verificar-email — Verificar email ──
router.post('/verificar-email', usuariosController.verificarEmail);

// ── POST /api/usuarios/reenviar-codigo — Reenviar código ──
router.post('/reenviar-codigo', usuariosController.reenviarCodigo);

// ── DELETE /api/usuarios/:id — Eliminar un usuario ──
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
