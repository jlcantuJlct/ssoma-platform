import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS simulacro_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            responsible VARCHAR(100),
            drill_type VARCHAR(100),
            location VARCHAR(200),
            file_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros de simulacros
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM simulacro_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            responsible: r.responsible,
            drillType: r.drill_type,
            location: r.location,
            fileUrl: r.file_url || ''
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching simulacro records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - CRUD
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const { action, data, id, userName } = body;
        const actingUser = userName || (data && data.responsible) || 'Usuario';

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO simulacro_records (date, responsible, drill_type, location, file_url)
                 VALUES (?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.responsible || '',
                    data.drillType || '',
                    data.location || '',
                    data.fileUrl || ''
                ]
            );
            await logActivity(actingUser, `NUEVO SIMULACRO: ${data.drillType}`, 'Simulacros', `Lugar: ${data.location}`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute(
                `UPDATE simulacro_records SET 
                    date=?, responsible=?, drill_type=?, location=?, file_url=?
                 WHERE id=?`,
                [
                    data.date,
                    data.responsible,
                    data.drillType,
                    data.location,
                    data.fileUrl,
                    id
                ]
            );
            await logActivity(actingUser, `ACTUALIZACIÓN SIMULACRO: ${data.drillType}`, 'Simulacros', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
            await db.execute('DELETE FROM simulacro_records WHERE id=?', [id]);
            await logActivity(actingUser, `ELIMINACIÓN SIMULACRO`, 'Simulacros', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving simulacro records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
