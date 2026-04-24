import { NextRequest, NextResponse } from 'next/server';

// Simulación de base de datos en memoria para desarrollo inicial. 
// En producción, esto se sincroniza con localStorage en el cliente o una DB real.
let risstmaRecords: any[] = [];

export async function GET(req: NextRequest) {
    return NextResponse.json({ success: true, records: risstmaRecords });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, data, id } = body;

        if (action === 'bulk-sync') {
            risstmaRecords = data;
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            risstmaRecords = risstmaRecords.filter(r => r.id !== id);
            return NextResponse.json({ success: true });
        }

        // Default: Add single record
        const newRecord = {
            id: Date.now(),
            ...body,
            createdAt: new Date().toISOString()
        };
        risstmaRecords.push(newRecord);

        return NextResponse.json({ success: true, record: newRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
