import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FOLDER_BY_DOC: Record<string, string> = {
    'PAD_SAN_CLEMENTE_INTERNAL.docx': 'referencias_pad',
    'PAD_CHINCHAYSULLO_INTERNAL.docx': 'referencias_chinchaysullo',
    'PAD_JAHUAY_INTERNAL.docx': 'referencias_jahuay',
    'PAD_BARANDAS_INTERNAL.docx': 'referencias_barandas'
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType') || '';
    const folder = FOLDER_BY_DOC[docType] || 'referencias_pad';

    const publicDir = path.join(process.cwd(), 'public', folder);
    const validReferences: Record<string, string> = {};

    try {
        if (fs.existsSync(publicDir)) {
            const files = fs.readdirSync(publicDir);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
                    const name = path.basename(file, ext).toLowerCase(); // ej: foto_001
                    validReferences[name] = `/${folder}/${file}?v=2`;
                }
            }
        }
    } catch (e) {
        console.error("Error reading references dir:", e);
    }

    return NextResponse.json({ references: validReferences });
}
