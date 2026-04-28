export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    const results: string[] = [];

    // Agregar created_at a tabla progress
    try {
        await db.execute(`ALTER TABLE progress ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        results.push('✅ Columna created_at agregada a progress');
    } catch (e: any) {
        if (e.message?.includes('already exists') || e.message?.includes('duplicate column') || e.message?.includes('exists')) {
            results.push('ℹ️ progress.created_at ya existía');
        } else {
            results.push('⚠️ progress: ' + e.message);
        }
    }

    // Agregar created_at a tabla evidence
    try {
        await db.execute(`ALTER TABLE evidence ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        results.push('✅ Columna created_at agregada a evidence');
    } catch (e: any) {
        if (e.message?.includes('already exists') || e.message?.includes('duplicate column') || e.message?.includes('exists')) {
            results.push('ℹ️ evidence.created_at ya existía');
        } else {
            results.push('⚠️ evidence: ' + e.message);
        }
    }

    return NextResponse.json({ success: true, results });
}
