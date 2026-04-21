import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
// Crear tabla si no existe (Unificado con actions.ts)
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS inspection_records (
            id BIGINT PRIMARY KEY,
            date VARCHAR(50),
            responsible VARCHAR(100),
            inspection_type VARCHAR(100),
            area VARCHAR(50),
            zone VARCHAR(200),
            status VARCHAR(50),
            observations TEXT,
            evidence_pdf TEXT,
            evidence_imgs TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todas las inspecciones
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM inspection_records ORDER BY date DESC');

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
                id: r.id,
                date: r.date,
                responsible: r.responsible,
                inspectionType: r.inspection_type, // Mapped to frontend expectation
                area: r.area,
                zone: r.zone,
                observations: r.observations,
                evidenceImgs,
                evidencePdf: r.evidence_pdf || '',
                status: r.status || 'Pendiente'
            };
        });

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching inspections:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar inspecciones con acciones CRUD (Unificado)
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // 1. MODO LEGADO (Protección contra borrado)
        if (body.records && Array.isArray(body.records) && !body.action) {
            const newRecords = body.records.filter((r: any) => !r.id);
            let insertedCount = 0;
            for (const r of newRecords) {
                await db.execute(
                    `INSERT INTO inspection_records (id, date, responsible, inspection_type, area, zone, status, observations, evidence_imgs, evidence_pdf)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.id || Date.now() + insertedCount,
                        r.date || '',
                        r.responsible || r.responsable || '',
                        r.inspectionType || r.tipo || '',
                        r.area || '',
                        r.zone || r.zona || r.lugar || '',
                        r.status || 'Pendiente',
                        r.observations || r.description || r.tema || '',
                        JSON.stringify(r.evidenceImgs || []),
                        r.evidencePdf || ''
                    ]
                );
                insertedCount++;
            }
            return NextResponse.json({ success: true, message: "Sync complete", count: insertedCount });
        }

        // 2. MODO ACCIONES
        const { action, data, id } = body;

        if (action === 'create') {
            const recordId = data.id || Date.now();
            await db.execute(
                `INSERT INTO inspection_records (id, date, responsible, inspection_type, area, zone, status, observations, evidence_imgs, evidence_pdf)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    recordId,
                    data.date || '',
                    data.responsible || '',
                    data.inspectionType || '',
                    data.area || '',
                    data.zone || data.lugar || '',
                    data.status || 'Pendiente',
                    data.observations || data.description || '',
                    JSON.stringify(data.evidenceImgs || []),
                    data.evidencePdf || ''
                ]
            );
            return NextResponse.json({ success: true, id: recordId });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute(
                `UPDATE inspection_records SET 
                    date=?, responsible=?, inspection_type=?, area=?, zone=?, status=?, observations=?, evidence_imgs=?, evidence_pdf=?
                 WHERE id=?`,
                [
                    data.date, data.responsible, data.inspectionType, data.area, data.zone, data.status, data.observations,
                    JSON.stringify(data.evidenceImgs || []), data.evidencePdf,
                    id
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute('DELETE FROM inspection_records WHERE id=?', [id]);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            for (const r of data) {
                await db.execute(
                    `INSERT INTO inspection_records (id, date, responsible, inspection_type, area, zone, status, observations, evidence_imgs, evidence_pdf)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.id || Date.now() + count,
                        r.date || '',
                        r.responsible || '',
                        r.inspectionType || '',
                        r.area || '',
                        r.zone || '',
                        r.status || 'Pendiente',
                        r.observations || '',
                        JSON.stringify(r.evidenceImgs || []),
                        r.evidencePdf || ''
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

