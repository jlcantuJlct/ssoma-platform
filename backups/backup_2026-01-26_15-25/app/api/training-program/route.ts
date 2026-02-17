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

// POST - Guardar programa de formación
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records } = await req.json();

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        await db.execute('DELETE FROM training_program');

        for (const r of records) {
            await db.execute(
                `INSERT INTO training_program (date, tema, area, tipo) VALUES (?, ?, ?, ?)`,
                [r.date || '', r.tema || '', r.area || 'seguridad', r.tipo || 'capacitacion']
            );
        }

        return NextResponse.json({ success: true, count: records.length });
    } catch (error: any) {
        console.error('Error saving training program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
