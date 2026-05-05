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
        const uint8Array = new Uint8Array(bytes);

        // Usamos la versión legacy de pdfjs-dist que es más estable en Node.js/Vercel
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

        try {
            const loadingTask = pdfjs.getDocument({
                data: uint8Array,
                useSystemFonts: true,
                disableFontFace: true,
                verbosity: 0
            });
            
            const pdfDocument = await loadingTask.promise;
            let fullText = '';
            
            // Leemos las primeras 50 páginas (suficiente para SCTR)
            const numPages = Math.min(pdfDocument.numPages, 50);
            
            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }

            const cleanText = fullText.replace(/\s+/g, ' ').trim();

            if (cleanText.length > 5) {
                return NextResponse.json({ 
                    success: true, 
                    text: cleanText
                });
            } else {
                throw new Error("El PDF no contiene texto extraíble (podría ser una imagen).");
            }
            
        } catch (parseError: any) {
            console.error("[Robot] Error parsing:", parseError.message);
            return NextResponse.json({ success: false, error: parseError.message });
        }

    } catch (error: any) {
        console.error('[Robot] Error crítico:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
