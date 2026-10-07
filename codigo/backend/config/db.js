const mysql = require('mysql2/promise');
require('dotenv').config();

// Creamos un pool de conexiones para conectar a MySQL en Aiven
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
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
