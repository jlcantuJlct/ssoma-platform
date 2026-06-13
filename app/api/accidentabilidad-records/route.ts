export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const isPostgres = !!process.env.POSTGRES_URL;
        
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS accidentabilidad_records (
                    id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
                    date TEXT,
                    month TEXT,
                    type TEXT,
                    description TEXT,
                    responsable TEXT,
                    zona TEXT,
                    file_url TEXT,
                    file_urls TEXT,
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {}

        const records = await db.fetchAll('SELECT * FROM accidentabilidad_records ORDER BY created_at DESC');
        
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
        const body = await req.json();
        const records = Array.isArray(body) ? body : body.records;
        if (!records) return NextResponse.json({ success: false, error: 'No records provided' });

        const isPostgres = !!process.env.POSTGRES_URL;
        
        let inserted = 0;

        for (const record of records) {
            // Check if record exists based on fileUrl or description
            const fileUrl = record.fileUrl || (record.fileUrls?.[0] || '');
            const existing = await db.fetchAll(
                'SELECT id FROM accidentabilidad_records WHERE file_url = ? OR description = ?', 
                [fileUrl, record.description || '']
            );
            
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO accidentabilidad_records (date, month, type, description, responsable, zona, file_url, file_urls) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        record.date,
                        record.month || '',
                        record.type || '',
                        record.description || '',
                        record.responsable || record.responsible || '',
                        record.zona || record.location || '',
                        fileUrl,
                        JSON.stringify(record.fileUrls || [])
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
