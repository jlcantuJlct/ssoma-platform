import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// Configuración para aumentar el límite de carga si es posible
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

        console.log(`[PDF Robot] Procesando archivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        try {
            // Intento 1: pdf-parse (rápido para texto digital estándar)
            // Agregamos un pequeño delay o check para evitar bloqueos en archivos pesados
            const data = await pdf(buffer, {
                // @ts-ignore - Some versions support pagerender customization
                pagerender: function(pageData: any) {
                    return pageData.getTextContent().then(function(textContent: any) {
                        return textContent.items.map((i: any) => i.str).join(' ');
                    });
                }
            });
            
            const extractedText = (data.text || '').replace(/\s+/g, ' ').trim();

            if (extractedText.length > 20) {
                console.log(`[PDF Robot] Éxito con pdf-parse. Caracteres: ${extractedText.length}`);
                return NextResponse.json({ 
                    success: true, 
                    text: extractedText,
                    info: data.info,
                    numpages: data.numpages,
                    method: 'pdf-parse'
                });
            }
            
            console.warn(`[PDF Robot] Texto extraído insuficiente (${extractedText.length} chars). Probable PDF escaneado.`);
            throw new Error("Texto extraído insuficiente (PDF probablemente escaneado)");
            
        } catch (parseError: any) {
            console.error("[PDF Robot] Error en parsing:", parseError.message);
            
            return NextResponse.json({ 
                success: false, 
                error: 'El formato del PDF es complejo o está escaneado como imagen. El robot no puede "leer" imágenes todavía. Por favor, copie y pegue la lista de personal manualmente.' 
            });
        }

    } catch (error: any) {
        console.error('[PDF Robot] Error crítico:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error interno del servidor al procesar el PDF'
        }, { status: 500 });
    }
}
