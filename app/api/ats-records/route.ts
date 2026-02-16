import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ats_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            responsible VARCHAR(100),
            location VARCHAR(200),
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros ATS
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM ats_records ORDER BY date DESC, id DESC');

        // Mapear nombres de columnas a camelCase para el frontend
        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            responsible: r.responsible,
            location: r.location,
            fileUrl: r.file_url || ''
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching ATS records:', error);
        // Return empty array instead of error to prevent client crash
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar registros con acciones CRUD
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ACCIONES
        const { action, data, id } = body;

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO ats_records (date, responsible, location, file_url)
                 VALUES (?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.responsible || '',
                    data.location || '',
                    data.fileUrl || ''
                ]
            );
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for update' }, { status: 400 });

            await db.execute(
                `UPDATE ats_records SET 
                    date=?, responsible=?, location=?, file_url=?
                 WHERE id=?`,
                [
                    data.date,
                    data.responsible,
                    data.location,
                    data.fileUrl,
                    id
                ]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await db.execute('DELETE FROM ats_records WHERE id=?', [id]);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            for (const r of data) {
                await db.execute(
                    `INSERT INTO ats_records (date, responsible, location, file_url)
                     VALUES (?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.responsible || '',
                        r.location || '',
                        r.fileUrl || ''
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving ATS records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
