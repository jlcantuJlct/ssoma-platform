import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS hhc_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            hhc INTEGER DEFAULT 0,
            hht INTEGER DEFAULT 0,
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

// POST - Guardar registros (reemplaza todos)
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records } = await req.json();

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        // Borrar registros existentes y reemplazar con los nuevos
        await db.execute('DELETE FROM hhc_records');

        for (const r of records) {
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
        }

        return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
        console.error('Error saving HHC records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
