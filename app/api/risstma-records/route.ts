export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/app/actions';

import { getRequestWorkspace } from '@/lib/workspace';

// Simulación de base de datos en memoria para desarrollo inicial. 
// En producción, esto se sincroniza con localStorage en el cliente o una DB real.
let risstmaRecords: any[] = [];

export async function GET(req: NextRequest) {
    const workspace = getRequestWorkspace(req);
    const filtered = risstmaRecords.filter(r => (r.workspace || 'Red Vial 6') === workspace);
    return NextResponse.json({ success: true, records: filtered });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, data, id, userName } = body;
        const actingUser = userName || 'Usuario';
        const workspace = data?.workspace || getRequestWorkspace(req);

        if (action === 'bulk-sync') {
            const stamped = (data || []).map((item: any) => ({ ...item, workspace: item.workspace || workspace }));
            // Reemplazar solo los del workspace activo
            risstmaRecords = [...risstmaRecords.filter(r => (r.workspace || 'Red Vial 6') !== workspace), ...stamped];
            await logActivity(actingUser, `SINCRONIZACIÓN RISSTMA: ${data.length} items`, 'RISSTMA');
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            risstmaRecords = risstmaRecords.filter(r => r.id !== id);
            await logActivity(actingUser, `ELIMINACIÓN RISSTMA`, 'RISSTMA', `ID: ${id}`);
            return NextResponse.json({ success: true });
        }

        // Default: Add single record
        const newRecord = {
            id: Date.now(),
            ...body,
            workspace,
            createdAt: new Date().toISOString()
        };
        risstmaRecords.push(newRecord);
        await logActivity(actingUser, `NUEVO REGISTRO RISSTMA`, 'RISSTMA');

        return NextResponse.json({ success: true, record: newRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
