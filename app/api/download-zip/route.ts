import { NextResponse } from 'next/server';
import JSZip from 'jszip';

function getDriveFileId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
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
                if (!fileId) {
                    const shortcutContent = `Este archivo no se puede descargar automaticamente (ej. SharePoint o externo).\nPor favor, abre el siguiente enlace en tu navegador para verlo/descargarlo:\n\n${file.url}`;
                    zip.file(`${file.filename}_ENLACE.txt`, shortcutContent);
                    return;
                }

                // Create a direct download URL
                const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    console.warn(`Could not download ${file.filename}`);
                    const errorContent = `No se pudo descargar el archivo.\nEnlace original:\n${file.url}`;
                    zip.file(`${file.filename}_ERROR.txt`, errorContent);
                    return;
                }

                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('text/html')) {
                    console.warn(`Skipping ${file.filename}: received HTML (virus warning)`);
                    const warningContent = `Google Drive no permitio la descarga automatica (posible advertencia de virus o archivo muy grande).\nPor favor, descargalo manualmente desde este enlace:\n\n${file.url}`;
                    zip.file(`${file.filename}_ADVERTENCIA.txt`, warningContent);
                    return;
                }

                const arrayBuffer = await response.arrayBuffer();
                zip.file(file.filename, arrayBuffer);
            } catch (error) {
                console.error(`Error downloading ${file.filename}:`, error);
                const errorContent = `Ocurrio un error al descargar el archivo.\nEnlace original:\n${file.url}`;
                zip.file(`${file.filename}_ERROR.txt`, errorContent);
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
