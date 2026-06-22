const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importar Rutas
const usuariosRoutes = require('./routes/usuarios');

// Rutas base
app.use('/api/usuarios', usuariosRoutes);

app.get('/', (req, res) => {
    res.send('Servidor API LIFTING UP funcionando correctamente');
});

// Configuración del puerto
const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});