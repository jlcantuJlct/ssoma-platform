import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function ensureTable() {
    const isPostgres = !!process.env.POSTGRES_URL;
    const pkDef = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    await db.execute(`
        CREATE TABLE IF NOT EXISTS report_archives (
            id ${pkDef},
            doc_type VARCHAR(255),
            month_name VARCHAR(255),
            fields JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

// GET: Obtener todos los archivos guardados para un docType, o cargar uno específico
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType');
    const id = searchParams.get('id');

    try {
        await ensureTable();

        if (id) {
            // Cargar los campos de un archivo específico
            const result = await db.fetchOne(
                `SELECT fields FROM report_archives WHERE id = ?`,
                [id]
            );
            if (result && result.fields) {
                let fields = result.fields;
                if (typeof fields === 'string') {
                    try { fields = JSON.parse(fields); } catch(e){}
                }
                return NextResponse.json({ fields });
            }
            return NextResponse.json({ fields: {} });
        }

        if (!docType) {
            return NextResponse.json({ error: 'docType is required' }, { status: 400 });
        }

        // Listar todos los archivos guardados de este docType
        const results = await db.fetchAll(
            `SELECT id, month_name, created_at FROM report_archives WHERE doc_type = ? ORDER BY created_at DESC`,
            [docType]
        );
        return NextResponse.json({ archives: results || [] });
    } catch (error) {
        console.error('Error fetching archives:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Guardar un nuevo archivo (Mes histórico)
export async function POST(request: Request) {
    let reqData;
    try {
        reqData = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const { docType, monthName, fields } = reqData;

    if (!docType || !monthName || !fields) {
        return NextResponse.json({ error: 'docType, monthName and fields are required' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const cleanDocType = docType.replace('.docx', '');
    const driveFolderName = `Informes Word/${cleanDocType}/${monthName}`;

    // Ejecutar en segundo plano
    (async () => {
        try {
            const { uploadToDrive } = await import('@/lib/googleDrive');
            
            // Recolectar llaves de imágenes
            const imageKeys = [];
            for (const key in fields) {
                const value = fields[key];
                if (typeof value === 'string' && value.startsWith('http') && key.startsWith('foto_')) {
                    imageKeys.push({ key, value });
                }
            }

            // Guardar en BD PRIMERO para que el usuario no espere
            writer.write(encoder.encode(JSON.stringify({ type: 'progress', message: `Guardando registro histórico...`, progress: 50 }) + '\n'));
            
            await ensureTable();
            await db.execute(
                `INSERT INTO report_archives (doc_type, month_name, fields) VALUES (?, ?, ?)`,
                [docType, monthName, JSON.stringify(fields)]
            );

            // Éxito inmediato
            writer.write(encoder.encode(JSON.stringify({ type: 'success' }) + '\n'));
            writer.close(); // Cerramos la conexión para que el frontend termine y el usuario siga trabajando
            
            // --- PROCESO EN SEGUNDO PLANO (BACKGROUND) EN EL SERVIDOR ---
            // Las fotos que falten subir se procesarán de forma asíncrona sin bloquear
            const total = imageKeys.length;
            let current = 0;
            for (const item of imageKeys) {
                current++;
                const { key, value } = item;
                try {
                    if (value.includes('drive.google.com') || value.includes('lh3.googleusercontent.com')) {
                        continue;
                    }
                    console.log(`[Background] Descargando ${key} para subir a Drive (${current}/${total})...`);
                    const res = await fetch(value);
                    if (res.ok) {
                        const blob = await res.blob();
                        const ext = blob.type.split('/')[1] || 'jpg';
                        const fileName = `${key}.${ext}`;
                        const file = new File([blob], fileName, { type: blob.type });
                        console.log(`[Background] Subiendo ${fileName} a carpeta ${driveFolderName}...`);
                        await uploadToDrive(file, driveFolderName, fileName);
                    }
                } catch (e) {
                    console.error(`[Background] Error al subir ${key} a Drive:`, e);
                }
            }
        } catch (error) {
            console.error('Error saving archive:', error);
            const errStr = error instanceof Error ? error.message : String(error);
            writer.write(encoder.encode(JSON.stringify({ type: 'error', message: errStr }) + '\n'));
        } finally {
            writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked'
        }
    });
}

// DELETE: Eliminar un archivo histórico
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
        await ensureTable();
        await db.execute(`DELETE FROM report_archives WHERE id = ?`, [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting archive:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
