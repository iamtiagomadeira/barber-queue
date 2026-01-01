import Twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Create client only if credentials are available
export const twilioClient = accountSid && authToken ? Twilio(accountSid, authToken) : null;

export const TWILIO_FROM_NUMBER = fromNumber || '';

// Helper function to send SMS
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!twilioClient) {
        console.log('[Twilio] Client not configured. SMS not sent:', { to, message });
        return { success: false, error: 'Twilio not configured' };
    }

    if (!TWILIO_FROM_NUMBER) {
        return { success: false, error: 'Twilio phone number not set' };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: TWILIO_FROM_NUMBER,
            to: to,
        });

        console.log('[Twilio] SMS sent:', result.sid);
        return { success: true, messageId: result.sid };
    } catch (error) {
        console.error('[Twilio] Error sending SMS:', error);
        return { success: false, error: String(error) };
    }
}

// Template messages
export const SMS_TEMPLATES = {
    customerCalled: (name: string, barbershopName = 'Barber Queue') =>
        `Olá ${name}! 🪒 É a sua vez na ${barbershopName}. Por favor dirija-se à barbearia. Obrigado!`,

    almostYourTurn: (name: string, position: number) =>
        `Olá ${name}! Está quase a chegar a sua vez. Faltam ${position} pessoas à sua frente. Prepare-se!`,

    queueConfirmation: (name: string, position: number, waitTime: number) =>
        `Olá ${name}! Entrou na fila com sucesso. Posição: ${position}. Tempo estimado: ~${waitTime} min. Receberá SMS quando for chamado.`,
};
