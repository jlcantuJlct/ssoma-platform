export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // Obtenemos usuarios que han realizado acciones críticas (EDITA, ACTUALIZA, ELIMINA, MODIFICA)
        // en los últimos 7 días.
        
        const isPostgres = !!process.env.POSTGRES_URL;
        let query = '';
        
        if (isPostgres) {
            query = `
                SELECT DISTINCT user_name 
                FROM audit_logs 
                WHERE (action ILIKE '%ELIMINA%' OR action ILIKE '%EDITA%' OR action ILIKE '%ACTUALIZA%' OR action ILIKE '%MODIFICA%')
                AND "timestamp" > NOW() - INTERVAL '7 days'
            `;
        } else {
            query = `
                SELECT DISTINCT user_name 
                FROM audit_logs 
                WHERE (action LIKE '%ELIMINA%' OR action LIKE '%EDITA%' OR action LIKE '%ACTUALIZA%' OR action LIKE '%MODIFICA%')
                AND "timestamp" > datetime('now', '-7 days')
            `;
        }

        const res = await db.fetchAll(query);
        const users = res.map((row: any) => row.user_name);

        return NextResponse.json({ success: true, users });
    } catch (error: any) {
        console.error('Error fetching recent alerts:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
