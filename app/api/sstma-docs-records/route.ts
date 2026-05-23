export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const isPostgres = !!process.env.POSTGRES_URL;
        
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS sstma_docs_records (
                    id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
                    date TEXT,
                    document_type TEXT,
                    description TEXT,
                    responsable TEXT,
                    zona TEXT,
                    file_url TEXT,
                    file_urls TEXT,
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {}

        const records = await db.fetchAll('SELECT * FROM sstma_docs_records ORDER BY created_at DESC');
        
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
        
        await db.execute('DELETE FROM sstma_docs_records');

        let query = 'INSERT INTO sstma_docs_records (id, date, document_type, description, responsable, zona, file_url, file_urls) VALUES ';
        const values: any[] = [];
        const placeholders: string[] = [];

        records.forEach((record: any, index: number) => {
            placeholders.push(`(?, ?, ?, ?, ?, ?, ?, ?)`);
            values.push(
                record.id || Date.now() + index,
                record.date,
                record.documentType,
                record.description || '',
                record.responsable || record.responsible || '',
                record.zona || record.location || '',
                record.fileUrl || (record.fileUrls?.[0] || ''),
                JSON.stringify(record.fileUrls || [])
            );
        });

        if (records.length > 0) {
            query += placeholders.join(', ');
            await db.execute(query, values);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
