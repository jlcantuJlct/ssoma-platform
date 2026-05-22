export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS manifiesto_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            manifest_number VARCHAR(100),
            transport_company VARCHAR(200),
            waste_type VARCHAR(200),
            quantity VARCHAR(50),
            unit VARCHAR(20),
            location VARCHAR(200),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM manifiesto_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            manifestNumber: r.manifest_number,
            transportCompany: r.transport_company,
            wasteType: r.waste_type,
            quantity: r.quantity,
            unit: r.unit,
            location: r.location,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : []
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching manifiesto records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ARRAY (reemplazo masivo por compatibilidad temporal)
        if (body.records && Array.isArray(body.records)) {
            await db.execute('TRUNCATE TABLE manifiesto_records RESTART IDENTITY');
            let count = 0;
            for (const r of body.records) {
                await db.execute(
                    `INSERT INTO manifiesto_records (date, manifest_number, transport_company, waste_type, quantity, unit, location, files)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.manifestNumber || '',
                        r.transportCompany || '',
                        r.wasteType || '',
                        r.quantity || '',
                        r.unit || 'kg',
                        r.location || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving manifiesto records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
