export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const authHeader = req.headers.get('Authorization');

    // Action for checking status (No auth needed for public polling if desired, but good to keep it)
    if (action === 'check-status') {
        const requestId = searchParams.get('id');
        if (!requestId) return NextResponse.json({ success: false, error: 'ID required' });
        
        const status = await db.fetchOne('SELECT status FROM export_requests WHERE id = ?', [requestId]);
        return NextResponse.json({ success: true, status: status?.status || 'unknown' });
    }

    // Security check for robot actions
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'ssoma_cron_2026'}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'get-pending') {
        const requests = await db.fetchAll('SELECT * FROM export_requests WHERE status = ?', ['pending']);
        return NextResponse.json({ success: true, requests });
    }

    return NextResponse.json({ success: false, error: 'Acción inválida' });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action, month, year, id, type = 'SHAREPOINT' } = body;

    // Robot updating status to completed
    if (action === 'complete') {
        if (!id) return NextResponse.json({ success: false, error: 'ID required' });
        await db.execute('UPDATE export_requests SET status = ? WHERE id = ?', ['completed', id]);
        return NextResponse.json({ success: true });
    }

    // Creating new request
    if (!month && month !== 0) return NextResponse.json({ success: false, error: 'Month required' });
    
    const result = await db.execute(
        'INSERT INTO export_requests (month, year, status, type) VALUES (?, ?, ?, ?)',
        [month, year || 2025, 'pending', type]
    );

    // Get the ID (Postgres vs SQLite handled by db helper usually, but let's be safe)
    const requestId = result.insertId || result.rows?.[0]?.id || 0;

    return NextResponse.json({ 
        success: true, 
        requestId,
        message: `Solicitud de ${type} enviada. El Robot Local procesará la descarga.` 
    });
}
