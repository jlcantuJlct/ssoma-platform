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
        const row = await db.fetchOne('SELECT status, progress FROM export_requests WHERE id = ?', [requestId]);
        return NextResponse.json({ success: true, status: row?.status || 'unknown', progress: row?.progress || 0 });
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
        const { action, month, year, id, type = 'SHAREPOINT', location, progress } = body;

        // Robot updating status to completed
        if (action === 'complete' || action === 'update-progress') {
            await db.execute('UPDATE export_requests SET status = ?, progress = ? WHERE id = ?', [
                action === 'complete' ? 'completed' : 'processing', 
                progress || (action === 'complete' ? 100 : 0),
                id
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === 'delete-all') {
            await db.execute('DELETE FROM export_requests');
            return NextResponse.json({ success: true, message: 'All requests deleted' });
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
                    location TEXT,
                    progress INTEGER DEFAULT 0,
                    created_at ${isPostgres ? 'TIMESTAMP' : 'DATETIME'} DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {}
        try {
            await db.execute(`ALTER TABLE export_requests ADD COLUMN location TEXT`);
        } catch (e) {}
        try {
            await db.execute(`ALTER TABLE export_requests ADD COLUMN progress INTEGER DEFAULT 0`);
        } catch (e) {}

        // Creating new request
        if (!month && month !== 0) return NextResponse.json({ success: false, error: 'Month required' });
        
        let query = 'INSERT INTO export_requests (month, year, status, type, location) VALUES (?, ?, ?, ?, ?)';
        if (isPostgres) query += ' RETURNING id';

        const result = await db.execute(query, [month, year || 2026, 'pending', type, location || 'ALL']);

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
