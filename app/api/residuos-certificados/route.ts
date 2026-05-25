export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const isPostgres = !!process.env.POSTGRES_URL;
        
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS residuos_certificados (
                    id ${isPostgres ? 'BIGINT' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
                    date TEXT,
                    month TEXT,
                    cert_type TEXT,
                    description TEXT,
                    responsable TEXT,
                    zona TEXT,
                    file_url TEXT,
                    file_urls TEXT,
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
                )
            `);
            if (isPostgres) {
                await db.execute('ALTER TABLE residuos_certificados ALTER COLUMN id TYPE BIGINT');
            }
        } catch (e) {}

        const records = await db.fetchAll('SELECT * FROM residuos_certificados ORDER BY created_at DESC');
        
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

        // 1. MODO ACCION (Delta Sync)
        if (body.action) {
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');

                const res = await db.execute(
                    `INSERT INTO residuos_certificados (date, month, cert_type, description, responsable, zona, file_url, file_urls)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        r.date || '',
                        r.month || '',
                        r.certType || r.cert_type || '',
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
                    `UPDATE residuos_certificados 
                     SET date = ?, month = ?, cert_type = ?, description = ?, responsable = ?, zona = ?, file_url = ?, file_urls = ?
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.month || '',
                        r.certType || r.cert_type || '',
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
                await db.execute('DELETE FROM residuos_certificados WHERE id = ?', [id]);
                return NextResponse.json({ success: true });
            }
        }

        // 2. MODO ARRAY (Compatibilidad temporal)
        const records = Array.isArray(body) ? body : body.records;
        if (!records) return NextResponse.json({ success: false, error: 'No records provided' });

        const isPostgres = !!process.env.POSTGRES_URL;
        
        await db.execute('DELETE FROM residuos_certificados');

        let query = 'INSERT INTO residuos_certificados (id, date, month, cert_type, description, responsable, zona, file_url, file_urls) VALUES ';
        const values: any[] = [];
        const placeholders: string[] = [];

        records.forEach((record: any, index: number) => {
            placeholders.push(`(?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            values.push(
                record.id || Date.now() + index,
                record.date,
                record.month || '',
                record.certType || record.cert_type || '',
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
