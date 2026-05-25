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
            mes_registro VARCHAR(50),
            file_urls TEXT,
            issuing_company VARCHAR(255),
            issue_date DATE,
            expiry_date DATE,
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Add columns if they don't exist
    try {
        await db.execute('ALTER TABLE equipment_certs ADD COLUMN mes_registro VARCHAR(50)');
    } catch (e) {}
    try {
        await db.execute('ALTER TABLE equipment_certs ADD COLUMN file_urls TEXT');
    } catch (e) {}
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM equipment_certs ORDER BY created_at DESC');
        
        const formattedRecords = records.map((r: any) => ({
            ...r,
            fileUrls: r.file_urls ? JSON.parse(r.file_urls) : (r.file_url ? [r.file_url] : [])
        }));

        return NextResponse.json({ success: true, records: formattedRecords });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { action, data } = await req.json();

        if (action === 'create') {
            const { equipment_name, plate_id, cert_type, mes_registro, fileUrls } = data;
            
            // Dummy values for deprecated columns to prevent null constraints if any
            const issuing_company = '';
            const issue_date = new Date().toISOString().split('T')[0];
            const expiry_date = new Date().toISOString().split('T')[0];
            const file_url = fileUrls?.[0] || '';
            const file_urls_json = JSON.stringify(fileUrls || []);

            await db.execute(
                'INSERT INTO equipment_certs (equipment_name, plate_id, cert_type, mes_registro, file_urls, issuing_company, issue_date, expiry_date, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [equipment_name, plate_id, cert_type, mes_registro, file_urls_json, issuing_company, issue_date, expiry_date, file_url]
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
