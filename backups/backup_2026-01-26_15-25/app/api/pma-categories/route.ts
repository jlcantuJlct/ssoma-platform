import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS pma_categories (
            id SERIAL PRIMARY KEY,
            category_id VARCHAR(100),
            label VARCHAR(200),
            hint TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener categorías PMA
export async function GET() {
    try {
        await ensureTable();
        const records = await db.fetchAll('SELECT * FROM pma_categories ORDER BY id ASC');

        // Mapear a formato del frontend
        const categories = records.map((r: any) => ({
            id: r.category_id,
            label: r.label,
            hint: r.hint
        }));

        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        console.error('Error fetching PMA categories:', error);
        return NextResponse.json({ success: true, categories: [] });
    }
}

// POST - Guardar categorías PMA
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { categories } = await req.json();

        if (!Array.isArray(categories)) {
            return NextResponse.json({ success: false, error: 'Categories must be an array' }, { status: 400 });
        }

        // Borrar y reemplazar
        await db.execute('DELETE FROM pma_categories');

        for (const c of categories) {
            await db.execute(
                `INSERT INTO pma_categories (category_id, label, hint) VALUES (?, ?, ?)`,
                [c.id || '', c.label || '', c.hint || '']
            );
        }

        return NextResponse.json({ success: true, count: categories.length });
    } catch (error: any) {
        console.error('Error saving PMA categories:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
