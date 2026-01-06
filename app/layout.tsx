import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Ventus - Gestão Inteligente para Barbearias",
  description: "Fila virtual, marcações online e pagamentos seguros. Tudo numa única plataforma pensada para barbearias.",
  manifest: "/manifest.json",
  keywords: ["barbearia", "fila virtual", "marcações online", "gestão barbearia", "barbershop", "Portugal"],
  authors: [{ name: "Ventus" }],
  creator: "Ventus",
  publisher: "Ventus",
  metadataBase: new URL("https://ventus.app"),
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://ventus.app",
    siteName: "Ventus",
    title: "Ventus - Gestão Inteligente para Barbearias",
    description: "Fila virtual, marcações online e pagamentos seguros. Tudo numa única plataforma pensada para barbearias.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ventus - Gestão Inteligente para Barbearias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ventus - Gestão Inteligente para Barbearias",
    description: "Fila virtual, marcações online e pagamentos seguros. A plataforma completa para barbearias.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ventus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

