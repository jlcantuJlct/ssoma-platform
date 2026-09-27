import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { moduleName, template, answers, hallazgos, inspectionRecordId } = body;

        if (!Array.isArray(hallazgos)) {
            return NextResponse.json({ success: true, items: [] });
        }

        const idConfig = process.env.POSTGRES_URL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

        await db.execute(`
            CREATE TABLE IF NOT EXISTS hallazgo_levantamientos (
                id ${idConfig},
                token TEXT UNIQUE NOT NULL,
                module_name TEXT,
                hallazgo_index INTEGER,
                description TEXT,
                riesgo TEXT,
                categoria TEXT,
                responsable TEXT,
                responsable_email TEXT,
                fecha_prog TEXT,
                status TEXT DEFAULT 'Abierto',
                evidence TEXT,
                comentario TEXT,
                fotos_defectos_json TEXT,
                template_json TEXT,
                answers_json TEXT,
                inspection_record_id BIGINT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP
            )
        `);
        // Migración para tablas creadas antes de este cambio
        try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN inspection_record_id BIGINT'); } catch (e) {}
        try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN evidence TEXT'); } catch (e) {}
        try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN comentario TEXT'); } catch (e) {}
        try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN closed_at TIMESTAMP'); } catch (e) {}
        try { await db.execute('ALTER TABLE hallazgo_levantamientos ADD COLUMN fotos_defectos_json TEXT'); } catch (e) {}
        // Migración para cambiar el tipo si se creó como INTEGER en Postgres y está fallando
        try { 
            if (process.env.POSTGRES_URL) {
                await db.execute('ALTER TABLE hallazgo_levantamientos ALTER COLUMN inspection_record_id TYPE BIGINT'); 
            }
        } catch (e) {}

        const items: any[] = [];
        for (const h of hallazgos) {
            if (!h.responsableEmail) continue;
            const token = crypto.randomBytes(24).toString('hex');
            await db.execute(
                `INSERT INTO hallazgo_levantamientos
                    (token, module_name, hallazgo_index, description, riesgo, categoria, responsable, responsable_email, fecha_prog, template_json, answers_json, inspection_record_id, fotos_defectos_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    token,
                    moduleName || '',
                    h.index ?? 0,
                    h.descripcion || '',
                    h.riesgo || '',
                    h.categoria || '',
                    h.responsable || '',
                    h.responsableEmail || '',
                    h.fecha || '',
                    JSON.stringify(template || []),
                    JSON.stringify(answers || []),
                    inspectionRecordId ?? null, h.fotosDefectos ? JSON.stringify(h.fotosDefectos) : null
                ]
            );
            items.push({
                token,
                email: h.responsableEmail,
                responsable: h.responsable,
                description: h.descripcion,
            });
        }

        return NextResponse.json({ success: true, items });
    } catch (e: any) {
        console.error('Error creando levantamientos:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

