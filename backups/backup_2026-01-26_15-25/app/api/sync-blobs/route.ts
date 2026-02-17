
import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import path from 'path';
import fs from 'fs-extra';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify we are running locally with access to D:
        const TARGET_ROOT = 'D:/Evidencia del sistema de gestion CASA 2026/Descargas_Nube';
        if (!fs.existsSync('D:/')) {
            return NextResponse.json({
                error: 'No se detecta el Disco D:. Esta función solo debe ejecutarse en el PC del Administrador.'
            }, { status: 400 });
        }

        // 2. Check for Blob Token
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({
                error: 'No hay configuración de Vercel Blob (Nube) detectada.'
            }, { status: 400 });
        }

        // 3. List all files in Cloud
        const { blobs } = await list();

        let processedCount = 0;
        let bytesFreed = 0;
        let errors: string[] = [];

        // Ensure target directory exists
        await fs.ensureDir(TARGET_ROOT);

        // 4. Process each file
        for (const blob of blobs) {
            try {
                // Download file
                const response = await fetch(blob.url);
                if (!response.ok) throw new Error(`Failed to fetch ${blob.url}`);

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Determine Local Path
                // We use the original pathname from the blob url usually, or just end of it
                const fileName = path.basename(blob.pathname);
                const localFilePath = path.join(TARGET_ROOT, fileName);

                // Save to Disk
                await fs.writeFile(localFilePath, buffer);

                // 5. Update Database Reference
                // Check if this URL exists in DB
                const row = await db.fetchOne('SELECT id FROM evidence WHERE file_path = ?', [blob.url]);

                if (row) {
                    // Update to local path
                    await db.execute('UPDATE evidence SET file_path = ? WHERE id = ?', [localFilePath, row.id]);
                } else {
                    // It might be an orphaned file or referenced differently.
                    // We still save it (already done) but maybe log it.
                }

                // 6. Delete from Cloud to free space
                await del(blob.url);

                processedCount++;
                bytesFreed += blob.size;

            } catch (err: any) {
                console.error(`Error processing blob ${blob.url}:`, err);
                errors.push(`Error con ${blob.pathname}: ${err.message}`);
            }
        }

        const stats = {
            success: true,
            downloaded: processedCount,
            freedMB: (bytesFreed / (1024 * 1024)).toFixed(2),
            errors: errors
        };

        return NextResponse.json(stats);

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
