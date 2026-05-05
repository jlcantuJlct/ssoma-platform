import { NextRequest, NextResponse } from 'next/server';

// Usamos pdfjs-dist que es más moderno y compatible con Vercel
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

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
        const uint8Array = new Uint8Array(bytes);

        console.log(`[PDF Robot] Procesando con PDF.js: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        try {
            const loadingTask = pdfjs.getDocument({
                data: uint8Array,
                useSystemFonts: true,
                disableFontFace: true // Evita errores de fuentes en serverless
            });
            
            const pdfDocument = await loadingTask.promise;
            let fullText = '';
            
            // Leemos todas las páginas
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }

            const cleanText = fullText.replace(/\s+/g, ' ').trim();

            if (cleanText.length > 20) {
                console.log(`[PDF Robot] Éxito con PDF.js. Caracteres: ${cleanText.length}`);
                return NextResponse.json({ 
                    success: true, 
                    text: cleanText,
                    numpages: pdfDocument.numPages,
                    method: 'pdfjs-dist'
                });
            }
            
            throw new Error("Texto extraído insuficiente");
            
        } catch (parseError: any) {
            console.error("[PDF Robot] Error en parsing PDF.js:", parseError.message);
            return NextResponse.json({ 
                success: false, 
                error: 'El formato del PDF es complejo o está escaneado. Por favor, use la carga manual.' 
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
