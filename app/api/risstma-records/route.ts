export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/app/actions';

// Simulación de base de datos en memoria para desarrollo inicial. 
// En producción, esto se sincroniza con localStorage en el cliente o una DB real.
let risstmaRecords: any[] = [];

export async function GET(req: NextRequest) {
    return NextResponse.json({ success: true, records: risstmaRecords });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, data, id, userName } = body;
        const actingUser = userName || 'Usuario';

        if (action === 'bulk-sync') {
            risstmaRecords = data;
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
            createdAt: new Date().toISOString()
        };
        risstmaRecords.push(newRecord);
        await logActivity(actingUser, `NUEVO REGISTRO RISSTMA`, 'RISSTMA');

        return NextResponse.json({ success: true, record: newRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
