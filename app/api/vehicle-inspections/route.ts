export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_inspection_records (
            id BIGINT PRIMARY KEY,
            correlativo VARCHAR(60),
            fecha VARCHAR(50),
            proyecto VARCHAR(100),
            equipo VARCHAR(100),
            marca VARCHAR(100),
            modelo VARCHAR(100),
            placa VARCHAR(50),
            chofer VARCHAR(100),
            turno VARCHAR(50),
            observaciones TEXT,
            nombre_colaborador VARCHAR(100),
            nombre_capataz VARCHAR(100),
            drive_url TEXT,
            status VARCHAR(50) DEFAULT 'Con Observaciones',
            fotos_levantamiento TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // Agregar columnas si ya existía la tabla sin ellas
    try { await db.execute(`ALTER TABLE vehicle_inspection_records ADD COLUMN fotos_levantamiento TEXT DEFAULT '[]'`); } catch(e){}
    try { await db.execute(`ALTER TABLE vehicle_inspection_records ADD COLUMN status VARCHAR(50) DEFAULT 'Con Observaciones'`); } catch(e){}
}

// GET - Obtener todas las inspecciones de vehículos
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll(
            'SELECT * FROM vehicle_inspection_records ORDER BY created_at DESC'
        );
        return NextResponse.json({ success: true, records });
    } catch (error: any) {
        console.error('Error fetching vehicle inspections:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Crear o actualizar inspecciones de vehículos
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const { action, id, data } = body;

        // Levantar observaciones
        if (action === 'levantar') {
            if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
            const fotosJson = JSON.stringify(data.fotos || []);
            await db.execute(
                `UPDATE vehicle_inspection_records SET status='Levantado', fotos_levantamiento=? WHERE id=?`,
                [fotosJson, id]
            );
            return NextResponse.json({ success: true });
        }

        // Eliminar registro
        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
            await db.execute('DELETE FROM vehicle_inspection_records WHERE id=?', [id]);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    } catch (error: any) {
        console.error('Error updating vehicle inspection:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
