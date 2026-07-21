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
    
    // Add location and focusedField columns if they don't exist
    try {
        await db.execute(`ALTER TABLE presence_records ADD COLUMN location VARCHAR(255)`);
    } catch (e) {}
    try {
        await db.execute(`ALTER TABLE presence_records ADD COLUMN focusedField VARCHAR(255)`);
    } catch (e) {}
}

export async function POST(request: Request) {
    try {
        await ensureTable();
        const { username, name, location, focusedField } = await request.json();
        if (!username) return NextResponse.json({ success: false });

        const now = Date.now();
        const locString = location || 'Navegando';
        const focusString = focusedField || '';
        
        // Insert or update
        await db.execute(
            `INSERT INTO presence_records (username, name, last_seen, location, focusedField) 
             VALUES (?, ?, ?, ?, ?) 
             ON CONFLICT (username) 
             DO UPDATE SET name = EXCLUDED.name, last_seen = EXCLUDED.last_seen, location = EXCLUDED.location, focusedField = EXCLUDED.focusedField`,
            [username, name, now, locString, focusString]
        );

        // Delete records older than 1 minute
        await db.execute(`DELETE FROM presence_records WHERE last_seen < ?`, [now - 60000]);

        // Get updated list
        const rows = await db.fetchAll(`SELECT * FROM presence_records`);
        const cleanedPresence: Record<string, { name: string, lastSeen: number, location?: string, focusedField?: string }> = {};
        for (const row of rows) {
            cleanedPresence[row.username] = { 
                name: row.name, 
                lastSeen: Number(row.last_seen), 
                location: row.location, 
                focusedField: row.focusedField || row.focusedfield 
            };
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
        const cleanedPresence: Record<string, { name: string, lastSeen: number, location?: string, focusedField?: string }> = {};
        for (const row of rows) {
            cleanedPresence[row.username] = { 
                name: row.name, 
                lastSeen: Number(row.last_seen), 
                location: row.location, 
                focusedField: row.focusedField || row.focusedfield 
            };
        }

        return NextResponse.json({ success: true, presence: cleanedPresence });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) });
    }
}
