import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generar-docx/plantilla-san-clemente
 * Sirve directamente el archivo PAD_SAN_CLEMENTE_PLANTILLA.docx
 * para que el usuario pueda descargarlo o cargarlo desde la UI.
 */
export async function GET() {
    const filePath = path.join(
        'C:\\Users\\jlcan\\Desktop\\Seguimiento de plataforma de seguridad Antigravity\\Informe mensual',
        'PAD_SAN_CLEMENTE_PLANTILLA.docx'
    );

    if (!fs.existsSync(filePath)) {
        return NextResponse.json(
            { error: 'La plantilla de San Clemente no se encontró. Ejecuta el script etiquetar-plantilla.js primero.' },
            { status: 404 }
        );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': 'attachment; filename="PAD_SAN_CLEMENTE_PLANTILLA.docx"',
            'Cache-Control': 'no-store',
        },
    });
}
