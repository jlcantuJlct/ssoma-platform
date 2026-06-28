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
        const monthParam = searchParams.get('month');
        const limit = parseInt(searchParams.get('limit') || '100');

        // MIGRATION: Convert old 'EMO' objective to 'OBJ 05'
        await db.execute("UPDATE evidence_center_records SET objective = 'OBJ 05' WHERE objective = 'EMO'");

        // OPTIMIZATION: Push limit to database level to avoid pulling tens of thousands of rows into Vercel memory
        let rawRecords = await db.fetchAll('SELECT * FROM evidence_center_records ORDER BY created_at DESC LIMIT 500');
        
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

                if (monthParam && monthParam !== 'all') {
                    const recordDate = new Date(r.date);
                    const recordMonth = recordDate.getMonth() + 1; // 1-12
                    if (recordMonth !== parseInt(monthParam)) {
                        match = false;
                    }
                }

                if (match) {
                    let parsedUrls = [];
                    try {
                        if (r.file_url && r.file_url.startsWith('[')) {
                            parsedUrls = JSON.parse(r.file_url);
                        } else if (r.file_url) {
                            parsedUrls = r.file_url.split('|').filter(Boolean);
                        }
                    } catch (e) {
                        parsedUrls = [r.file_url];
                    }

                    uniqueRecords.push({
                        ...r,
                        fileUrl: parsedUrls[0] || '',
                        fileUrls: parsedUrls,
                        images: parsedUrls // Standardize for assistant gallery
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

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();

        // 1. MODO ACCION (Delta Sync)
        if (body.action) {
            const actingUser = body.userName || 'Usuario';
            
            if (body.action === 'CREATE') {
                const r = body.record;
                if (!r) throw new Error('Falta el record para CREATE');

                // Asegurar que file_url contenga todos los enlaces (como JSON si es array, o el string original)
                let finalFileUrl = r.fileUrl || r.file_url || '';
                if (Array.isArray(r.fileUrls) && r.fileUrls.length > 0) {
                    finalFileUrl = JSON.stringify(r.fileUrls);
                }

                const res = await db.execute(
                    `INSERT INTO evidence_center_records (record_id, date, objective, activity, description, responsable, zona, file_url, file_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
                    [
                        String(r.id || r.record_id || Date.now()),
                        r.date || '',
                        r.objective || '',
                        r.activity || '',
                        r.description || '',
                        r.responsable || r.responsible || '',
                        r.zona || r.location || r.zone || '',
                        finalFileUrl,
                        r.fileType || r.file_type || ''
                    ]
                );
                
                await logActivity(actingUser, `EVIDENCIA CREADA: ${r.activity}`, 'PMA', `Objetivo: ${r.objective}`);
                const newId = res.rows?.[0]?.id || res.rows?.[0]?.lastInsertRowid;
                return NextResponse.json({ success: true, id: newId });
            }

            if (body.action === 'UPDATE') {
                const r = body.record;
                if (!r || (!r.id && !r.record_id)) throw new Error('Falta el record o su ID para UPDATE');

                let finalFileUrl = r.fileUrl || r.file_url || '';
                if (Array.isArray(r.fileUrls) && r.fileUrls.length > 0) {
                    finalFileUrl = JSON.stringify(r.fileUrls);
                }

                // Intentar actualizar por id (numérico) primero, si no usar record_id
                let updateQuery = `UPDATE evidence_center_records 
                                   SET date = ?, objective = ?, activity = ?, description = ?, responsable = ?, zona = ?, file_url = ?, file_type = ?
                                   WHERE `;
                const params = [
                    r.date || '',
                    r.objective || '',
                    r.activity || '',
                    r.description || '',
                    r.responsable || r.responsible || '',
                    r.zona || r.location || r.zone || '',
                    finalFileUrl,
                    r.fileType || r.file_type || ''
                ];

                if (r.id) {
                    updateQuery += `id = ?`;
                    params.push(r.id);
                } else {
                    updateQuery += `record_id = ?`;
                    params.push(String(r.record_id));
                }

                await db.execute(updateQuery, params);
                await logActivity(actingUser, `EVIDENCIA ACTUALIZADA: ${r.activity}`, 'PMA', `Objetivo: ${r.objective}`);
                return NextResponse.json({ success: true });
            }

            if (body.action === 'DELETE') {
                const id = body.id || (body.record && body.record.id);
                const recordIdStr = body.record_id || (body.record && body.record.record_id);
                if (!id && !recordIdStr) throw new Error('Falta el ID para DELETE');

                if (id) {
                    await db.execute('DELETE FROM evidence_center_records WHERE id = ?', [id]);
                } else {
                    await db.execute('DELETE FROM evidence_center_records WHERE record_id = ?', [String(recordIdStr)]);
                }
                
                await logActivity(actingUser, `EVIDENCIA ELIMINADA`, 'PMA', `ID: ${id || recordIdStr}`);
                return NextResponse.json({ success: true });
            }
        }

        // 2. MODO ARRAY (reemplazo por objetivo - Compatibilidad temporal)
        const { records, userName } = body;
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

        for (const obj of Array.from(objectivesToClear)) {
            await db.execute('DELETE FROM evidence_center_records WHERE objective = ?', [obj]);
        }

        for (const r of uniqueRecords) {
            let finalFileUrl = r.fileUrl || r.file_url || '';
            if (Array.isArray(r.fileUrls) && r.fileUrls.length > 0) {
                finalFileUrl = JSON.stringify(r.fileUrls);
            }

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
                    finalFileUrl,
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
