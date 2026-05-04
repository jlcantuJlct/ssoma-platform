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
    try {
        const body = await req.json();
        const { action, month, year, id, type = 'SHAREPOINT' } = body;

        // Robot updating status to completed
        if (action === 'complete') {
            if (!id) return NextResponse.json({ success: false, error: 'ID required' });
            await db.execute('UPDATE export_requests SET status = ? WHERE id = ?', [action === 'complete' ? 'completed' : 'pending', id]);
            return NextResponse.json({ success: true });
        }

        // Auto-create table if missing
        const isPostgres = !!process.env.POSTGRES_URL;
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS export_requests (
                    id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
                    month INTEGER,
                    year INTEGER,
                    status TEXT DEFAULT 'pending',
                    type TEXT DEFAULT 'SHAREPOINT',
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {
            console.warn("Table check error:", e);
        }

        // Creating new request
        if (!month && month !== 0) return NextResponse.json({ success: false, error: 'Month required' });
        
        let query = 'INSERT INTO export_requests (month, year, status, type) VALUES (?, ?, ?, ?)';
        if (isPostgres) query += ' RETURNING id';

        const result = await db.execute(query, [month, year || 2026, 'pending', type]);

        // Get the ID
        const requestId = result.insertId || result.rows?.[0]?.id || (result.rowCount > 0 ? "OK" : 0);

        return NextResponse.json({ 
            success: true, 
            requestId,
            message: `Solicitud de ${type} enviada. El Robot Local procesará la descarga.` 
        });
    } catch (error: any) {
        console.error("POST /api/export-center ERROR:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error interno del servidor' 
        }, { status: 500 });
    }
}
