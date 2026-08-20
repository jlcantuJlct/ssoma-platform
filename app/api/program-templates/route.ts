export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS program_templates (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(20) NOT NULL UNIQUE,
            filename VARCHAR(255),
            file_data TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET: Obtener una plantilla por tipo
export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const tipo = req.nextUrl.searchParams.get('tipo');
        if (!tipo) {
            // Devolver lista de plantillas disponibles (sin el file_data)
            const rows = await db.fetchAll(
                'SELECT id, tipo, filename, updated_at FROM program_templates'
            );
            return NextResponse.json({ success: true, templates: rows });
        }
        const row = await db.fetchOne(
            'SELECT * FROM program_templates WHERE tipo = ?',
            [tipo]
        );
        if (!row) {
            return NextResponse.json({ success: false, error: 'Plantilla no encontrada' }, { status: 404 });
        }
        // Devolver el archivo como binario
        const buffer = Buffer.from(row.file_data, 'base64');
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${row.filename}"`,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: Subir / actualizar una plantilla
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const formData = await req.formData();
        const tipo = formData.get('tipo') as string;
        const file = formData.get('file') as File;

        if (!tipo || !file) {
            return NextResponse.json({ success: false, error: 'Faltan campos: tipo y file' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');

        // Upsert: borrar y reinsertar
        await db.execute('DELETE FROM program_templates WHERE tipo = ?', [tipo]);
        await db.execute(
            'INSERT INTO program_templates (tipo, filename, file_data) VALUES (?, ?, ?)',
            [tipo, file.name, base64]
        );

        return NextResponse.json({ success: true, message: `Plantilla "${tipo}" guardada correctamente` });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Eliminar una plantilla
export async function DELETE(req: NextRequest) {
    try {
        await ensureTable();
        const tipo = req.nextUrl.searchParams.get('tipo');
        if (!tipo) return NextResponse.json({ success: false, error: 'Falta tipo' }, { status: 400 });
        await db.execute('DELETE FROM program_templates WHERE tipo = ?', [tipo]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
