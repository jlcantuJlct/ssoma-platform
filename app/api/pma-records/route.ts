export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pma_evidence_records (
            id BIGINT PRIMARY KEY,
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
        const rawRecords = await db.fetchAll('SELECT * FROM pma_evidence_records ORDER BY date DESC, created_at DESC');
        
        // Deduplicate in JS to handle existing DB duplicates gracefully
        const uniqueRecords = [];
        const seenKeys = new Set();
        for (const r of rawRecords) {
            let imagesCount = 0;
            try {
                const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                imagesCount = Array.isArray(imgs) ? imgs.length : 0;
            } catch (e) {
                imagesCount = 0;
            }

            // Use robust composite key
            const contentKey = `${r.date}|${r.responsible}|${r.category}|${r.location}|${imagesCount}`;
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
        const { records, userName } = await req.json();
        const actingUser = userName || 'Usuario';

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        // Deduplicate records by content to avoid doubling entries
        const uniqueRecords = [];
        const seenKeys = new Set();
        
        for (const r of records) {
            let imagesCount = Array.isArray(r.images) ? r.images.length : 0;
            const contentKey = `${r.date}|${r.responsible}|${r.category}|${r.location}|${imagesCount}`;
            if (!seenKeys.has(contentKey)) {
                uniqueRecords.push(r);
                seenKeys.add(contentKey);
            }
        }

        // SAFE SYNC LOGIC: Upsert based on ID instead of DELETE ALL
        for (const r of uniqueRecords) {
            const rid = r.id || Date.now();
            
            // Reemplazo de DELETE por verificación de existencia
            const existing = await db.fetchOne('SELECT id FROM pma_evidence_records WHERE id = ?', [rid]);
            
            if (existing) {
                await db.execute(
                    `UPDATE pma_evidence_records 
                     SET date = ?, responsible = ?, category = ?, description = ?, location = ?, images = ? 
                     WHERE id = ?`,
                    [
                        r.date || '',
                        r.responsible || '',
                        r.category || '',
                        r.description || '',
                        r.location || '',
                        JSON.stringify(r.images || []),
                        rid
                    ]
                );
            } else {
                await db.execute(
                    `INSERT INTO pma_evidence_records (id, record_id, date, responsible, category, description, location, images)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rid,
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
        }

        if (uniqueRecords.length > 0) {
            await logActivity(actingUser, `SINCRONIZACIÓN PMA: ${uniqueRecords.length} items`, 'PMA', `Última carga`);
        }

        return NextResponse.json({ success: true, count: uniqueRecords.length });
    } catch (error: any) {
        console.error('Error saving PMA records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
