export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS sctr_records (
            id SERIAL PRIMARY KEY,
            employee_name VARCHAR(255),
            company VARCHAR(100),
            policy_number VARCHAR(100),
            start_date DATE,
            end_date DATE,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM sctr_records ORDER BY end_date ASC');
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
            const { employee_name, company, policy_number, start_date, end_date, file_url } = data;
            await db.execute(
                'INSERT INTO sctr_records (employee_name, company, policy_number, start_date, end_date, file_url) VALUES (?, ?, ?, ?, ?, ?)',
                [employee_name, company, policy_number, start_date, end_date, file_url]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            await db.execute('DELETE FROM sctr_records WHERE id = ?', [data.id]);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
