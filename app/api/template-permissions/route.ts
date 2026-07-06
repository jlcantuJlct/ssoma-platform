import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS template_permissions (
            template_name VARCHAR(255) PRIMARY KEY,
            allowed_users JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const results = await db.fetchAll(`SELECT template_name, allowed_users FROM template_permissions`);
        
        const permissions: Record<string, string[]> = {};
        for (const row of results) {
            let users = [];
            if (typeof row.allowed_users === 'string') {
                try { users = JSON.parse(row.allowed_users); } catch(e){}
            } else if (Array.isArray(row.allowed_users)) {
                users = row.allowed_users;
            }
            permissions[row.template_name] = users;
        }

        return NextResponse.json({ permissions });
    } catch (error) {
        console.error('Error fetching template permissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { templateName, allowedUsers } = await request.json();

        if (!templateName || !Array.isArray(allowedUsers)) {
            return NextResponse.json({ error: 'templateName and allowedUsers array are required' }, { status: 400 });
        }

        await ensureTable();

        const existing = await db.fetchOne(`SELECT template_name FROM template_permissions WHERE template_name = ?`, [templateName]);
        
        if (existing) {
            await db.execute(
                `UPDATE template_permissions SET allowed_users = ?, updated_at = CURRENT_TIMESTAMP WHERE template_name = ?`,
                [JSON.stringify(allowedUsers), templateName]
            );
        } else {
            await db.execute(
                `INSERT INTO template_permissions (template_name, allowed_users, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [templateName, JSON.stringify(allowedUsers)]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving template permissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
