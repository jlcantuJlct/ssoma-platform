export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS cliente_comms_records (
            id SERIAL PRIMARY KEY,
            date VARCHAR(20) NOT NULL,
            subject VARCHAR(200),
            recipient VARCHAR(200),
            type VARCHAR(50),
            files JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener todos los registros
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM cliente_comms_records ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            date: r.date,
            subject: r.subject,
            recipient: r.recipient,
            type: r.type,
            files: r.files ? (typeof r.files === 'string' ? JSON.parse(r.files) : r.files) : []
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching cliente comms records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar o manipular registros
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // MODO ARRAY (para compatibilidad o guardado masivo)
        if (body.records && Array.isArray(body.records)) {
            // Reemplazo total o inserción simple
            // Para mantener compatibilidad con algunos componentes de la plataforma,
            // si llega un array 'records' podemos procesarlo.
            // Aqui vaciaremos la tabla y volveremos a insertar para simplicar el guardado si se envia la lista completa.
            // NOTA: Es un approach basico. Idealmente se enviaria un action='create'.
            await db.execute('TRUNCATE TABLE cliente_comms_records RESTART IDENTITY');
            let count = 0;
            for (const r of body.records) {
                await db.execute(
                    `INSERT INTO cliente_comms_records (date, subject, recipient, type, files)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        r.date || '',
                        r.subject || '',
                        r.recipient || '',
                        r.type || 'Enviada',
                        JSON.stringify(r.files || [])
                    ]
                );
                count++;
            }
            return NextResponse.json({ success: true, count });
        }

        return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving cliente comms records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
