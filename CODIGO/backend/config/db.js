const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos un pool de conexiones para mejorar el rendimiento y escalabilidad
const pool = mysql.createPool({
    port: process.env.DB_PORT || '3306',
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'maxi2008',
    database: process.env.DB_NAME || 'lifting_up',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificamos la conexión inicial
pool.getConnection()
    .then(connection => {
        console.log('Conexión a la base de datos MySQL establecida con éxito.');
        connection.release();
    })
    .catch(err => {
        console.error('Error al conectar con la base de datos:', err.message);
    });

module.exports = pool;
