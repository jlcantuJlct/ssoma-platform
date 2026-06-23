import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag'); // e.g., 'foto_001'
    const doc = searchParams.get('doc'); // 'chincha' or 'pad'

    if (!tag || !tag.startsWith('foto_')) {
        return new NextResponse('Tag de foto no proporcionado o inválido', { status: 400 });
    }

    // Determine target directory based on doc parameter
    let folder = 'referencias_pad';
    if (doc === 'chincha') folder = 'referencias_chincha';
    if (doc === 'jahuay') folder = 'referencias_jahuay';
    if (doc === 'barandas') folder = 'referencias_barandas';
    
    const dir = path.join(process.cwd(), 'public', folder);
    
    if (!fs.existsSync(dir)) {
        return new NextResponse('No reference images found', { status: 404 });
    }

    const files = fs.readdirSync(dir);
    const matchedFile = files.find(f => f.startsWith(tag + '.'));

    if (!matchedFile) {
        // Return a transparent pixel if no reference image
        const transparent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        return new NextResponse(transparent, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
        });
    }

    const filePath = path.join(dir, matchedFile);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(matchedFile).toLowerCase();
    
    let mime = 'image/jpeg';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.gif') mime = 'image/gif';

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': mime,
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
