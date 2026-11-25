export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userName, action, module, details } = body;

        if (!userName || !action || !module) {
            return NextResponse.json({ success: false, error: 'Faltan datos requeridos' }, { status: 400 });
        }

        await db.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_name VARCHAR(100),
                action VARCHAR(100),
                module VARCHAR(100),
                details TEXT,
                timestamp VARCHAR(50)
            )
        `);

        // Insertar en la tabla audit_logs
        await db.execute(
            `INSERT INTO audit_logs (user_name, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [userName, action, module, details || '', new Date().toISOString()]
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error tracking activity:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
