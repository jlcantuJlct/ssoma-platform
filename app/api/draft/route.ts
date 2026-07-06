import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS report_drafts (
            doc_type VARCHAR(255) PRIMARY KEY,
            fields JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType');

    if (!docType) {
        return NextResponse.json({ error: 'docType is required' }, { status: 400 });
    }

    try {
        await ensureTable();
        const result = await db.fetchOne(
            `SELECT fields FROM report_drafts WHERE doc_type = ?`,
            [docType]
        );
        if (result && result.fields) {
            let fields = result.fields;
            if (typeof fields === 'string') {
                try { fields = JSON.parse(fields); } catch(e){}
            }
            return NextResponse.json({ fields });
        } else {
            return NextResponse.json({ fields: {} });
        }
    } catch (error) {
        console.error('Error fetching draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { docType, fields } = await request.json();

        if (!docType || !fields) {
            return NextResponse.json({ error: 'docType and fields are required' }, { status: 400 });
        }

        await ensureTable();

        const existing = await db.fetchOne(`SELECT fields FROM report_drafts WHERE doc_type = ?`, [docType]);
        let currentFields = {};
        if (existing && existing.fields) {
            currentFields = typeof existing.fields === 'string' ? JSON.parse(existing.fields) : existing.fields;
        }
        
        const newFields: Record<string, any> = { ...currentFields };
        for (const [k, v] of Object.entries(fields)) {
            if (v === null) {
                delete newFields[k];
            } else {
                newFields[k] = v;
            }
        }
        
        if (existing) {
            await db.execute(
                `UPDATE report_drafts SET fields = ?, updated_at = CURRENT_TIMESTAMP WHERE doc_type = ?`,
                [JSON.stringify(newFields), docType]
            );
        } else {
            await db.execute(
                `INSERT INTO report_drafts (doc_type, fields, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [docType, JSON.stringify(newFields)]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType');

    if (!docType) {
        return NextResponse.json({ error: 'docType is required' }, { status: 400 });
    }

    try {
        await ensureTable();
        await db.execute(`DELETE FROM report_drafts WHERE doc_type = ?`, [docType]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
