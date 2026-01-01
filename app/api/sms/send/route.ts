import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, message } = body;

        if (!to || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, message' },
                { status: 400 }
            );
        }

        // Validate phone number format (basic check)
        if (!to.startsWith('+')) {
            return NextResponse.json(
                { error: 'Phone number must include country code (e.g., +351...)' },
                { status: 400 }
            );
        }

        const result = await sendSMS(to, message);

        if (result.success) {
            return NextResponse.json({
                success: true,
                messageId: result.messageId,
                message: 'SMS enviado com sucesso',
            });
        } else {
            return NextResponse.json(
                { error: result.error || 'Failed to send SMS' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in SMS endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
