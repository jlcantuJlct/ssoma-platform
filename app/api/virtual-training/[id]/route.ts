export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const training = await db.fetchOne('SELECT * FROM virtual_trainings WHERE id = ?', [id]);
        
        if (!training) {
            return NextResponse.json({ success: false, error: 'Capacitación no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true, training });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
