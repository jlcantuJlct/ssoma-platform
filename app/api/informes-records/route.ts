export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

import { getRequestWorkspace } from '@/lib/workspace';

export async function GET(req: NextRequest) {
    try {
        const isPostgres = !!process.env.POSTGRES_URL;
        
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS informes_records (
                    id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
                    date TEXT,
                    month TEXT,
                    description TEXT,
                    responsable TEXT,
                    zona TEXT,
                    file_url TEXT,
                    file_urls TEXT,
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP,
                    workspace VARCHAR(100) DEFAULT 'Red Vial 6'
                )
            `);
            await db.execute("ALTER TABLE informes_records ADD COLUMN workspace VARCHAR(100) DEFAULT 'Red Vial 6'");
        } catch (e) {}

        const workspace = getRequestWorkspace(req);
        const records = await db.fetchAll('SELECT * FROM informes_records WHERE workspace = ? ORDER BY created_at DESC', [workspace]);
        
        const formattedRecords = records.map((r: any) => ({
            ...r,
            fileUrls: r.file_urls ? JSON.parse(r.file_urls) : (r.file_url ? [r.file_url] : [])
        }));

        return NextResponse.json({ success: true, records: formattedRecords });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const workspace = getRequestWorkspace(req);
        const body = await req.json();
        const records = Array.isArray(body) ? body : body.records;
        if (!records) return NextResponse.json({ success: false, error: 'No records provided' });

        const isPostgres = !!process.env.POSTGRES_URL;
        
        let inserted = 0;

        for (const record of records) {
            // Check if record exists based on fileUrl or description
            const fileUrl = record.fileUrl || (record.fileUrls?.[0] || '');
            const existing = await db.fetchAll(
                'SELECT id FROM informes_records WHERE workspace = ? AND (file_url = ? OR description = ?)', 
                [workspace, fileUrl, record.description || '']
            );
            
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO informes_records (date, month, description, responsable, zona, file_url, file_urls, workspace) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        record.date,
                        record.month || '',
                        record.description || '',
                        record.responsable || record.responsible || '',
                        record.zona || record.location || '',
                        fileUrl,
                        JSON.stringify(record.fileUrls || []),
                        workspace
                    ]
                );
                inserted++;
            }
        }

        return NextResponse.json({ success: true, count: inserted });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
