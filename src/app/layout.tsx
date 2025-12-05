import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agendim - Gestão Inteligente",
  description: "Sistema de agendamento para salões e barbearias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verifica se a API configurada é a de teste
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const isTestEnvironment = apiUrl.includes('api-teste') || apiUrl.includes('api-dev');

  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        {/* --- BARRA DE SEGURANÇA (SÓ APARECE NO AMBIENTE DE TESTE) --- */}
        {isTestEnvironment && (
          <div className="bg-red-600 text-white text-center text-xs font-bold py-2 fixed top-0 w-full z-[9999] shadow-md uppercase tracking-wider">
            ⚠️ Ambiente de Teste (Homologação) ⚠️ <br/>
            <span className="font-mono text-[10px] opacity-80 lowercase">Conectado em: {apiUrl}</span>
          </div>
        )}
        {/* ----------------------------------------------------------- */}

        {/* Se estiver em teste, empurra o site para baixo para a barra não tapar o menu */}
        <div style={isTestEnvironment ? { marginTop: '44px' } : {}}>
            {children}
        </div>
      </body>
    </html>
  );
}