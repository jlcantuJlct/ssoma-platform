export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getRequestWorkspace } from '@/lib/workspace';
import {
    InspectionSubprogram,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_MA,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST
} from '@/lib/inspectionsSubprogramsData';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS inspections_subprograms (
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
        let rows = await db.fetchAll('SELECT * FROM inspections_subprograms WHERE workspace = ?', [workspace]);
        if (!rows || rows.length === 0) {
            rows = await db.fetchAll("SELECT * FROM inspections_subprograms WHERE workspace ILIKE ? OR workspace = 'Red Vial 6'", [`%${workspace}%`]);
        }
        if (!rows || rows.length === 0) {
            rows = await db.fetchAll("SELECT * FROM inspections_subprograms");
        }

        const subprograms: Record<string, InspectionSubprogram> = {};
        rows.forEach((r: any) => {
            try {
                if (r.data_json) {
                    subprograms[r.subprogram_id] = JSON.parse(r.data_json);
                }
            } catch (e) {
                console.error('Error parsing inspection subprogram JSON:', e);
            }
        });

        // Valores iniciales por defecto si no existen en BD
        if (!subprograms['subprog_insp_seguridad']) {
            subprograms['subprog_insp_seguridad'] = DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD;
        }
        if (!subprograms['subprog_insp_ma']) {
            subprograms['subprog_insp_ma'] = DEFAULT_SUBPROGRAM_INSPECCIONES_MA;
        }
        if (!subprograms['subprog_insp_salud']) {
            subprograms['subprog_insp_salud'] = DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD;
        }
        if (!subprograms['subprog_insp_scsst']) {
            subprograms['subprog_insp_scsst'] = DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST;
        }

        return NextResponse.json({ success: true, subprograms });
    } catch (error: any) {
        console.error('Error fetching inspection subprograms:', error);
        return NextResponse.json({
            success: true,
            subprograms: {
                subprog_insp_seguridad: DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD,
                subprog_insp_ma: DEFAULT_SUBPROGRAM_INSPECCIONES_MA,
                subprog_insp_salud: DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD,
                subprog_insp_scsst: DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST
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
            await db.execute('DELETE FROM inspections_subprograms WHERE subprogram_id = ? AND workspace = ?', [subprogId, workspace]);
            await db.execute(
                'INSERT INTO inspections_subprograms (subprogram_id, data_json, workspace) VALUES (?, ?, ?)',
                [subprogId, JSON.stringify(data), workspace]
            );
        }

        return NextResponse.json({ success: true, message: 'Subprogramas de inspección guardados exitosamente' });
    } catch (error: any) {
        console.error('Error saving inspection subprograms:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
