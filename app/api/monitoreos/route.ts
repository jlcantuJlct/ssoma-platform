export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS monitoring_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            agent_type VARCHAR(50) NOT NULL,
            parameter VARCHAR(200) NOT NULL,
            location VARCHAR(200) NOT NULL,
            files JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros de monitoreo
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM monitoring_records ORDER BY date DESC, id DESC');

        // Mapear al formato esperado por el frontend
        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            agentType: r.agent_type,
            parameter: r.parameter,
            location: r.location,
            files: typeof r.files === 'string' ? JSON.parse(r.files) : (r.files || [])
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching Monitoring records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar o migrar registros
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        const { action, data, id, userName } = body;
        const actingUser = userName || 'Usuario';

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO monitoring_records (date, agent_type, parameter, location, files)
                 VALUES (?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.agentType || '',
                    data.parameter || '',
                    data.location || '',
                    JSON.stringify(data.files || [])
                ]
            );
            await logActivity(actingUser, \`NUEVO MONITOREO: \${data.parameter}\`, 'MONITOREOS', \`Lugar: \${data.location}\`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await db.execute('DELETE FROM monitoring_records WHERE id=?', [id]);
            await logActivity(actingUser, \`ELIMINACIÓN MONITOREO\`, 'MONITOREOS', \`ID: \${id}\`);
            return NextResponse.json({ success: true });
        }

        if (action === 'bulk-create') {
            if (!Array.isArray(data)) return NextResponse.json({ success: false, error: 'Data must be array' }, { status: 400 });
            let count = 0;
            // Migración
            for (const r of data) {
                await db.execute(
                    `INSERT INTO monitoring_records (date, agent_type, parameter, location, files)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.agentType || '',
                        r.parameter || '',
                        r.location || '',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            if (count > 0) {
                await logActivity(actingUser, \`MIGRACIÓN MONITOREOS COMPLETADA\`, 'MONITOREOS', \`\${count} registros\`);
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving Monitoring records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
