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
// POST - Guardar datos del programa anual (Soporta actualizaciones parciales)
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { programData } = await req.json();

        if (!programData || typeof programData !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid programData' }, { status: 400 });
        }

        // NO BORRAMOS TODA LA TABLA. Solo actualizamos los objetivos recibidos.
        // Esto permite actualizaciones parciales (ej. solo 'obj2') sin perder 'obj1'.

        for (const [objId, data] of Object.entries(programData)) {
            // 1. Borrar versión anterior de este objetivo específico
            await db.execute('DELETE FROM annual_program WHERE objective_id = ?', [objId]);

            // 2. Insertar nueva versión
            await db.execute(
                `INSERT INTO annual_program (objective_id, data_json) VALUES (?, ?)`,
                [objId, JSON.stringify(data)]
            );
        }

        return NextResponse.json({ success: true, message: `Updated ${Object.keys(programData).length} objectives` });
    } catch (error: any) {
        console.error('Error saving annual program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
