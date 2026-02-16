import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS training_program (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            tema TEXT,
            area VARCHAR(50) DEFAULT 'seguridad',
            tipo VARCHAR(50) DEFAULT 'capacitacion',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener programa de formación
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM training_program ORDER BY date ASC');
        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        console.error('Error fetching training program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Guardar programa de formación con acciones CRUD
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // 1. MODO LEGADO
        if (body.records && Array.isArray(body.records) && !body.action) {
            const newRecords = body.records.filter((r: any) => !r.id);
            let insertedCount = 0;
            for (const r of newRecords) {
                await db.execute(
                    `INSERT INTO training_program (date, tema, area, tipo) VALUES (?, ?, ?, ?)`,
                    [r.date || '', r.tema || '', r.area || 'seguridad', r.tipo || 'capacitacion']
                );
                insertedCount++;
            }
            return NextResponse.json({ success: true, message: "Legacy Sync: Appended new records", count: insertedCount });
        }

        // 2. MODO ACCIONES
        const { action, data, id } = body;

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO training_program (date, tema, area, tipo) VALUES (?, ?, ?, ?) RETURNING id`,
                [data.date || '', data.tema || '', data.area || 'seguridad', data.tipo || 'capacitacion']
            );
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute(
                `UPDATE training_program SET date=?, tema=?, area=?, tipo=? WHERE id=?`,
                [data.date, data.tema, data.area, data.tipo, id]
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute('DELETE FROM training_program WHERE id=?', [id]);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete-month') {
            const { month, year } = data;
            if (month === undefined || !year) return NextResponse.json({ success: false, error: 'Month and Year required' }, { status: 400 });

            const monthStr = String(month + 1).padStart(2, '0');
            const pattern = `${year}-${monthStr}-%`;

            await db.execute('DELETE FROM training_program WHERE date LIKE ?', [pattern]);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            for (const r of data) {
                await db.execute(
                    `INSERT INTO training_program (date, tema, area, tipo) VALUES (?, ?, ?, ?)`,
                    [r.date || '', r.tema || '', r.area || 'seguridad', r.tipo || 'capacitacion']
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error saving training program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
