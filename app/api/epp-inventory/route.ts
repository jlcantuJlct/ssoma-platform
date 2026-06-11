export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS epp_inventory_log (
            id SERIAL PRIMARY KEY,
            type VARCHAR(10) NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            quantity INT NOT NULL,
            date VARCHAR(20) NOT NULL,
            month VARCHAR(20) NOT NULL,
            responsible VARCHAR(150),
            location VARCHAR(200),
            description TEXT,
            files JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM epp_inventory_log ORDER BY date DESC, id DESC');

        const parsed = records.map((r: any) => ({
            id: r.id,
            type: r.type,
            item_name: r.item_name,
            unit: r.unit,
            quantity: r.quantity,
            date: r.date,
            month: r.month,
            responsible: r.responsible,
            location: r.location,
            description: r.description,
            files: typeof r.files === 'string' ? JSON.parse(r.files) : (r.files || [])
        }));

        return NextResponse.json({ success: true, records: parsed });
    } catch (error: any) {
        console.error('Error fetching EPP inventory records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        const { action, data, id, userName } = body;
        const actingUser = userName || (data && data.responsible) || 'Usuario';

        if (action === 'create') {
            const res = await db.execute(
                `INSERT INTO epp_inventory_log (type, item_name, unit, quantity, date, month, responsible, location, description, files)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                [
                    data.type || 'OUT',
                    data.item_name || '',
                    data.unit || 'UNIDAD',
                    data.quantity || 0,
                    data.date || '',
                    data.month || '',
                    data.responsible || '',
                    data.location || '',
                    data.description || '',
                    JSON.stringify(data.files || [])
                ]
            );
            const tipoMsg = data.type === 'IN' ? 'INGRESO' : 'ENTREGA';
            await logActivity(actingUser, `NUEVO REGISTRO ${tipoMsg} EPP: ${data.item_name}`, 'EPP_INVENTORY', `Cant: ${data.quantity}`);
            return NextResponse.json({ success: true, id: res.rows?.[0]?.id || 0 });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for update' }, { status: 400 });
            await db.execute(
                `UPDATE epp_inventory_log SET 
                 type=?, item_name=?, unit=?, quantity=?, date=?, month=?, responsible=?, location=?, description=?, files=? 
                 WHERE id=?`,
                [
                    data.type || 'OUT',
                    data.item_name || '',
                    data.unit || 'UNIDAD',
                    data.quantity || 0,
                    data.date || '',
                    data.month || '',
                    data.responsible || '',
                    data.location || '',
                    data.description || '',
                    JSON.stringify(data.files || []),
                    id
                ]
            );
            await logActivity(actingUser, `ACTUALIZACIÓN DE REGISTRO EPP`, 'EPP_INVENTORY', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required for delete' }, { status: 400 });
            await db.execute('DELETE FROM epp_inventory_log WHERE id=?', [id]);
            await logActivity(actingUser, `ELIMINACIÓN DE REGISTRO EPP INVENTARIO`, 'EPP_INVENTORY', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error saving EPP inventory records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
