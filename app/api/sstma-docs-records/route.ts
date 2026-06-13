export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const isPostgres = !!process.env.POSTGRES_URL;
        
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS sstma_docs_records (
                    id ${isPostgres ? 'BIGSERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
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
            if (isPostgres) {
                await db.execute('ALTER TABLE sstma_docs_records ALTER COLUMN id TYPE BIGINT');
            }
        } catch (e) {}

        const records = await db.fetchAll('SELECT * FROM sstma_docs_records ORDER BY created_at DESC');
        
        const formattedRecords = records.map((r: any) => ({
            ...r,
            documentType: r.document_type,
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

        // 1. MODO ACCION (Delta Sync)
        if (body.action) {
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');

                const res = await db.execute(
                    `INSERT INTO sstma_docs_records (date, document_type, description, responsable, zona, file_url, file_urls)
                     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        r.date || '',
                        r.documentType || '',
                        r.description || '',
                        r.responsable || r.responsible || '',
                        r.zona || r.location || '',
                        r.fileUrl || (r.fileUrls?.[0] || ''),
                        JSON.stringify(r.fileUrls || [])
                    ]
                );
                const newId = res.rows?.[0]?.id || res.rows?.[0]?.lastInsertRowid;
                return NextResponse.json({ success: true, id: newId });
            }

            if (body.action === 'UPDATE') {
                const r = body.record;
                if (!r || !r.id) throw new Error('Falta el record o su ID para UPDATE');

                await db.execute(
                    `UPDATE sstma_docs_records 
                     SET date = ?, document_type = ?, description = ?, responsable = ?, zona = ?, file_url = ?, file_urls = ?
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.documentType || '',
                        r.description || '',
                        r.responsable || r.responsible || '',
                        r.zona || r.location || '',
                        r.fileUrl || (r.fileUrls?.[0] || ''),
                        JSON.stringify(r.fileUrls || []),
                        r.id
                    ]
                );
                return NextResponse.json({ success: true });
            }

            if (body.action === 'DELETE') {
                const id = body.id || (body.record && body.record.id);
                if (!id) throw new Error('Falta el ID para DELETE');
                await db.execute('DELETE FROM sstma_docs_records WHERE id = ?', [id]);
                return NextResponse.json({ success: true });
            }
        }

        // 2. MODO ARRAY (Compatibilidad temporal)
        const records = Array.isArray(body) ? body : body.records;
        if (!records) return NextResponse.json({ success: false, error: 'No records provided' });

        let inserted = 0;

        for (const record of records) {
            const fileUrl = record.fileUrl || (record.fileUrls?.[0] || '');
            const existing = await db.fetchAll(
                'SELECT id FROM sstma_docs_records WHERE file_url = ? OR description = ?', 
                [fileUrl, record.description || '']
            );
            
            if (existing.length === 0) {
                await db.execute(
                    'INSERT INTO sstma_docs_records (date, document_type, description, responsable, zona, file_url, file_urls) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        record.date,
                        record.documentType,
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
