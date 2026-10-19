export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';
import { getRequestWorkspace } from '@/lib/workspace';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS reporte_ac_records (
            id SERIAL PRIMARY KEY,
            record_id VARCHAR(100),
            date VARCHAR(20),
            responsible VARCHAR(100),
            acto VARCHAR(100),
            condicion VARCHAR(100),
            cantidad INTEGER,
            location VARCHAR(100),
            pdf_url TEXT,
            accion_inmediata TEXT,
            descripcion TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    try { await db.execute('ALTER TABLE reporte_ac_records ADD COLUMN accion_inmediata TEXT'); } catch(e) {}
    try { await db.execute('ALTER TABLE reporte_ac_records ADD COLUMN descripcion TEXT'); } catch(e) {}
    try { await db.execute("ALTER TABLE reporte_ac_records ADD COLUMN workspace VARCHAR(100) DEFAULT 'Red Vial 6'"); } catch(e) {}
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        try { await db.execute("DELETE FROM reporte_ac_records WHERE record_id = '9999991'"); } catch (e) {}
        const workspace = getRequestWorkspace(req);
        const records = await db.fetchAll('SELECT * FROM reporte_ac_records WHERE workspace = ? ORDER BY created_at DESC, id DESC', [workspace]);
        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        console.error('Error fetching Reporte A/C records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const { records, userName } = body;
        const actingUser = userName || 'Usuario';
        const workspace = (body.workspace && String(body.workspace).trim()) || getRequestWorkspace(req);

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        let inserted = 0;

        for (const r of records) {
            const rid = String(r.id);
            const existing = await db.fetchAll('SELECT id, pdf_url FROM reporte_ac_records WHERE record_id = ?', [rid]);
            
            if (existing.length === 0) {
                await db.execute(
                    `INSERT INTO reporte_ac_records (record_id, date, responsible, acto, condicion, cantidad, location, pdf_url, accion_inmediata, descripcion, workspace)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rid,
                        r.date || '',
                        r.responsible || '',
                        r.acto || '',
                        r.condicion || '',
                        Number(r.cantidad) || 0,
                        r.location || '',
                        r.pdfUrl || '',
                        r.accion_inmediata || '',
                        r.descripcion || '',
                        workspace
                    ]
                );
                inserted++;
            } else if (r.pdfUrl && !existing[0].pdf_url) {
                await db.execute(
                    `UPDATE reporte_ac_records SET pdf_url = ?, workspace = ? WHERE record_id = ?`,
                    [r.pdfUrl, workspace, rid]
                );
            }
        }

        if (inserted > 0) {
            await logActivity(actingUser, `SINCRONIZACIÓN REPORTE A/C: ${inserted} nuevos items`, 'Reporte A/C', `Última carga`);
        }

        return NextResponse.json({ success: true, count: inserted });
    } catch (error: any) {
        console.error('Error saving Reporte A/C records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await ensureTable();
        const data = await req.json();
        
        const { id, record_id, date, responsible, acto, condicion, cantidad, location, pdfUrl, accion_inmediata, descripcion } = data;
        
        if (!id && !record_id) {
            return NextResponse.json({ success: false, error: 'Se requiere ID o record_id' }, { status: 400 });
        }

        const targetId = record_id || String(id);

        await db.execute(
            `UPDATE reporte_ac_records 
             SET date = ?, responsible = ?, acto = ?, condicion = ?, cantidad = ?, location = ?, pdf_url = ?, accion_inmediata = ?, descripcion = ?
             WHERE record_id = ? OR id = ?`,
            [
                date || '',
                responsible || '',
                acto || '',
                condicion || '',
                Number(cantidad) || 0,
                location || '',
                pdfUrl || '',
                accion_inmediata || '',
                descripcion || '',
                targetId,
                Number(targetId) || 0
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating Reporte A/C record:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await ensureTable();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
        }
        await db.execute('DELETE FROM reporte_ac_records WHERE record_id = ? OR id = ?', [String(id), Number(id) || 0]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting Reporte A/C record:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
