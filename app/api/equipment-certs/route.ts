export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS equipment_certs (
            id SERIAL PRIMARY KEY,
            equipment_name VARCHAR(255),
            plate_id VARCHAR(50),
            cert_type VARCHAR(100),
            issuing_company VARCHAR(255),
            issue_date DATE,
            expiry_date DATE,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM equipment_certs ORDER BY expiry_date ASC');
        return NextResponse.json({ success: true, records });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { action, data } = await req.json();

        if (action === 'create') {
            const { equipment_name, plate_id, cert_type, issuing_company, issue_date, expiry_date, file_url } = data;
            await db.execute(
                'INSERT INTO equipment_certs (equipment_name, plate_id, cert_type, issuing_company, issue_date, expiry_date, file_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [equipment_name, plate_id, cert_type, issuing_company, issue_date, expiry_date, file_url]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            await db.execute('DELETE FROM equipment_certs WHERE id = ?', [data.id]);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
