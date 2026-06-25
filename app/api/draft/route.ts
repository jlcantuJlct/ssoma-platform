import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType');

    if (!docType) {
        return NextResponse.json({ error: 'docType is required' }, { status: 400 });
    }

    try {
        const result = await sql`
            SELECT fields FROM report_drafts WHERE doc_type = ${docType};
        `;
        if (result.rowCount && result.rowCount > 0) {
            return NextResponse.json({ fields: result.rows[0].fields });
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

        // Upsert fields
        await sql`
            INSERT INTO report_drafts (doc_type, fields, updated_at)
            VALUES (${docType}, ${JSON.stringify(fields)}::jsonb, CURRENT_TIMESTAMP)
            ON CONFLICT (doc_type) DO UPDATE 
            SET fields = ${JSON.stringify(fields)}::jsonb, updated_at = CURRENT_TIMESTAMP;
        `;

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
        await sql`
            DELETE FROM report_drafts WHERE doc_type = ${docType};
        `;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing draft:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
