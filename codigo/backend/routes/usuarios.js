const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const upload = require('../middlewares/upload');

// ── POST /api/usuarios/login — debe ir ANTES de /:id ──
router.post('/login', usuariosController.login);

// ── PUT /api/usuarios/cambiar-email — Cambio de correo con verificación de contraseña ──
router.put('/cambiar-email', usuariosController.cambiarEmail);

// ── PUT /api/usuarios/cambiar-password — Cambio de contraseña con contraseña actual ──
router.put('/cambiar-password', usuariosController.cambiarPassword);


// ── POST /api/usuarios/foto-perfil — Subida de foto de perfil (sin ID en URL) ──
router.post('/foto-perfil', upload.single('foto'), usuariosController.uploadFotoPerfil);

// ── POST /api/usuarios/:id/foto — Subida de foto de perfil por ID ──
router.post('/:id/foto', upload.single('foto'), usuariosController.uploadFotoPerfil);

// ── GET /api/usuarios/perfil — Obtener perfil del atleta ──
router.get('/perfil', usuariosController.getPerfil);

// ── PUT /api/usuarios/perfil — Actualizar perfil del atleta ──
router.put('/perfil', usuariosController.updatePerfil);

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
