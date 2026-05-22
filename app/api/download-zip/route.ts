import { NextResponse } from 'next/server';
import JSZip from 'jszip';

// Extract the Drive file ID from standard drive URLs
function getDriveFileId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { files, zipName = 'descarga_masiva.zip' } = body;

        if (!Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        const zip = new JSZip();

        // Fetch all files in parallel
        const fetchPromises = files.map(async (file: { url: string, filename: string }) => {
            try {
                const fileId = getDriveFileId(file.url);
                if (!fileId) return;

                // Create a direct download URL
                const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    console.warn(`Could not download ${file.filename}`);
                    return;
                }

                const arrayBuffer = await response.arrayBuffer();
                zip.file(file.filename, arrayBuffer);
            } catch (error) {
                console.error(`Error downloading ${file.filename}:`, error);
            }
        });

        await Promise.all(fetchPromises);

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipName}"`,
            },
        });
    } catch (error: any) {
        console.error('Error generating ZIP:', error);
        return NextResponse.json({ error: 'Failed to generate ZIP' }, { status: 500 });
    }
}
