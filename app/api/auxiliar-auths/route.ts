export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS auxiliar_auths (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            auth_type VARCHAR(200) NOT NULL,
            location VARCHAR(200) NOT NULL,
            files JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM auxiliar_auths ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            authType: r.auth_type,
            location: r.location,
            files: typeof r.files === 'string' ? JSON.parse(r.files) : (r.files || [])
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching Auxiliar Auths records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        const { action, data, id, userName } = body;
        const actingUser = userName || 'Usuario';

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO auxiliar_auths (date, auth_type, location, files)
                 VALUES (?, ?, ?, ?) RETURNING id`,
                [
                    data.date || '',
                    data.authType || '',
                    data.location || '',
                    JSON.stringify(data.files || [])
                ]
            );
            await logActivity(actingUser, \`NUEVA AUTORIZACIÓN: \${data.authType}\`, 'Medio Ambiente', \`Lugar: \${data.location}\`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await db.execute('DELETE FROM auxiliar_auths WHERE id=?', [id]);
            await logActivity(actingUser, \`ELIMINACIÓN DE AUTORIZACIÓN\`, 'Medio Ambiente', \`ID: \${id}\`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving Auxiliar Auths records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
