import { NextResponse } from 'next/server';
import db from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
    try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN fotos_defectos_json TEXT'); } catch(e) {}
    return NextResponse.json({ success: true });
}
