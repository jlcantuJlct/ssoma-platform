export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS presence_records (
            username VARCHAR(100) PRIMARY KEY,
            name VARCHAR(100),
            last_seen BIGINT
        )
    `);
}

export async function POST(request: Request) {
    try {
        await ensureTable();
        const { username, name } = await request.json();
        if (!username) return NextResponse.json({ success: false });

        const now = Date.now();
        // Insert or update
        await db.execute(
            `INSERT INTO presence_records (username, name, last_seen) 
             VALUES (?, ?, ?) 
             ON CONFLICT (username) 
             DO UPDATE SET name = EXCLUDED.name, last_seen = EXCLUDED.last_seen`,
            [username, name, now]
        );

        // Delete records older than 1 minute
        await db.execute(`DELETE FROM presence_records WHERE last_seen < ?`, [now - 60000]);

        // Get updated list
        const rows = await db.fetchAll(`SELECT * FROM presence_records`);
        const cleanedPresence: Record<string, { name: string, lastSeen: number }> = {};
        for (const row of rows) {
            cleanedPresence[row.username] = { name: row.name, lastSeen: Number(row.last_seen) };
        }

        return NextResponse.json({ success: true, presence: cleanedPresence });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}

export async function GET() {
    try {
        await ensureTable();
        const now = Date.now();
        
        // Delete records older than 1 minute
        await db.execute(`DELETE FROM presence_records WHERE last_seen < ?`, [now - 60000]);

        const rows = await db.fetchAll(`SELECT * FROM presence_records`);
        const cleanedPresence: Record<string, { name: string, lastSeen: number }> = {};
        for (const row of rows) {
            cleanedPresence[row.username] = { name: row.name, lastSeen: Number(row.last_seen) };
        }

        return NextResponse.json({ success: true, presence: cleanedPresence });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}
