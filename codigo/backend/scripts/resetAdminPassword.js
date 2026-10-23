require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const TARGET_EMAIL = process.argv[2] || 'pazmax563@gmail.com';
const NEW_PASSWORD = process.argv[3] || 'Admin1234';

async function resetPassword() {
    try {
        console.log(`Buscando usuario con email: ${TARGET_EMAIL}...`);
        const [users] = await db.query(
            'SELECT id_usuario, nombre, apellido, email, es_admin, activo, email_verificado FROM usuarios WHERE LOWER(TRIM(email)) = LOWER(?)',
            [TARGET_EMAIL]
        );

        if (users.length === 0) {
            console.error(`❌ No se encontró ningún usuario con el correo: ${TARGET_EMAIL}`);
            process.exit(1);
        }

        const user = users[0];
        console.log(`Usuario encontrado: ${user.nombre} ${user.apellido} (ID: ${user.id_usuario}, Admin: ${user.es_admin})`);

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, saltRounds);

        await db.query(
            `UPDATE usuarios 
             SET password = ?, activo = 1, email_verificado = 1 
             WHERE id_usuario = ?`,
            [hashedPassword, user.id_usuario]
        );

        console.log(`✅ Contraseña actualizada con éxito.`);
        console.log(`────────────────────────────────────────`);
        console.log(`📧 Email:      ${user.email}`);
        console.log(`🔑 Contraseña: ${NEW_PASSWORD}`);
        console.log(`🛡️  Es Admin:   ${user.es_admin === 1 ? 'SÍ' : 'NO'}`);
        console.log(`✔️  Activo:     SÍ (1)`);
        console.log(`✔️  Verificado: SÍ (1)`);
        console.log(`────────────────────────────────────────`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al actualizar la contraseña:', error.message);
        process.exit(1);
    }
}

resetPassword();
