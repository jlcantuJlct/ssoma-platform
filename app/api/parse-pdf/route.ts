import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`[PDF Robot] Procesando SCTR: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        // IMPORTACIÓN DINÁMICA: Esto evita errores de compilación en Vercel
        const pdf = require('pdf-parse/lib/pdf-parse.js');

        try {
            const data = await pdf(buffer);
            const text = data.text || '';
            const cleanText = text.replace(/\s+/g, ' ').trim();

            if (cleanText.length > 10) {
                console.log(`[PDF Robot] Éxito. Caracteres extraídos: ${cleanText.length}`);
                return NextResponse.json({ 
                    success: true, 
                    text: cleanText,
                    method: 'pdf-parse-server'
                });
            } else {
                throw new Error("Contenido insuficiente");
            }
        } catch (parseError: any) {
            console.error("[PDF Robot] Error en parsing:", parseError.message);
            return NextResponse.json({ 
                success: false, 
                error: 'No se pudo extraer texto del PDF (posiblemente escaneado).' 
            });
        }

    } catch (error: any) {
        console.error('[PDF Robot] Error crítico:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error interno del servidor'
        }, { status: 500 });
    }
}
