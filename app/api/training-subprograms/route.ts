export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getRequestWorkspace } from '@/lib/workspace';
import {
    TrainingSubprogram,
    DEFAULT_SUBPROGRAM_CAP_SEGURIDAD,
    DEFAULT_SUBPROGRAM_CAP_SALUD,
    DEFAULT_SUBPROGRAM_CAP_MA,
    DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS,
    DEFAULT_SUBPROGRAM_CAP_SCSST,
    DEFAULT_SUBPROGRAM_GENERAL,
    DEFAULT_SUBPROGRAM_BRIGADISTAS
} from '@/lib/trainingSubprogramsData';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS training_subprograms (
            id SERIAL PRIMARY KEY,
            subprogram_id VARCHAR(50) NOT NULL,
            data_json TEXT,
            workspace VARCHAR(100) DEFAULT 'Red Vial 6',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const workspace = getRequestWorkspace(req);
        let rows = await db.fetchAll('SELECT * FROM training_subprograms WHERE workspace = ?', [workspace]);
        if (!rows || rows.length === 0) {
            rows = await db.fetchAll("SELECT * FROM training_subprograms WHERE workspace ILIKE ? OR workspace = 'Red Vial 6'", [`%${workspace}%`]);
        }
        if (!rows || rows.length === 0) {
            rows = await db.fetchAll("SELECT * FROM training_subprograms");
        }

        const subprograms: Record<string, TrainingSubprogram> = {};
        rows.forEach((r: any) => {
            try {
                if (r.data_json) {
                    subprograms[r.subprogram_id] = JSON.parse(r.data_json);
                }
            } catch (e) {
                console.error('Error parsing subprogram JSON:', e);
            }
        });

        // Valores oficiales por defecto si no están en base de datos
        if (!subprograms['subprog_seguridad']) {
            subprograms['subprog_seguridad'] = DEFAULT_SUBPROGRAM_CAP_SEGURIDAD;
        }
        if (!subprograms['subprog_salud']) {
            subprograms['subprog_salud'] = DEFAULT_SUBPROGRAM_CAP_SALUD;
        }
        if (!subprograms['subprog_ma']) {
            subprograms['subprog_ma'] = DEFAULT_SUBPROGRAM_CAP_MA;
        }
        if (!subprograms['subprog_brigadistas']) {
            subprograms['subprog_brigadistas'] = DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS;
        }
        if (!subprograms['subprog_scsst']) {
            subprograms['subprog_scsst'] = DEFAULT_SUBPROGRAM_CAP_SCSST;
        }
        if (!subprograms['subprog_general']) {
            subprograms['subprog_general'] = DEFAULT_SUBPROGRAM_GENERAL;
        }

        return NextResponse.json({ success: true, subprograms });
    } catch (error: any) {
        console.error('Error fetching training subprograms:', error);
        return NextResponse.json({
            success: true,
            subprograms: {
                subprog_seguridad: DEFAULT_SUBPROGRAM_CAP_SEGURIDAD,
                subprog_salud: DEFAULT_SUBPROGRAM_CAP_SALUD,
                subprog_ma: DEFAULT_SUBPROGRAM_CAP_MA,
                subprog_brigadistas: DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS,
                subprog_scsst: DEFAULT_SUBPROGRAM_CAP_SCSST,
                subprog_general: DEFAULT_SUBPROGRAM_GENERAL
            }
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const workspace = getRequestWorkspace(req);
        const body = await req.json();
        const { subprograms } = body;

        if (!subprograms || typeof subprograms !== 'object') {
            return NextResponse.json({ success: false, error: 'Subprograms payload missing' }, { status: 400 });
        }

        for (const [subprogId, data] of Object.entries(subprograms)) {
            await db.execute('DELETE FROM training_subprograms WHERE subprogram_id = ? AND workspace = ?', [subprogId, workspace]);
            await db.execute(
                'INSERT INTO training_subprograms (subprogram_id, data_json, workspace) VALUES (?, ?, ?)',
                [subprogId, JSON.stringify(data), workspace]
            );
        }

        return NextResponse.json({ success: true, message: 'Subprogramas guardados exitosamente' });
    } catch (error: any) {
        console.error('Error saving training subprograms:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
