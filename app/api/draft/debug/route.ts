import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await db.execute('SELECT doc_type, fields FROM report_drafts');
        return NextResponse.json({ success: true, drafts: result.rows || result });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
    }
}