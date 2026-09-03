require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function probar() {
    try {
        await transporter.verify();

        console.log('✅ Conexión con Gmail correcta');

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: 'pazmax563@gmail.com',
            subject: 'Prueba LIFTING UP',
            text: 'Si recibís este correo, Nodemailer funciona correctamente.'
        });

        console.log('✅ Correo enviado');
        console.log('Message ID:', info.messageId);

    } catch (error) {
        console.error('❌ ERROR CON GMAIL:');
        console.error(error);
    }
}

probar();