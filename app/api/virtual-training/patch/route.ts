export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        await db.execute("ALTER TABLE virtual_trainings ADD COLUMN category TEXT DEFAULT 'Todos'");
        return NextResponse.json({ success: true, message: 'Column added' });
    } catch(e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
