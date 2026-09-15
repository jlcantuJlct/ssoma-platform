import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const moduleName = formData.get('moduleName') as string;
        const authKey = formData.get('authKey') as string;

        if (!file || !moduleName) {
            return NextResponse.json({ success: false, error: 'Archivo o módulo faltante.' }, { status: 400 });
        }

        if (moduleName.toLowerCase().includes('botiquin') && authKey !== '161976') {
            return NextResponse.json({ 
                success: false, 
                error: '🔒 Formato blindado: Se requiere la clave de autorización (161976) para modificar la plantilla de Botiquines.' 
            }, { status: 403 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        const dir = path.join(process.cwd(), 'public', 'templates', 'digital');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const filePath = path.join(dir, `${moduleName}.xlsx`);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, message: `Plantilla maestra de ${moduleName} guardada correctamente.` });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
