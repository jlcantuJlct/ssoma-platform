export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS compras_locales (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            zona VARCHAR(100),
            description TEXT,
            responsable VARCHAR(100),
            file_urls TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM compras_locales ORDER BY date DESC');

        const parsed = records.map((r: any) => {
            let fileUrls: string[] = [];
            try {
                if (r.file_urls && typeof r.file_urls === 'string') {
                    fileUrls = JSON.parse(r.file_urls);
                }
            } catch (e) {
                console.warn('Could not parse file_urls:', e);
            }
            return {
                ...r,
                id: Number(r.id),
                fileUrls
            };
        });

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching compras_locales:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const { action, record, id, userName } = body;
        const actingUser = userName || (record && record.responsable) || 'Usuario';

        if (action === 'CREATE') {
            const res = await db.execute(
                `INSERT INTO compras_locales (date, zona, description, responsable, file_urls)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [
                    record.date || '', record.zona || '', record.description || '', record.responsable || '',
                    JSON.stringify(record.fileUrls || [])
                ]
            );
            await logActivity(actingUser, `NUEVA COMPRA LOCAL`, 'COMPRAS', `Zona: ${record.zona}`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'UPDATE') {
            if (!record.id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute(
                `UPDATE compras_locales SET 
                    date=$1, zona=$2, description=$3, responsable=$4, file_urls=$5
                 WHERE id=$6`,
                [
                    record.date, record.zona, record.description, record.responsable,
                    JSON.stringify(record.fileUrls || []),
                    record.id
                ]
            );
            await logActivity(actingUser, `ACTUALIZACIÓN COMPRA LOCAL`, 'COMPRAS', `ID: ${record.id}`);
            return NextResponse.json({ success: true });
        }

        if (action === 'DELETE') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute('DELETE FROM compras_locales WHERE id=$1', [id]);
            await logActivity(actingUser, `ELIMINACIÓN COMPRA LOCAL`, 'COMPRAS', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error in compras_locales:', error);
        return NextResponse.json({ success: false, error: error.message || 'Error en BD' }, { status: 500 });
    }
}
