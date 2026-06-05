export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pesaje_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            waste_type VARCHAR(100),
            weight REAL,
            location VARCHAR(200),
            category VARCHAR(50),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM pesaje_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            wasteType: r.waste_type,
            weight: Number(r.weight),
            location: r.location,
            category: r.category,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : []
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching pesaje records:', error);
        return NextResponse.json({ success: false, error: error.message, records: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ACCION (Delta Sync)
        if (body.action) {
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');

                const res = await db.execute(
                    `INSERT INTO pesaje_records (date, waste_type, weight, location, category, files)
                     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                const newId = res.rows?.[0]?.id || res.rows?.[0]?.lastInsertRowid;
                return NextResponse.json({ success: true, id: newId });
            }

            if (body.action === 'UPDATE') {
                const r = body.record;
                if (!r || !r.id) throw new Error('Falta el record o su ID para UPDATE');

                await db.execute(
                    `UPDATE pesaje_records 
                     SET date = ?, waste_type = ?, weight = ?, location = ?, category = ?, files = ?
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || []),
                        r.id
                    ]
                );
                return NextResponse.json({ success: true });
            }

            if (body.action === 'DELETE') {
                const id = body.id || (body.record && body.record.id);
                if (!id) throw new Error('Falta el ID para DELETE');
                await db.execute('DELETE FROM pesaje_records WHERE id = ?', [id]);
                return NextResponse.json({ success: true });
            }
        }

        // MODO ARRAY (bulk upload)
        if (body.records && Array.isArray(body.records)) {
            let count = 0;
            for (const r of body.records) {
                // To avoid duplicate bulk inserts, we could clear or just append. 
                // We'll just append for now, or you can uncomment TRUNCATE if it's meant to replace.
                // await db.execute('TRUNCATE TABLE pesaje_records RESTART IDENTITY');
                await db.execute(
                    `INSERT INTO pesaje_records (date, waste_type, weight, location, category, files)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.wasteType || '',
                        Number(r.weight) || 0,
                        r.location || '',
                        r.category || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving pesaje records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
