export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Verifica qué módulos tiene pendientes el usuario actual para HOY en su proyecto específico
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const userName = searchParams.get('name') || '';
    const workspace = searchParams.get('workspace') || req.cookies.get('ssoma_workspace')?.value || 'Red Vial 6';
    const isDeactivated = searchParams.get('deactivated') === 'true';

    // Si el usuario está desactivado o no tiene username, no tiene alertas activas
    if (!username || isDeactivated) {
        return NextResponse.json({ pending: [], message: 'Usuario desactivado o no especificado' });
    }

    const today = new Date().toISOString().split('T')[0];
    const firstName = userName.split(' ')[0] || username;
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const pending: string[] = [];

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
            [`${today}%`, `%${firstName}%`, workspace, workspace]
        );
        if (!rows || rows.length === 0) pending.push('Inspecciones');
    } catch { 
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('Inspecciones');
        } catch {}
    }

    if (!isGladys) {
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
                [`${today}%`, `%${firstName}%`, workspace, workspace]
            );
            if (!rows || rows.length === 0) pending.push('ATS');
        } catch {
            try {
                const rows = await db.fetchAll(
                    `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`,
                    [`${today}%`, `%${firstName}%`]
                );
                if (!rows || rows.length === 0) pending.push('ATS');
            } catch {}
        }

        try {
            const rows = await db.fetchAll(
                `SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
                [`${today}%`, `%${firstName}%`, workspace, workspace]
            );
            if (!rows || rows.length === 0) pending.push('PETAR');
        } catch {
            try {
                const rows = await db.fetchAll(
                    `SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`,
                    [`${today}%`, `%${firstName}%`]
                );
                if (!rows || rows.length === 0) pending.push('PETAR');
            } catch {}
        }
    }

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
            [`${today}%`, `%${firstName}%`, workspace, workspace]
        );
        if (!rows || rows.length === 0) pending.push('HHC');
    } catch {
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('HHC');
        } catch {}
    }

    return NextResponse.json({ pending, today, username, workspace });
}
