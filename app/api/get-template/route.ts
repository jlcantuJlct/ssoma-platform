import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('name');

    if (!templateName) {
        return NextResponse.json({ error: 'Falta el nombre de la plantilla' }, { status: 400 });
    }

    try {
        let originalName = templateName;
        if (templateName.includes('INTERNAL')) {
            if (templateName.includes('CHINCHAYSULLO')) originalName = 'PAD-CHINCHAYSULLO ultimo.docx';
            else if (templateName.includes('JAHUAY')) originalName = 'Peaje Jahuay Mayo 2026.docx';
            else if (templateName.includes('BARANDAS')) originalName = 'MP Barandas Mayo .docx';
            else if (templateName.includes('MP6')) originalName = 'MP6 _ultimo.docx';
            else originalName = 'PAD_SAN CLEMENTE ultimo.docx';
        }

        const templatePath = path.join(process.cwd(), 'plantillas', originalName);
        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(templatePath);
        
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${templateName}"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
