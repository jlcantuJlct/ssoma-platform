export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS objetivos_anuales (
            id SERIAL PRIMARY KEY,
            workspace VARCHAR(100) NOT NULL,
            data_json TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener los objetivos del año para el workspace activo
export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const cookieWs = req.cookies.get('ssoma_workspace')?.value;
        const queryWs = req.nextUrl.searchParams.get('workspace');
        const workspace = queryWs || (cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6');

        const record = await db.fetchOne('SELECT * FROM objetivos_anuales WHERE workspace = ? ORDER BY id DESC LIMIT 1', [workspace]);

        let objetivos: any[] = [];
        if (record && record.data_json) {
            try {
                objetivos = JSON.parse(record.data_json);
            } catch (e) {
                objetivos = [];
            }
        }

        return NextResponse.json({ success: true, workspace, objetivos });
    } catch (error: any) {
        console.error('Error fetching objetivos anuales:', error);
        return NextResponse.json({ success: true, workspace: 'Red Vial 6', objetivos: [] });
    }
}

// POST - Guardar o actualizar la lista de objetivos del año
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const cookieWs = req.cookies.get('ssoma_workspace')?.value;
        const workspace = body.workspace || (cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6');
        const objetivos = Array.isArray(body.objetivos) ? body.objetivos : [];

        const existing = await db.fetchOne('SELECT id FROM objetivos_anuales WHERE workspace = ?', [workspace]);
        const dataJson = JSON.stringify(objetivos);

        if (existing) {
            await db.execute(
                'UPDATE objetivos_anuales SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE workspace = ?',
                [dataJson, workspace]
            );
        } else {
            await db.execute(
                'INSERT INTO objetivos_anuales (workspace, data_json) VALUES (?, ?)',
                [workspace, dataJson]
            );
        }

        return NextResponse.json({ success: true, message: 'Objetivos guardados exitosamente', count: objetivos.length });
    } catch (error: any) {
        console.error('Error saving objetivos anuales:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
