export const dynamic = 'force-dynamic';
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

// POST - Guardar datos del programa anual (Soporta actualizaciones parciales y atómicas)
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        let updateData: Record<string, any[]> = {};
        if (body.objectiveId && Array.isArray(body.records)) {
            updateData[body.objectiveId] = body.records;
        } else if (body.programData && typeof body.programData === 'object') {
            updateData = body.programData;
        } else {
            return NextResponse.json({ success: false, error: 'Formato de datos no válido' }, { status: 400 });
        }

        const objIds = Object.keys(updateData);
        if (objIds.length > 0) {
            for (const objId of objIds) {
                // Borrar anterior para este objetivo e insertar nuevo registro con updated_at
                await db.execute(`DELETE FROM annual_program WHERE objective_id = ?`, [objId]);
                await db.execute(
                    `INSERT INTO annual_program (objective_id, data_json) VALUES (?, ?)`,
                    [objId, JSON.stringify(updateData[objId] || [])]
                );
            }
        }

        return NextResponse.json({ success: true, message: `Actualizado(s) ${objIds.length} objetivo(s) con éxito` });
    } catch (error: any) {
        console.error('Error saving annual program:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

