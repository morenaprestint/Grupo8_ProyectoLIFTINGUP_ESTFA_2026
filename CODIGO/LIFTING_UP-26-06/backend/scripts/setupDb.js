const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        // Conectar a MySQL sin seleccionar base de datos
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true // Necesario para ejecutar múltiples sentencias SQL desde un archivo
        });

        console.log('Conectado a MySQL.');

        // Crear la base de datos si no existe
        const dbName = process.env.DB_NAME || 'lifting_up';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Base de datos '${dbName}' creada o ya existente.`);

        // Usar la base de datos
        await connection.query(`USE \`${dbName}\`;`);

        // Leer el archivo SQL
        const sqlFilePath = path.join(__dirname, '..', 'lifting up.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');

        // Ejecutar el script SQL
        console.log('Ejecutando script SQL...');
        await connection.query(sqlScript);
        
        console.log('Script SQL importado correctamente.');
        await connection.end();
        console.log('Proceso finalizado. Puedes iniciar tu servidor.');

    } catch (error) {
        console.error('Error durante la configuración de la base de datos:', error);
        process.exit(1);
    }
}

setupDatabase();
