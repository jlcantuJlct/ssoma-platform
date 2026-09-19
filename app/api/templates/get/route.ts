import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module');

    if (!moduleName) {
        return NextResponse.json({ success: false, error: 'Module name required' }, { status: 400 });
    }

    try {
        const result = await db.fetchOne(
            "SELECT items_json, version FROM templates_config WHERE module_name = ? ORDER BY version DESC LIMIT 1",
            [moduleName]
        );

        if (!result) {
            return NextResponse.json({ success: false, error: 'No template found' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            items: JSON.parse(result.items_json),
            version: result.version
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
