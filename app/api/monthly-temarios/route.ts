export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS monthly_temarios (
            id SERIAL PRIMARY KEY,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(month, year)
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const url = new URL(req.url);
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');

        if (!month || !year) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros month o year' }, { status: 400 });
        }

        const res = await db.fetchAll('SELECT url FROM monthly_temarios WHERE month = ? AND year = ?', [Number(month), Number(year)]);
        
        if (res && res.length > 0) {
            return NextResponse.json({ success: true, url: res[0].url });
        } else {
            return NextResponse.json({ success: true, url: null });
        }
    } catch (error: any) {
        console.error('Error fetching monthly temario:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const { month, year, url } = body;

        if (month === undefined || !year || !url) {
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        await db.execute('DELETE FROM monthly_temarios WHERE month = ? AND year = ?', [Number(month), Number(year)]);
        await db.execute(
            'INSERT INTO monthly_temarios (month, year, url) VALUES (?, ?, ?)',
            [Number(month), Number(year), url]
        );

        return NextResponse.json({ success: true, message: 'URL guardada exitosamente' });
    } catch (error: any) {
        console.error('Error saving monthly temario:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await ensureTable();
        const url = new URL(req.url);
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');

        if (!month || !year) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros month o year' }, { status: 400 });
        }

        await db.execute('DELETE FROM monthly_temarios WHERE month = ? AND year = ?', [Number(month), Number(year)]);
        return NextResponse.json({ success: true, message: 'Temario eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error deleting monthly temario:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
