export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS accidentes_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            time VARCHAR(10) NOT NULL,
            location VARCHAR(200),
            type VARCHAR(100),
            description TEXT,
            involved_person VARCHAR(200),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM accidentes_records ORDER BY date DESC, time DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            time: r.time,
            location: r.location,
            type: r.type,
            description: r.description,
            involvedPerson: r.involved_person,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : []
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching accidentes records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ARRAY (para guardado rápido / compatibilidad)
        if (body.records && Array.isArray(body.records)) {
            await db.execute('TRUNCATE TABLE accidentes_records RESTART IDENTITY');
            let count = 0;
            for (const r of body.records) {
                await db.execute(
                    `INSERT INTO accidentes_records (date, time, location, type, description, involved_person, files)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.time || '',
                        r.location || '',
                        r.type || '',
                        r.description || '',
                        r.involvedPerson || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving accidentes records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
