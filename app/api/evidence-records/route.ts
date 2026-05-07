export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { logActivity } from '@/app/actions';

// Crear tabla si no existe
async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS evidence_center_records (
            id SERIAL PRIMARY KEY,
            record_id VARCHAR(100),
            date VARCHAR(20),
            objective VARCHAR(50),
            activity VARCHAR(200),
            description TEXT,
            responsable VARCHAR(100),
            zona VARCHAR(200),
            file_url TEXT,
            file_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// GET - Obtener registros de evidencias (soporta filtros para el Asistente SSOMA)
export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location')?.toLowerCase();
        const category = searchParams.get('category')?.toLowerCase();
        const limit = parseInt(searchParams.get('limit') || '100');

        // MIGRATION: Convert old 'EMO' objective to 'OBJ 05'
        await db.execute("UPDATE evidence_center_records SET objective = 'OBJ 05' WHERE objective = 'EMO'");

        let rawRecords = await db.fetchAll('SELECT * FROM evidence_center_records ORDER BY created_at DESC');
        
        // Deduplicate and filter in JS for better fuzzy matching
        const uniqueRecords = [];
        const seenKeys = new Set();
        for (const r of rawRecords) {
            const contentKey = `${r.date}|${r.responsable || r.responsible}|${r.objective}|${r.activity || r.description}|${r.zona || r.location}|${r.file_url || r.fileUrl}`;
            
            if (!seenKeys.has(contentKey)) {
                let match = true;
                
                if (location && !r.zona?.toLowerCase().includes(location) && !r.description?.toLowerCase().includes(location)) {
                    match = false;
                }
                
                if (category && !r.activity?.toLowerCase().includes(category) && !r.description?.toLowerCase().includes(category) && !r.objective?.toLowerCase().includes(category)) {
                    match = false;
                }

                if (match) {
                    uniqueRecords.push({
                        ...r,
                        images: [r.file_url] // Standardize for assistant gallery
                    });
                    seenKeys.add(contentKey);
                }
            }

            if (uniqueRecords.length >= limit) break;
        }

        return NextResponse.json({ success: true, records: uniqueRecords });
    } catch (error: any) {
        console.error('Error fetching evidence records:', error);
        return NextResponse.json({ success: true, records: [] });
    }
}

// POST - Guardar registros de evidencias
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const { records, userName } = await req.json();
        const actingUser = userName || 'Usuario';

        if (!Array.isArray(records)) {
            return NextResponse.json({ success: false, error: 'Records must be an array' }, { status: 400 });
        }

        const uniqueRecords = [];
        const seenKeys = new Set();
        const objectivesToClear = new Set();
        
        for (const r of records) {
            const contentKey = `${r.date}|${r.responsable || r.responsible}|${r.objective}|${r.activity || r.description}|${r.zona || r.location}|${r.file_url || r.fileUrl}`;
            if (!seenKeys.has(contentKey)) {
                uniqueRecords.push(r);
                seenKeys.add(contentKey);
                if (r.objective) objectivesToClear.add(r.objective);
            }
        }

        // Solo borramos los objetivos que estamos actualizando
        for (const obj of Array.from(objectivesToClear)) {
            await db.execute('DELETE FROM evidence_center_records WHERE objective = ?', [obj]);
        }

        for (const r of uniqueRecords) {
            await db.execute(
                `INSERT INTO evidence_center_records (record_id, date, objective, activity, description, responsable, zona, file_url, file_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(r.id || r.record_id || ''),
                    r.date || '',
                    r.objective || '',
                    r.activity || '',
                    r.description || '',
                    r.responsable || r.responsible || '',
                    r.zona || r.location || r.zone || '',
                    r.fileUrl || r.file_url || '',
                    r.fileType || r.file_type || ''
                ]
            );
        }

        if (uniqueRecords.length > 0) {
            await logActivity(actingUser, `SINCRONIZACIÓN EVIDENCIAS: ${uniqueRecords.length} items`, 'PMA', `Objetivos: ${Array.from(objectivesToClear).join(', ')}`);
        }
        return NextResponse.json({ success: true, count: uniqueRecords.length });
    } catch (error: any) {
        console.error('Error saving evidence records:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
