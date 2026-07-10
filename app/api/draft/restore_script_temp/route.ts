import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const fields = require('./recovered_fields.json');
        const docType = 'PAD_SAN_CLEMENTE_INTERNAL.docx';
        
        await db.execute('DELETE FROM report_drafts WHERE doc_type = ?', [docType]);
        
        await db.execute(
            'INSERT INTO report_drafts (doc_type, fields, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            [docType, JSON.stringify(fields)]
        );
        
        return NextResponse.json({ success: true, restored: Object.keys(fields).length });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || String(e), stack: e.stack }, { status: 500 });
    }
}