import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Verifica qué módulos tiene pendientes el usuario actual para HOY
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const userName = searchParams.get('name') || '';

    if (!username) {
        return NextResponse.json({ pending: [] });
    }

    const today = new Date().toISOString().split('T')[0];
    const firstName = userName.split(' ')[0] || username;
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const pending: string[] = [];

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`,
            [`${today}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('Inspecciones');
    } catch { pending.push('Inspecciones'); }

    if (!isGladys) {
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('ATS');
        } catch { pending.push('ATS'); }

        try {
            const rows = await db.fetchAll(
                `SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('PETAR');
        } catch { pending.push('PETAR'); }
    }

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`,
            [`${today}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('HHC');
    } catch { pending.push('HHC'); }

    return NextResponse.json({ pending, today, username });
}
