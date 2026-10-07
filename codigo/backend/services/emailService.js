require('dotenv').config();
const Brevo = require('@getbrevo/brevo');

// ─── Compatibilidad Brevo API V3 (TransactionalEmailsApi & SendSmtpEmail) ─────
// Brevo v6 modernizó el SDK con BrevoClient; aquí garantizamos compatibilidad
// total tanto si se usa la interfaz clásica (v2/v3) como la moderna (v6).
let TransactionalEmailsApi = Brevo.TransactionalEmailsApi;
let SendSmtpEmail = Brevo.SendSmtpEmail;

if (!TransactionalEmailsApi) {
    TransactionalEmailsApi = class TransactionalEmailsApi {
        constructor() {
            this.authentications = {
                apiKey: {
                    apiKey: process.env.BREVO_API_KEY || ''
                }
            };
        }

        setApiKey(keyType, apiKey) {
            if (!this.authentications.apiKey) {
                this.authentications.apiKey = {};
            }
            this.authentications.apiKey.apiKey = apiKey;
        }

        async sendTransacEmail(sendSmtpEmail) {
            const apiKey = this.authentications?.apiKey?.apiKey || process.env.BREVO_API_KEY;
            const client = new Brevo.BrevoClient({ apiKey });
            return await client.transactionalEmails.sendTransacEmail({
                sender: sendSmtpEmail.sender,
                to: sendSmtpEmail.to,
                subject: sendSmtpEmail.subject,
                htmlContent: sendSmtpEmail.htmlContent,
                textContent: sendSmtpEmail.textContent,
                params: sendSmtpEmail.params
            });
        }
    };
}

if (!SendSmtpEmail) {
    SendSmtpEmail = class SendSmtpEmail {
        constructor(options = {}) {
            this.sender = options.sender;
            this.to = options.to;
            this.subject = options.subject;
            this.htmlContent = options.htmlContent;
            this.textContent = options.textContent;
            this.params = options.params;
        }
    };
}

// ─── Inicialización de la API de Brevo ───────────────────────────────────────
const apiInstance = new TransactionalEmailsApi();

// Configuración de la API Key desde process.env.BREVO_API_KEY
if (apiInstance.authentications && apiInstance.authentications.apiKey) {
    apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY || '';
} else if (typeof apiInstance.setApiKey === 'function') {
    const keyType = (Brevo.TransactionalEmailsApiApiKeys && Brevo.TransactionalEmailsApiApiKeys.apiKey) || 0;
    apiInstance.setApiKey(keyType, process.env.BREVO_API_KEY || '');
}

// ─── Remitente único (Sender) ────────────────────────────────────────────────
const DEFAULT_SENDER = {
    name: 'LIFTING UP',
    email: 'liftingup.app@gmail.com'
};

/**
 * Función para enviar el código de verificación usando Brevo TransactionalEmailsApi
 * @param {string} email - Correo del usuario destinatario
 * @param {string|number} codigo - Código de verificación generado
 * @returns {Promise<any>}
 */
const enviarCodigoVerificacion = async (email, codigo) => {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = 'Código de verificación - LIFTING UP';
    sendSmtpEmail.sender = DEFAULT_SENDER;
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.htmlContent = `
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
                    ${codigo}
                </span>
            </div>
            <p style="font-size: 14px; color: #718096;">
                Este código vencerá en <strong>15 minutos</strong>.
            </p>
            <p style="font-size: 12px; color: #a0aec0; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                Si no solicitaste este código, puedes ignorar este mensaje con total seguridad.
            </p>
        </div>
    `;

    return await apiInstance.sendTransacEmail(sendSmtpEmail);
};

// ─── Exportaciones para compatibilidad total con controladores ───────────────
module.exports = {
    TransactionalEmailsApi,
    SendSmtpEmail,
    apiInstance,
    DEFAULT_SENDER,
    enviarCodigoVerificacion
};