import db from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS report_archives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_type VARCHAR(255),
            month_name VARCHAR(255),
            fields JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

// GET: Obtener todos los archivos guardados para un docType, o cargar uno específico
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('docType');
    const id = searchParams.get('id');

    try {
        await ensureTable();

        if (id) {
            // Cargar los campos de un archivo específico
            const result = await db.fetchOne(
                `SELECT fields FROM report_archives WHERE id = ?`,
                [id]
            );
            if (result && result.fields) {
                let fields = result.fields;
                if (typeof fields === 'string') {
                    try { fields = JSON.parse(fields); } catch(e){}
                }
                return NextResponse.json({ fields });
            }
            return NextResponse.json({ fields: {} });
        }

        if (!docType) {
            return NextResponse.json({ error: 'docType is required' }, { status: 400 });
        }

        // Listar todos los archivos guardados de este docType
        const results = await db.fetchAll(
            `SELECT id, month_name, created_at FROM report_archives WHERE doc_type = ? ORDER BY created_at DESC`,
            [docType]
        );
        return NextResponse.json({ archives: results || [] });
    } catch (error) {
        console.error('Error fetching archives:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Guardar un nuevo archivo (Mes histórico)
export async function POST(request: Request) {
    try {
        const { docType, monthName, fields } = await request.json();

        if (!docType || !monthName || !fields) {
            return NextResponse.json({ error: 'docType, monthName and fields are required' }, { status: 400 });
        }

        await ensureTable();

        await db.execute(
            `INSERT INTO report_archives (doc_type, month_name, fields) VALUES (?, ?, ?)`,
            [docType, monthName, JSON.stringify(fields)]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving archive:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Eliminar un archivo histórico
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
        await ensureTable();
        await db.execute(`DELETE FROM report_archives WHERE id = ?`, [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting archive:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
