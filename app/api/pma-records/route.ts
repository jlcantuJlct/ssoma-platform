import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pma_evidence_records (
            id SERIAL PRIMARY KEY,
            record_id VARCHAR(100),
            date VARCHAR(20),
            responsible VARCHAR(100),
            category VARCHAR(100),
            description TEXT,
            location VARCHAR(100),
            images TEXT, -- Stored as JSON array string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET() {
    try {
        await ensureTable();
        const rawRecords = await db.fetchAll('SELECT * FROM pma_evidence_records ORDER BY created_at DESC');
        
        // Deduplicate in JS to handle existing DB duplicates gracefully
        const uniqueRecords = [];
        const seenKeys = new Set();
        for (const r of rawRecords) {
            // Use content-based key to catch duplicates with different IDs
            const contentKey = `${r.date}|${r.responsible}|${r.category}|${r.location}|${typeof r.images === 'string' ? r.images : JSON.stringify(r.images || [])}`;
            if (!seenKeys.has(contentKey)) {
                uniqueRecords.push(r);
                seenKeys.add(contentKey);
            }
        }
        
        return NextResponse.json({ success: true, records: uniqueRecords });
    } catch (error: any) {
        console.error('Error fetching PMA records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records } = await req.json();

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        // Deduplicate records by content to avoid doubling entries
        const uniqueRecords = [];
        const seenKeys = new Set();
        
        for (const r of records) {
            const contentKey = `${r.date}|${r.responsible}|${r.category}|${r.location}|${JSON.stringify(r.images || [])}`;
            if (!seenKeys.has(contentKey)) {
                uniqueRecords.push(r);
                seenKeys.add(contentKey);
            }
        }

        await db.execute('DELETE FROM pma_evidence_records');

        for (const r of uniqueRecords) {
            await db.execute(
                `INSERT INTO pma_evidence_records (record_id, date, responsible, category, description, location, images)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(r.id),
                    r.date || '',
                    r.responsible || '',
                    r.category || '',
                    r.description || '',
                    r.location || '',
                    JSON.stringify(r.images || [])
                ]
            );
        }

        return NextResponse.json({ success: true, count: uniqueRecords.length });
    } catch (error: any) {
        console.error('Error saving PMA records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
