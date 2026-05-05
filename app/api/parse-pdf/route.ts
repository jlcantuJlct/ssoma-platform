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

        console.log(`[PDF Robot] Procesando archivo: ${file.name} (${file.size} bytes)`);

        try {
            // Intento 1: pdf-parse (rápido para texto digital estándar)
            const data = await pdf(buffer);
            
            if (data.text && data.text.trim().length > 10) {
                return NextResponse.json({ 
                    success: true, 
                    text: data.text,
                    info: data.info,
                    numpages: data.numpages,
                    method: 'pdf-parse'
                });
            }
            throw new Error("Texto extraído insuficiente");
            
        } catch (parseError) {
            console.warn("[PDF Robot] Falló pdf-parse, intentando método alternativo...");
            
            // Intento 2: Si pdf-parse falló, podríamos usar pdfjs-dist aquí en el futuro 
            // Por ahora, devolvemos error controlado para que el usuario use el modo manual
            return NextResponse.json({ 
                success: false, 
                error: 'El formato del PDF es complejo. Por favor, copie y pegue el texto de la relación manualmente en el campo habilitado.' 
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
