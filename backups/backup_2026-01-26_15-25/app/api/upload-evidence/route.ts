
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folderName = formData.get('folderName') as string;
        const fileName = formData.get('fileName') as string;

        if (!file || !folderName || !fileName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- HYBRID STORAGE LOGIC ---

        // 1. CLOUD STORAGE (Vercel Blob) - For Web/App Users
        // 1. CLOUD STORAGE (Vercel Blob) - DISABLED FOR THIS USER PREFERENCE (Forces Drive)
        /*
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            const { put } = await import('@vercel/blob');
            const blob = await put(`${folderName}/${fileName}`, file, {
                access: 'public',
            });

            return NextResponse.json({
                success: true,
                path: blob.url,
                message: `Archivo subido a la nube: ${blob.url}`
            });
        }
        */

        // 2. GOOGLE DRIVE STORAGE (Prioridad TOTAL: Puente Apps Script o Service Account)
        // Intentamos SIEMPRE subir a Drive primero, ya que ahora tenemos el Puente que no requiere credenciales de servidor.

        try {
            const { uploadToDrive } = await import('@/lib/googleDrive');
            const driveFile = await uploadToDrive(file, folderName, fileName);

            if (!driveFile.error) {
                return NextResponse.json({
                    success: true,
                    path: driveFile.url,
                    message: `Archivo guardado en Google Drive`
                });
            } else {
                console.error("Drive upload failed, falling back to local if possible:", driveFile.errorMessage);
                // Fallthrough to local check below
            }
        } catch (e) {
            console.error("Error attempting Drive upload:", e);
            // Fallthrough to local check below
        }


        // 2. LOCAL STORAGE (PC) - For Admin working on Localhost
        // Only works if running locally on the PC with access to D: drive
        const TARGET_ROOT = 'D:/Evidencia del sistema de gestion CASA 2026';

        // Fallback safety for environments without D: (unlikely if logic above works for cloud)
        if (!fs.existsSync('D:/')) {
            // ---> FALLBACK DE EMERGENCIA: BASE64 "NUBE TEMPORAL" <---
            // Si todo falla (Drive, Blob, Disco Local), guardamos la imagen como Base64.
            // Esto permite que la demo funcione en Vercel/Movil 'en caliente'.

            console.warn("⚠️ Activando almacenamiento Base64 de emergencia...");

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

            return NextResponse.json({
                success: true,
                path: base64Image, // Devolvemos el string base64 como si fuera la URL
                message: `Guardado temporal (Base64)`
            });
        }

        // Construir la ruta final: ROOT/[Nombre Carpeta Variable]
        const finalDir = path.join(TARGET_ROOT, folderName);

        // Asegurar que exista la carpeta
        await fs.ensureDir(finalDir);

        // Convertir File a Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ruta completa del archivo
        const filePath = path.join(finalDir, fileName);

        // Escribir archivo
        await fs.writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            path: filePath,
            message: `Archivo guardado en PC Local: ${filePath}`
        });

    } catch (error: any) {
        console.error("Error saving file:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
