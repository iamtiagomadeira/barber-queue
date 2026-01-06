'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check, QrCode, Printer } from 'lucide-react';

interface QRCodeDisplayProps {
    barbershopSlug?: string;
    barbershopName?: string;
}

export default function QRCodeDisplay({ barbershopSlug, barbershopName }: QRCodeDisplayProps) {
    const [appUrl, setAppUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Get current URL (works in development and production)
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        // If we have a barbershop slug, use the slug-based URL
        const url = barbershopSlug ? `${baseUrl}/b/${barbershopSlug}` : baseUrl;
        setAppUrl(url);
    }, [barbershopSlug]);

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(appUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        // Convert SVG to PNG for download
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();

        canvas.width = 400;
        canvas.height = 400;

        img.onload = () => {
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, 400, 400);

                const link = document.createElement('a');
                link.download = 'barber-queue-qr.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const handlePrintQR = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${barbershopName || 'Barbearia'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 40px;
                        text-align: center;
                    }
                    .qr-container {
                        padding: 20px;
                        border: 3px solid #000;
                        border-radius: 16px;
                        margin-bottom: 24px;
                    }
                    .qr-container svg {
                        width: 250px;
                        height: 250px;
                    }
                    h1 {
                        font-size: 28px;
                        margin-bottom: 8px;
                    }
                    p {
                        font-size: 16px;
                        color: #666;
                        max-width: 300px;
                    }
                    .url {
                        margin-top: 16px;
                        font-size: 14px;
                        color: #999;
                        word-break: break-all;
                    }
                    @media print {
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">${svgData}</div>
                <h1>${barbershopName || 'Entre na Fila Virtual'}</h1>
                <p>Aponte a câmara do telemóvel para o QR Code e entre na fila sem esperar.</p>
                <p class="url">${appUrl}</p>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!appUrl) {
        return (
            <div className="flex h-48 items-center justify-center">
                <QrCode className="h-8 w-8 animate-pulse text-gold" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* QR Code */}
            <div
                ref={qrRef}
                className="flex items-center justify-center rounded-xl bg-white p-4"
            >
                <QRCodeSVG
                    value={appUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    fgColor="#0a0a0a"
                    bgColor="#ffffff"
                />
            </div>

            {/* Info and Actions */}
            <div className="flex flex-1 flex-col gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Imprima este QR code e coloque-o visível na sua barbearia.
                        Os clientes podem digitalizar para entrar na fila virtual.
                    </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Link da App:</p>
                    <p className="mt-1 break-all font-mono text-sm">{appUrl}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="flex-1"
                    >
                        {copied ? (
                            <>
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar Link
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadQR}
                        className="flex-1"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handlePrintQR}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>
        </div>
    );
}
