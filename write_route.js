
const fs = require('fs');
const fields = require('./recovered_fields.json');
const code = \import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const fields = \;
    const docType = 'PAD_SAN_CLEMENTE_INTERNAL.docx';
    
    await db.execute('DELETE FROM drafts WHERE doc_type = ?', [docType]);
    
    await db.execute(
        'INSERT INTO drafts (doc_type, fields) VALUES (?, ?)',
        [docType, JSON.stringify(fields)]
    );
    
    return NextResponse.json({ success: true, restored: Object.keys(fields).length });
}\;
fs.writeFileSync('app/api/draft/restore_script_temp/route.ts', code);
