export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('user');

        if (!username) {
            return NextResponse.json({ success: false, error: 'Usuario no especificado' }, { status: 400 });
        }

        // Obtener historial desde la base de datos Postgres (audit_logs table)
        // Usamos ILIKE para coincidencia insensible a mayúsculas y permitir buscar por nombre completo
        const history = await db.fetchAll(
            'SELECT * FROM audit_logs WHERE user_name ILIKE ? ORDER BY timestamp DESC LIMIT 10',
            [`%${username}%`]
        );

        return NextResponse.json({ success: true, history });

    } catch (error: any) {
        console.error('Error fetching audit history:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
