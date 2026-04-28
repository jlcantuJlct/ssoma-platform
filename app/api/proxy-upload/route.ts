export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // URL DEL SCRIPT (TU ENLACE)
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzapkKUP2aYCoVrDk5nkJUy03u3K10LRCV2Hmt2KyKlEsdHgi4vXseSEbaIiKcudVzW/exec";

        // Reenviar la petición a Google desde el servidor (Server-Side)
        // Esto evita bloqueos CORS que ocurren en el navegador
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow'
        });

        // Leer respuesta de Google (puede ser JSON o HTML de redirección)
        const textResponse = await response.text();

        try {
            const jsonResponse = JSON.parse(textResponse);
            return NextResponse.json(jsonResponse);
        } catch (e) {
            // Si Google devuelve HTML (error o auth), lo logueamos pero devolvemos error limpio
            console.error("Google Script HTML Response:", textResponse.substring(0, 500));
            return NextResponse.json({
                result: 'error',
                error: 'Google Script devolvió respuesta no válida (HTML). Verifica permisos: Cualquiera (Anyone).'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ result: 'error', error: error.message }, { status: 500 });
    }
}
