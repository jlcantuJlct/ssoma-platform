export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTables() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS virtual_trainings (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            video_url TEXT NOT NULL,
            category TEXT DEFAULT 'Todos',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT true
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS virtual_training_questions (
            id SERIAL PRIMARY KEY,
            training_id INTEGER,
            question_text TEXT NOT NULL
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS virtual_training_options (
            id SERIAL PRIMARY KEY,
            question_id INTEGER,
            option_text TEXT NOT NULL,
            is_correct BOOLEAN DEFAULT false
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS virtual_training_results (
            id SERIAL PRIMARY KEY,
            training_id INTEGER,
            user_name VARCHAR(255) NOT NULL,
            score INTEGER NOT NULL,
            passed BOOLEAN NOT NULL,
            selected_options TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTables();
        const trainings = await db.fetchAll('SELECT * FROM virtual_trainings ORDER BY id DESC');
        return NextResponse.json({ success: true, trainings });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTables();
        const { title, video_url, category } = await req.json();
        
        if (!title || !video_url) {
            return NextResponse.json({ success: false, error: 'Faltan datos' }, { status: 400 });
        }

        const finalCategory = category || 'Todos';

        const result = await db.execute(
            'INSERT INTO virtual_trainings (title, video_url, category) VALUES (?, ?, ?)',
            [title, video_url, finalCategory]
        );

        return NextResponse.json({ success: true, id: result.rows?.[0]?.id });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
