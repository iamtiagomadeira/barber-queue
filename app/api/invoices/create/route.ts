import { NextRequest, NextResponse } from 'next/server';

/*
 * Vendus Invoice API Integration
 * 
 * Vendus is a Portuguese invoicing software that supports:
 * - Fatura Simplificada (FS)
 * - Fatura (FT)
 * - Recibo (RC)
 * 
 * API Documentation: https://www.vendus.pt/ws/
 */

interface InvoiceRequest {
    customer_name: string;
    customer_nif?: string;
    customer_email?: string;
    description: string;
    amount: number;
    service_name: string;
    booking_id?: string;
}

const VENDUS_API_KEY = process.env.VENDUS_API_KEY;
const VENDUS_API_URL = 'https://www.vendus.pt/ws/v1.2/documents';

// POST: Create invoice via Vendus
export async function POST(request: NextRequest) {
    try {
        const body: InvoiceRequest = await request.json();
        const { customer_name, customer_nif, customer_email, description, amount, service_name, booking_id } = body;

        if (!customer_name || !amount || !service_name) {
            return NextResponse.json(
                { success: false, error: 'Campos obrigatórios em falta' },
                { status: 400 }
            );
        }

        // If no Vendus API key, return mock response
        if (!VENDUS_API_KEY) {
            console.log('📄 Invoice would be created (Vendus not configured):', {
                customer_name,
                customer_nif,
                customer_email,
                amount,
                service_name,
            });

            return NextResponse.json({
                success: true,
                data: {
                    id: 'mock-invoice-' + Date.now(),
                    type: 'FS',
                    status: 'emitida',
                    customer_name,
                    amount,
                },
                message: 'Fatura emitida (modo demo)',
            });
        }

        // Build Vendus document with correct field names
        // See: https://www.vendus.pt/ws/v1.2/documents
        const document = {
            type: 'FS', // Fatura Simplificada
            date: new Date().toISOString().split('T')[0],
            notes: booking_id ? `Ref: ${booking_id}` : undefined,
            client: {
                name: customer_name,
                tax_id: customer_nif || undefined,
                email: customer_email || undefined,
            },
            items: [
                {
                    title: `${service_name}${description ? ` - ${description}` : ''}`,
                    qty: 1,
                    gross_price: amount,
                    tax_id: 'NOR', // IVA Normal (23%)
                },
            ],
        };

        // Call Vendus API with API key as query param
        const apiUrl = `${VENDUS_API_URL}?api_key=${VENDUS_API_KEY}`;

        console.log('📤 Sending to Vendus:', JSON.stringify(document, null, 2));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(document),
        });

        const responseText = await response.text();
        console.log('📥 Vendus response:', response.status, responseText);

        if (!response.ok) {
            console.error('Vendus API error:', responseText);
            return NextResponse.json(
                { success: false, error: 'Erro ao emitir fatura', details: responseText },
                { status: 500 }
            );
        }

        const result = JSON.parse(responseText);

        return NextResponse.json({
            success: true,
            data: {
                id: result.id || result.document_id,
                number: result.number,
                type: 'FS',
                status: 'emitida',
                customer_name,
                amount,
                pdf_url: result.pdf_url,
            },
            message: 'Fatura emitida com sucesso',
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
