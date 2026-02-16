import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
export const dynamic = 'force-dynamic';

import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SSOMA Platform | Gestión Integral de Seguridad y Salud",
  description: "Plataforma corporativa para el seguimiento del programa anual de Seguridad, Salud Ocupacional y Medio Ambiente (SSOMA). Gestión de indicadores, inspecciones y cumplimiento normativo.",
  applicationName: "SSOMA Antigravity",
  keywords: ["SSOMA", "Seguridad", "Salud Ocupacional", "Medio Ambiente", "Gestión de Riesgos", "SCSST", "Dashboard"],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen bg-background flex`}>
        <Providers>
          <ErrorBoundary>
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-screen relative">
              <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
              <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
              {children}
            </main>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
