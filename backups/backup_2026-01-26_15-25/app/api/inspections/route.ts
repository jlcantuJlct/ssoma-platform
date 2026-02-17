import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS inspections_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            responsable VARCHAR(100),
            area VARCHAR(50),
            zona VARCHAR(200),
            tipo VARCHAR(100),
            description TEXT,
            evidence_imgs TEXT,
            evidence_pdf TEXT,
            status VARCHAR(50) DEFAULT 'Pendiente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todas las inspecciones
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM inspections_records ORDER BY date DESC');

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
        console.error('Error fetching inspections:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar inspecciones
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records } = await req.json();

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        // Borrar y reemplazar
        await db.execute('DELETE FROM inspections_records');

        for (const r of records) {
            await db.execute(
                `INSERT INTO inspections_records (date, responsable, area, zona, tipo, description, evidence_imgs, evidence_pdf, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    r.date || '',
                    r.responsable || '',
                    r.area || '',
                    r.zona || r.lugar || '',
                    r.tipo || '',
                    r.description || r.tema || '',
                    JSON.stringify(r.evidenceImgs || []),
                    r.evidencePdf || '',
                    r.status || 'Pendiente'
                ]
            );
        }

        return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
        console.error('Error saving inspections:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
