import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS annual_program (
            id SERIAL PRIMARY KEY,
            objective_id VARCHAR(20) NOT NULL,
            data_json TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener datos del programa anual
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM annual_program');

        // Convertir a formato de objeto { obj1: [...], obj2: [...], ... }
        const programData: Record<string, any[]> = {};
        records.forEach((r: any) => {
            try {
                programData[r.objective_id] = r.data_json ? JSON.parse(r.data_json) : [];
            } catch (e) {
                programData[r.objective_id] = [];
            }
        });

        return NextResponse.json({ success: true, programData });
    } catch (error: any) {
        console.error('Error fetching annual program:', error);
        return NextResponse.json({ success: true, programData: {} });
    }
}

// POST - Guardar datos del programa anual
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { programData } = await req.json();

        if (!programData || typeof programData !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid programData' }, { status: 400 });
        }

        // Borrar todos los registros y reemplazar
        await db.execute('DELETE FROM annual_program');

        for (const [objId, data] of Object.entries(programData)) {
            await db.execute(
                `INSERT INTO annual_program (objective_id, data_json) VALUES (?, ?)`,
                [objId, JSON.stringify(data)]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving annual program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
