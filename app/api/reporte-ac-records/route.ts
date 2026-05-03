export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM reporte_ac_records ORDER BY created_at DESC');
        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        console.error('Error fetching Reporte A/C records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records, userName } = await req.json();
        const actingUser = userName || 'Usuario';

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        // We use record_id for deduplication or overwrite all
        await db.execute('DELETE FROM reporte_ac_records');

        for (const r of records) {
            await db.execute(
                `INSERT INTO reporte_ac_records (record_id, date, responsible, acto, condicion, cantidad, location, pdf_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(r.id),
                    r.date || '',
                    r.responsible || '',
                    r.acto || '',
                    r.condicion || '',
                    Number(r.cantidad) || 0,
                    r.location || '',
                    r.pdfUrl || ''
                ]
            );
        }

        if (records.length > 0) {
            await logActivity(actingUser, `SINCRONIZACIÓN REPORTE A/C: ${records.length} items`, 'Reporte A/C', `Última carga`);
        }

        return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
        console.error('Error saving Reporte A/C records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
