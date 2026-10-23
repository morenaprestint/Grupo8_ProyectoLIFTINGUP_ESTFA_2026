const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Brevo = require('@getbrevo/brevo');

// ─── Configuración de Remitente Único ─────────────────────────────────────────
const DEFAULT_SENDER = {
    name: process.env.BREVO_SENDER_NAME || 'LIFTING UP',
    email: process.env.BREVO_SENDER_EMAIL || 'liftingup.app@gmail.com'
};

/**
 * Cliente Brevo inicializado con la API Key del entorno
 */
const getBrevoClient = () => {
    const apiKey = (process.env.BREVO_API_KEY || '').trim();
    if (!apiKey) {
        console.warn('[Brevo Service] ⚠️ BREVO_API_KEY no encontrada o vacía en variables de entorno.');
        return null;
    }
    return new Brevo.BrevoClient({ apiKey });
};

/**
 * Envía el código numérico de 6 dígitos para verificar el correo electrónico.
 * @param {string} email - Destinatario
 * @param {string|number} codigo - Código de verificación de 6 dígitos
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const enviarCodigoVerificacion = async (email, codigo) => {
    if (!email || !codigo) {
        console.error('[Brevo Service] ❌ Datos incompletos para enviar código de verificación (email o código faltante).');
        return { success: false, error: 'Email y código son obligatorios' };
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCodigo = String(codigo).trim();

    try {
        const client = getBrevoClient();
        if (!client) {
            console.error(`[Brevo Service] ❌ No se pudo enviar email a ${cleanEmail}: Falta BREVO_API_KEY en el entorno.`);
            return { success: false, error: 'BREVO_API_KEY no configurada' };
        }

        const payload = {
            sender: DEFAULT_SENDER,
            to: [{ email: cleanEmail }],
            subject: 'Código de verificación - LIFTING UP',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #181623; margin: 0; font-size: 24px; letter-spacing: 2px;">LIFTING UP</h2>
                    </div>
                    <h3 style="color: #2d3748; margin-top: 0;">¡Hola!</h3>
                    <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                        Tu código para verificar tu cuenta en <strong>LIFTING UP</strong> es:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00D2FF; background-color: #181623; padding: 14px 28px; border-radius: 10px; display: inline-block;">
                            ${cleanCodigo}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #718096;">
                        Este código vencerá en <strong>15 minutos</strong>.
                    </p>
                    <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                        Si no solicitaste este código, puedes ignorar este mensaje con total seguridad.
                    </p>
                </div>
            `,
            textContent: `Tu código de verificación para LIFTING UP es: ${cleanCodigo}. Vence en 15 minutos.`
        };

        const response = await client.transactionalEmails.sendTransacEmail(payload);
        const messageId = response?.messageId || response?.body?.messageId || 'OK';
        console.log(`[Brevo Service] ✅ Correo de verificación enviado con éxito a: ${cleanEmail} (ID: ${messageId})`);
        return { success: true, messageId };
    } catch (err) {
        const errorMsg = err?.body?.message || err?.response?.body?.message || err?.message || 'Error desconocido al contactar Brevo API';
        const statusCode = err?.statusCode || err?.status || err?.response?.status || 'N/A';
        console.error(`[Brevo Service] ❌ Fallo en la entrega de correo a ${cleanEmail} [HTTP ${statusCode}]:`, errorMsg);
        if (err?.response?.body) {
            console.error('[Brevo Service] Detalle de respuesta Brevo:', JSON.stringify(err.response.body));
        }
        return { success: false, error: errorMsg, statusCode };
    }
};

/**
 * Envía el código de 6 dígitos para recuperación/restablecimiento de contraseña olvidada.
 * @param {string} email - Destinatario
 * @param {string|number} codigo - Código de 6 dígitos
 */
const enviarCodigoRecuperacion = async (email, codigo) => {
    if (!email || !codigo) {
        return { success: false, error: 'Email y código son obligatorios' };
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCodigo = String(codigo).trim();

    try {
        const client = getBrevoClient();
        if (!client) {
            console.error(`[Brevo Service] ❌ Falta BREVO_API_KEY para enviar código de recuperación a ${cleanEmail}`);
            return { success: false, error: 'BREVO_API_KEY no configurada' };
        }

        const payload = {
            sender: DEFAULT_SENDER,
            to: [{ email: cleanEmail }],
            subject: 'Recuperación de contraseña - LIFTING UP',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #181623; margin: 0; font-size: 24px; letter-spacing: 2px;">LIFTING UP</h2>
                    </div>
                    <h3 style="color: #2d3748; margin-top: 0;">Recuperación de Contraseña</h3>
                    <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>LIFTING UP</strong>.
                    </p>
                    <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                        Tu código de seguridad de 6 dígitos es:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #00D2FF; background-color: #181623; padding: 14px 28px; border-radius: 10px; display: inline-block;">
                            ${cleanCodigo}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #718096;">
                        Este código es de un solo uso y vencerá en <strong>15 minutos</strong>.
                    </p>
                    <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                        Si tú no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu cuenta continúa segura.
                    </p>
                </div>
            `,
            textContent: `Tu código de recuperación para restablecer tu contraseña en LIFTING UP es: ${cleanCodigo}. Vence en 15 minutos.`
        };

        const response = await client.transactionalEmails.sendTransacEmail(payload);
        const messageId = response?.messageId || response?.body?.messageId || 'OK';
        console.log(`[Brevo Service] ✅ Correo de recuperación enviado con éxito a: ${cleanEmail} (ID: ${messageId})`);
        return { success: true, messageId };
    } catch (err) {
        console.error(`[Brevo Service] ❌ Error enviando email de recuperación a ${cleanEmail}:`, err.message);
        return { success: false, error: err.message };
    }
};

// ─── Exportaciones ────────────────────────────────────────────────────────────
module.exports = {
    DEFAULT_SENDER,
    getBrevoClient,
    enviarCodigoVerificacion,
    enviarCodigoRecuperacion
};