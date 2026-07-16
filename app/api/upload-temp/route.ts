import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const sessionId = formData.get('sessionId') as string;
        const tagName = formData.get('tagName') as string;
        const file = formData.get('file') as File | null;
        const remoteUrl = formData.get('remoteUrl') as string;

        if (!sessionId || !tagName || (!file && !remoteUrl)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const tmpDir = path.join(process.cwd(), 'tmp', sessionId);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const filePath = path.join(tmpDir, `${tagName}.jpg`);
        
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
        } else if (remoteUrl) {
            // Añadir timeout de 8 segundos para evitar bloqueos infinitos
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            try {
                const response = await fetch(remoteUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    return NextResponse.json({ error: `Failed to download remote image: ${response.status}` }, { status: 500 });
                }
                const arrayBuffer = await response.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
            } catch (error) {
                clearTimeout(timeoutId);
                return NextResponse.json({ error: 'Timeout or network error downloading remote image' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error uploading temp image:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
