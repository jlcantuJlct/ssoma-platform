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

// POST - Guardar inspecciones con acciones CRUD
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // 1. MODO LEGADO (Protección contra borrado)
        if (body.records && Array.isArray(body.records) && !body.action) {
            // Solo insertamos los que no tengan ID
            const newRecords = body.records.filter((r: any) => !r.id);
            let insertedCount = 0;
            for (const r of newRecords) {
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
                insertedCount++;
            }
            return NextResponse.json({ success: true, message: "Legacy Sync: Appended new records", count: insertedCount });
        }

        // 2. MODO ACCIONES
        const { action, data, id } = body;

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO inspections_records (date, responsable, area, zona, tipo, description, evidence_imgs, evidence_pdf, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.responsable || '',
                    data.area || '',
                    data.zona || data.lugar || '',
                    data.tipo || '',
                    data.description || data.tema || '',
                    JSON.stringify(data.evidenceImgs || []),
                    data.evidencePdf || '',
                    data.status || 'Pendiente'
                ]
            );
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute(
                `UPDATE inspections_records SET 
                    date=?, responsable=?, area=?, zona=?, tipo=?, description=?, evidence_imgs=?, evidence_pdf=?, status=?
                 WHERE id=?`,
                [
                    data.date, data.responsable, data.area, data.zona, data.tipo, data.description,
                    JSON.stringify(data.evidenceImgs || []), data.evidencePdf, data.status,
                    id
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute('DELETE FROM inspections_records WHERE id=?', [id]);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            for (const r of data) {
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
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving inspections:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
