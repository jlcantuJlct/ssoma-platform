import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se proporcionó archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`[PDF Robot] Procesando SCTR (60s max): ${file.name}`);

        // Usamos pdf-parse con una configuración que evita errores en Vercel
        const pdf = require('pdf-parse');

        try {
            // Pasamos opciones vacías para evitar que intente cargar renderizadores de página
            const data = await pdf(buffer);
            const text = data.text || '';
            const cleanText = text.replace(/\s+/g, ' ').trim();

            if (cleanText.length > 5) {
                return NextResponse.json({ 
                    success: true, 
                    text: cleanText
                });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    error: "El PDF no tiene texto legible (podría ser una imagen)." 
                });
            }
        } catch (innerError: any) {
            console.error("[Robot] Error interno pdf-parse:", innerError.message);
            return NextResponse.json({ 
                success: false, 
                error: "Error al procesar el contenido: " + innerError.message 
            });
        }

    } catch (error: any) {
        console.error('[Robot] Error crítico de servidor:', error);
        return NextResponse.json({ 
            success: false, 
            error: "Fallo crítico: " + error.message 
        }, { status: 500 });
    }
}
