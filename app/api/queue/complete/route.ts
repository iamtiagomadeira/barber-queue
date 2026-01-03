import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refundPayment } from '@/lib/stripe';

interface CompleteRequest {
    customer_id: string;
    refund_deposit?: boolean;
    nif?: string;
    invoice_details?: {
        nome: string;
        morada?: string;
    };
}

// Vendus API for invoice creation
async function createVendusInvoice(data: {
    nif: string;
    nome: string;
    servico: string;
    valor: number;
    morada?: string;
}) {
    const vendusApiKey = process.env.VENDUS_API_KEY;

    if (!vendusApiKey) {
        console.warn('Vendus API key not configured - skipping invoice in demo mode');
        return { success: true, invoiceId: 'demo_invoice_' + Date.now(), demo: true };
    }

    try {
        // Vendus API call
        const response = await fetch('https://www.vendus.pt/ws/v1.2/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(vendusApiKey + ':').toString('base64')}`,
            },
            body: JSON.stringify({
                type: 'FT', // Fatura
                client: {
                    tax_id: data.nif,
                    name: data.nome,
                    address: data.morada || '',
                },
                items: [{
                    description: data.servico,
                    quantity: 1,
                    unit_price: data.valor,
                    vat_rate: 23, // IVA 23%
                }],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Vendus API error:', error);
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, invoiceId: result.id, invoiceNumber: result.number };
    } catch (error) {
        console.error('Vendus invoice error:', error);
        return { success: false, error: String(error) };
    }
}

// SMS notification (using Twilio)
async function sendSmsNotification(phone: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('Twilio not configured - skipping SMS in demo mode');
        return { success: true, demo: true };
    }

    try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(accountSid + ':' + authToken).toString('base64')}`,
            },
            body: new URLSearchParams({
                To: phone,
                From: fromNumber,
                Body: message,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Twilio API error:', error);
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, messageSid: result.sid };
    } catch (error) {
        console.error('SMS send error:', error);
        return { success: false, error: String(error) };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: CompleteRequest = await request.json();
        const { customer_id, refund_deposit = true, nif, invoice_details } = body;

        if (!customer_id) {
            return NextResponse.json(
                { error: 'customer_id é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Get customer details from queue
        const { data: customer, error: customerError } = await supabase
            .from('fila_virtual')
            .select('*, servico:servicos(*)')
            .eq('id', customer_id)
            .single();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            );
        }

        const results: {
            statusUpdate: boolean;
            refund?: { success: boolean; refundId?: string; error?: string };
            invoice?: { success: boolean; invoiceId?: string; error?: string };
            sms?: { success: boolean; error?: string };
        } = {
            statusUpdate: false,
        };

        // 1. Update customer status to 'concluido'
        const { data: updatedEntry, error: updateError } = await supabase
            .from('fila_virtual')
            .update({
                status: 'concluido',
                concluido_at: new Date().toISOString(),
            })
            .eq('id', customer_id)
            .select('*')
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: 'Erro ao completar serviço' },
                { status: 500 }
            );
        }

        results.statusUpdate = true;

        // 2. Process refund of deposit (if applicable)
        if (refund_deposit && customer.deposito_pago && customer.deposito_id) {
            try {
                const refundResult = await refundPayment(
                    customer.deposito_id,
                    'Serviço concluído - devolução do depósito'
                );
                results.refund = refundResult;

                // Update deposit status in database
                if (refundResult.success) {
                    await supabase
                        .from('fila_virtual')
                        .update({ deposito_reembolsado: true })
                        .eq('id', customer_id);
                }
            } catch (error) {
                console.error('Refund error:', error);
                results.refund = { success: false, error: String(error) };
            }
        }

        // 3. Create invoice (if NIF provided)
        if (nif && customer.servico) {
            const invoiceResult = await createVendusInvoice({
                nif,
                nome: invoice_details?.nome || customer.cliente_nome,
                servico: customer.servico.nome,
                valor: customer.servico.preco,
                morada: invoice_details?.morada,
            });
            results.invoice = invoiceResult;
        }

        // 4. Send SMS notification
        if (customer.cliente_telefone) {
            const serviceName = customer.servico?.nome || 'serviço';
            const message = `Obrigado pela visita! O seu ${serviceName} foi concluído. ${results.refund?.success ? 'O depósito foi devolvido.' : ''
                } Até breve! - Ventus`;

            const smsResult = await sendSmsNotification(customer.cliente_telefone, message);
            results.sms = smsResult;
        }

        return NextResponse.json({
            success: true,
            data: updatedEntry,
            message: 'Serviço completado com sucesso',
            details: results,
        });
    } catch (error) {
        console.error('Error completing service:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
