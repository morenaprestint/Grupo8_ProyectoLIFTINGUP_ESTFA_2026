const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');

const app = express();


app.use(cors({
    origin: [
        'https://liftingup.netlify.app',
        'http://localhost:5173',
        'https://localhost',
        'capacitor://localhost',
        'http://localhost'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos subidos físicamente (imágenes de perfil, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Importar Rutas
const usuariosRoutes = require('./routes/usuarios');
const adminsRoutes = require('./routes/adminsRoutes');
const rutinasRoutes = require('./routes/rutinas');
const asistenciaRoutes = require('./routes/asistencia');
const ejerciciosRoutes = require('./routes/ejercicios');
const historialRoutes = require('./routes/historialRoutes');
const equipamientoRoutes = require('./routes/equipamientoRoutes');

// Registrar Rutas base
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/equipamiento', equipamientoRoutes);

app.get('/', (req, res) => {
    res.send('Servidor API LIFTING UP funcionando correctamente');
});

// Middleware centralizado de manejo de errores (e.g. validación de Multer)
app.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Error en la solicitud'
        });
    }
    next();
});

// Configuración del puerto
const port = process.env.PORT || 5000;

app.listen(port, async () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    try {
        const db = require('./config/db');
        // 1. Asegurar columna email_pendiente en usuarios
        const [colsEmail] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'email_pendiente'");
        if (colsEmail.length === 0) {
            await db.query('ALTER TABLE usuarios ADD COLUMN email_pendiente VARCHAR(255) DEFAULT NULL');
            console.log('Columna email_pendiente verificada/creada en la base de datos.');
        }

        // 2. Asegurar columna fecha DATETIME en asistencias
        try {
            await db.query('ALTER TABLE asistencias MODIFY COLUMN fecha DATETIME DEFAULT CURRENT_TIMESTAMP');
            console.log('Tabla asistencias (fecha DATETIME DEFAULT CURRENT_TIMESTAMP) verificada.');
        } catch (errAsist) {
            console.warn('Aviso estructura asistencias:', errAsist.message);
        }

        // 3. Asegurar columna imagen_url LONGTEXT en equipamiento
        try {
            await db.query('ALTER TABLE equipamiento MODIFY COLUMN imagen_url LONGTEXT');
            console.log('Tabla equipamiento (imagen_url LONGTEXT) verificada.');
        } catch (errEquip) {
            console.warn('Aviso estructura equipamiento:', errEquip.message);
        }
    } catch (e) {
        console.warn('Aviso al verificar estructura de base de datos:', e.message);
    }
});