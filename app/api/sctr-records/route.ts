export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS sctr_monthly_records (
            id SERIAL PRIMARY KEY,
            month VARCHAR(50),
            year INTEGER,
            company VARCHAR(100),
            policy_number VARCHAR(100),
            expiration_date DATE,
            file_url TEXT,
            personnel_list TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM sctr_monthly_records ORDER BY year DESC, month DESC');
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
            const { month, year, company, policy_number, expiration_date, file_url, personnel_list } = data;
            await db.execute(
                'INSERT INTO sctr_monthly_records (month, year, company, policy_number, expiration_date, file_url, personnel_list) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [month, year, company, policy_number, expiration_date, file_url, personnel_list]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            await db.execute('DELETE FROM sctr_monthly_records WHERE id = ?', [data.id]);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
