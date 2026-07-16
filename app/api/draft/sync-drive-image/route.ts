import { NextResponse } from 'next/server';
import { uploadToDrive } from '@/lib/googleDrive';

// POST: Sincronizar una imagen a Google Drive en segundo plano
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { url, docType, monthName, filename } = data;

        if (!url || !docType || !monthName || !filename) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        const cleanDocType = docType.replace('.docx', '');
        const driveFolderName = `Informes Word/${cleanDocType}/${monthName}`;

        console.log(`[Sync] Descargando imagen temporal para subir a Drive: ${filename}...`);
        
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`No se pudo descargar la imagen temporal desde: ${url}`);
        }

        const blob = await res.blob();
        
        // En Node.js/Next.js puede fallar el constructor de File, usamos el Blob (que ya tiene arrayBuffer y type)
        const file = blob as unknown as File;

        console.log(`[Sync] Subiendo ${filename} a Drive en la carpeta ${driveFolderName}...`);
        
        const driveResponse = await uploadToDrive(file, driveFolderName, filename);
        
        console.log(`[Sync] ¡Subida exitosa de ${filename}! URL de Drive:`, driveResponse.url);

        return NextResponse.json({ 
            success: true, 
            driveUrl: driveResponse.url,
            driveId: driveResponse.id
        });

    } catch (error: any) {
        console.error('[Sync] Error al sincronizar imagen a Drive:', error.message);
        return NextResponse.json({ error: error.message || 'Error interno al sincronizar' }, { status: 500 });
    }
}
