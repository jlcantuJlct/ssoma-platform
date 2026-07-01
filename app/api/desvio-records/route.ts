export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS desvio_evidence_records (
            id SERIAL PRIMARY KEY,
            record_id VARCHAR(100),
            date VARCHAR(20),
            responsible VARCHAR(100),
            category VARCHAR(100),
            description TEXT,
            location VARCHAR(100),
            images TEXT, -- Stored as JSON array string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM desvio_evidence_records ORDER BY created_at DESC');
        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        console.error('Error fetching Desvio records:', error);
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

        for (const r of records) {
            const rid = String(r.id);
            // Check if it already exists to avoid duplicates and prevent data loss
            const numericId = !isNaN(Number(rid)) ? Number(rid) : 0;
            const existing = await db.fetchAll('SELECT id FROM desvio_evidence_records WHERE record_id = ? OR id = ?', [rid, numericId]);
            if (existing.length === 0) {
                await db.execute(
                    `INSERT INTO desvio_evidence_records (record_id, date, responsible, category, description, location, images)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rid,
                        r.date || '',
                        r.responsible || '',
                        r.category || '',
                        r.description || '',
                        r.location || '',
                        JSON.stringify(r.images || [])
                    ]
                );
            }
        }

        if (records.length > 0) {
            await logActivity(actingUser, `SINCRONIZACIÓN DESVÍOS: ${records.length} items`, 'Desvío', `Última carga`);
        }

        return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
        console.error('Error saving Desvio records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
