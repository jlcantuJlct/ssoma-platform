import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTables() {
    // 1. Table for Monthly Statistics (HHT, Accidents, Waste)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS monthly_stats_records (
            id SERIAL PRIMARY KEY,
            month INTEGER,
            year INTEGER,
            location VARCHAR(100),
            stat_key VARCHAR(50),
            stat_value REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(month, year, location, stat_key)
        )
    `);

    // 2. Table for Report Annexes (SCTR, EMOs, etc.)
    // Supporting permanent documents with location 'GLOBAL' or specific
    await db.execute(`
        CREATE TABLE IF NOT EXISTS report_annexes (
            id SERIAL PRIMARY KEY,
            month INTEGER, -- Can be NULL for permanent
            year INTEGER,  -- Can be NULL for permanent
            location VARCHAR(100),
            annex_id INTEGER, -- 0 to 17
            label VARCHAR(255),
            file_path TEXT,
            is_permanent BOOLEAN DEFAULT FALSE,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTables();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'stats' or 'annexes'
        const month = parseInt(searchParams.get('month') || '-1');
        const year = parseInt(searchParams.get('year') || '-1');
        const location = searchParams.get('location') || 'SAN CLEMENTE';

        if (type === 'stats') {
            const stats = await db.fetchAll(
                'SELECT stat_key, stat_value FROM monthly_stats_records WHERE month = ? AND year = ? AND location = ?',
                [month, year, location]
            );
            return NextResponse.json({ success: true, stats });
        }

        if (type === 'annexes') {
            // Get Monthly Annexes + Permanent Annexes
            const annexes = await db.fetchAll(
                `SELECT * FROM report_annexes 
                 WHERE (month = ? AND year = ? AND location = ?) 
                 OR (is_permanent = TRUE AND location = ?)`,
                [month, year, location, location]
            );
            return NextResponse.json({ success: true, annexes });
        }

        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in report-tools GET:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTables();
        const body = await req.json();
        const { type, month, year, location, data } = body;

        if (type === 'stats') {
            // data should be an object like { HHT: 500, ATT: 1, ... }
            for (const [key, val] of Object.entries(data)) {
                await db.execute(
                    `INSERT INTO monthly_stats_records (month, year, location, stat_key, stat_value)
                     VALUES (?, ?, ?, ?, ?)
                     ON CONFLICT(month, year, location, stat_key) 
                     DO UPDATE SET stat_value = EXCLUDED.stat_value`,
                    [month, year, location, key, val]
                );
            }
            return NextResponse.json({ success: true });
        }

        if (type === 'annexes') {
            // data should be an annex object
            const { annex_id, label, file_path, is_permanent } = data;
            
            // If permanent, we replace any existing permanent for that ID and location
            if (is_permanent) {
                await db.execute(
                    'DELETE FROM report_annexes WHERE annex_id = ? AND location = ? AND is_permanent = TRUE',
                    [annex_id, location]
                );
                await db.execute(
                    `INSERT INTO report_annexes (location, annex_id, label, file_path, is_permanent)
                     VALUES (?, ?, ?, ?, TRUE)`,
                    [location, annex_id, label, file_path]
                );
            } else {
                // Monthly: replace for that specific month
                await db.execute(
                    'DELETE FROM report_annexes WHERE month = ? AND year = ? AND location = ? AND annex_id = ?',
                    [month, year, location, annex_id]
                );
                await db.execute(
                    `INSERT INTO report_annexes (month, year, location, annex_id, label, file_path, is_permanent)
                     VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
                    [month, year, location, annex_id, label, file_path]
                );
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in report-tools POST:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false }, { status: 400 });

        await db.execute('DELETE FROM report_annexes WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
