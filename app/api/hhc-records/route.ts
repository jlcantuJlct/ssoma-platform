import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe y verificar columnas
async function ensureTable() {
    // Crear la tabla base con tipos NUMERIC para hhc/hht (soportan decimales)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS hhc_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            hhc NUMERIC(10,2) DEFAULT 0,
            hht NUMERIC(10,2) DEFAULT 0,
            hombres INTEGER DEFAULT 0,
            mujeres INTEGER DEFAULT 0,
            area VARCHAR(50) DEFAULT 'seguridad',
            tipo VARCHAR(50) DEFAULT 'capacitacion',
            tema TEXT,
            responsable VARCHAR(100),
            evidence_imgs TEXT,
            evidence_pdf TEXT,
            lugar VARCHAR(200),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Migración: Cambiar columnas hhc y hht a NUMERIC si son INTEGER
    try {
        await db.execute(`ALTER TABLE hhc_records ALTER COLUMN hhc TYPE NUMERIC(10,2)`);
    } catch (e: any) {
        // Ignorar error si ya es del tipo correcto
        console.warn('Migration hhc column:', e.message?.substring(0, 50));
    }

    try {
        await db.execute(`ALTER TABLE hhc_records ALTER COLUMN hht TYPE NUMERIC(10,2)`);
    } catch (e: any) {
        // Ignorar error si ya es del tipo correcto
        console.warn('Migration hht column:', e.message?.substring(0, 50));
    }

    // Verificar y agregar columna 'lugar' si no existe (migración)
    try {
        await db.execute(`ALTER TABLE hhc_records ADD COLUMN IF NOT EXISTS lugar VARCHAR(200)`);
    } catch (e: any) {
        // Ignorar error si la columna ya existe (para dialectos SQL que no soportan IF NOT EXISTS)
        if (!e.message?.includes('already exists') && !e.message?.includes('duplicate column')) {
            console.warn('Could not add lugar column:', e.message);
        }
    }
}

// GET - Obtener todos los registros
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM hhc_records ORDER BY date DESC');

        // Parsear evidence_imgs de JSON string a array (con manejo de errores)
        const parsed = records.map((r: any) => {
            let evidenceImgs: string[] = [];
            try {
                if (r.evidence_imgs && typeof r.evidence_imgs === 'string') {
                    evidenceImgs = JSON.parse(r.evidence_imgs);
                }
            } catch (e) {
                console.warn('Could not parse evidence_imgs:', e);
            }
            return {
                ...r,
                evidenceImgs,
                evidencePdf: r.evidence_pdf || ''
            };
        });

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching HHC records:', error);
        // Return empty array instead of error to prevent client crash
        return NextResponse.json({ success: true, records: [] });
    }
}

// Helper para reintentar operaciones con timeout
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            if (i < maxRetries) {
                // Esperar 500ms antes de reintentar
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
    throw lastError;
}

// POST - Guardar registros con acciones específicas (CRUD)
export async function POST(req: NextRequest) {
    try {
        await withRetry(() => ensureTable());
        const body = await req.json();

        // 1. MODO LEGADO (Protección contra sobreescritura accidental)
        // Si recibimos "records" (array) y no hay "action", es el modo antiguo.
        // Lo desactivamos o lo convertimos a "insertar lo que falta"?
        // Por seguridad, si llega un array completo, asumimos que es una sincronización masiva
        // PERO esto es lo que causa el error. Vamos a cambiarlo a SOLO INSERTAR los que no tengan ID?
        // No, mejor forzamos a usar acciones. Si detectamos el formato antiguo, devolvemos error o
        // intentamos procesarlo de forma segura (ignorar IDs existentes).

        if (body.records && Array.isArray(body.records) && !body.action) {
            // STRATEGY: "Smart Sync" (Upsert-ish)
            // No borramos nada. Solo insertamos registros que no tengan ID.
            // Los registros con ID se asume que ya existen.
            // Esto evita borrar datos de otros.

            const newRecords = body.records.filter((r: any) => !r.id);
            let insertedCount = 0;

            for (const r of newRecords) {
                await db.execute(
                    `INSERT INTO hhc_records (date, hhc, hht, hombres, mujeres, area, tipo, tema, responsable, evidence_imgs, evidence_pdf, lugar)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.hhc || 0,
                        r.hht || 0,
                        r.hombres || 0,
                        r.mujeres || 0,
                        r.area || 'seguridad',
                        r.tipo || 'capacitacion',
                        r.tema || '',
                        r.responsable || '',
                        JSON.stringify(r.evidenceImgs || []),
                        r.evidencePdf || '',
                        r.lugar || ''
                    ]
                );
                insertedCount++;
            }
            return NextResponse.json({ success: true, message: "Legacy Sync: Appended new records only", count: insertedCount });
        }

        // 2. MODO ACCIONES (Nuevo estándar)
        const { action, data, id } = body;

        if (action === 'create') {
            const res = await withRetry(() => db.execute(
                `INSERT INTO hhc_records (date, hhc, hht, hombres, mujeres, area, tipo, tema, responsable, evidence_imgs, evidence_pdf, lugar)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.hhc || 0,
                    data.hht || 0,
                    data.hombres || 0,
                    data.mujeres || 0,
                    data.area || 'seguridad',
                    data.tipo || 'capacitacion',
                    data.tema || '',
                    data.responsable || '',
                    JSON.stringify(data.evidenceImgs || []),
                    data.evidencePdf || '',
                    data.lugar || ''
                ]
            ));
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for update' }, { status: 400 });

            await withRetry(() => db.execute(
                `UPDATE hhc_records SET 
                    date=?, hhc=?, hht=?, hombres=?, mujeres=?, area=?, tipo=?, tema=?, responsable=?, evidence_imgs=?, evidence_pdf=?, lugar=?
                 WHERE id=?`,
                [
                    data.date, data.hhc, data.hht, data.hombres, data.mujeres, data.area, data.tipo, data.tema, data.responsable,
                    JSON.stringify(data.evidenceImgs || []), data.evidencePdf, data.lugar,
                    id
                ]
            ));
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await withRetry(() => db.execute('DELETE FROM hhc_records WHERE id=?', [id]));
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            for (const r of data) {
                await db.execute(
                    `INSERT INTO hhc_records (date, hhc, hht, hombres, mujeres, area, tipo, tema, responsable, evidence_imgs, evidence_pdf, lugar)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.hhc || 0,
                        r.hht || 0,
                        r.hombres || 0,
                        r.mujeres || 0,
                        r.area || 'seguridad',
                        r.tipo || 'capacitacion',
                        r.tema || '',
                        r.responsable || '',
                        JSON.stringify(r.evidenceImgs || []),
                        r.evidencePdf || '',
                        r.lugar || ''
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving HHC records:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail
        });
        const errorDetail = error.detail || error.message || 'Error desconocido en BD';
        return NextResponse.json({ success: false, error: errorDetail }, { status: 500 });
    }
}
