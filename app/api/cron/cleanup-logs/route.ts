export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    // Verificar encabezado de Vercel Cron en producción
    const authHeader = request.headers.get('authorization');
    if (
        process.env.NODE_ENV === 'production' &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Eliminar registros de audit_logs más antiguos a 7 días
        // En Postgres: timestamp < NOW() - INTERVAL '7 days'
        // En SQLite local: timestamp < datetime('now', '-7 days')
        
        const isPostgres = !!process.env.POSTGRES_URL;
        
        let query = '';
        if (isPostgres) {
            query = `DELETE FROM audit_logs WHERE "timestamp" < NOW() - INTERVAL '7 days'`;
        } else {
            query = `DELETE FROM audit_logs WHERE "timestamp" < datetime('now', '-7 days')`;
        }

        const res = await db.execute(query);

        return NextResponse.json({ 
            success: true, 
            message: 'Logs limpiados exitosamente',
            deletedCount: res.rowCount 
        });

    } catch (error: any) {
        console.error('Error cleaning up logs:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
