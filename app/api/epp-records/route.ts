export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS epp_records (
            id SERIAL PRIMARY KEY,
            month VARCHAR(20) NOT NULL,
            date VARCHAR(20) NOT NULL,
            responsible VARCHAR(150),
            location VARCHAR(200),
            description TEXT,
            files JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros EPP
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM epp_records ORDER BY month DESC, date DESC, id DESC');

        // Mapear al formato esperado por el frontend
        const parsed = records.map((r: any) => ({
            id: r.id,
            month: r.month,
            date: r.date,
            responsible: r.responsible,
            location: r.location,
            description: r.description,
            files: typeof r.files === 'string' ? JSON.parse(r.files) : (r.files || [])
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching EPP records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar o migrar registros
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        const { action, data, id, userName } = body;
        const actingUser = userName || (data && data.responsible) || 'Usuario';

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO epp_records (month, date, responsible, location, description, files)
                 VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.month || '',
                    data.date || '',
                    data.responsible || '',
                    data.location || '',
                    data.description || '',
                    JSON.stringify(data.files || [])
                ]
            );
            await logActivity(actingUser, \`NUEVO REGISTRO EPP: \${data.location}\`, 'EPP', \`Mes: \${data.month}\`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await db.execute('DELETE FROM epp_records WHERE id=?', [id]);
            await logActivity(actingUser, \`ELIMINACIÓN EPP\`, 'EPP', \`ID: \${id}\`);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            // Usamos un insert simple por iteración, adecuado para migraciones pequeñas
            for (const r of data) {
                await db.execute(
                    `INSERT INTO epp_records (month, date, responsible, location, description, files)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        r.month || '',
                        r.date || '',
                        r.responsible || '',
                        r.location || '',
                        r.description || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            if (count > 0) {
                await logActivity(actingUser, \`MIGRACIÓN EPP COMPLETADA\`, 'EPP', \`\${count} registros\`);
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving EPP records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
