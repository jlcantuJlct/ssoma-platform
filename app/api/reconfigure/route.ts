export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { record, targetCategory, targetSubtype, targetTema, targetArea, targetDate, temaAdicional, action } = await req.json();
        
        if (!record || (!targetCategory && action !== 'delete')) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        let sourceModule = record._type; // INSPECTION, HHC, EVIDENCE, PMA, ATS, PETAR, DETOUR, etc.
        const recordId = record.id || record.record_id;

        // Auto-detect source module if missing or undefined
        if (!sourceModule) {
            if (record.inspection_type !== undefined || record.observations !== undefined) {
                sourceModule = 'INSPECTION';
            } else if (record.tema !== undefined || record.responsable !== undefined || record.capacitacion !== undefined || record.hhc !== undefined) {
                sourceModule = 'HHC';
            } else if (record.acto !== undefined || record.condicion !== undefined) {
                sourceModule = 'REPORTE_AC';
            } else if (record.category !== undefined && record.title !== undefined) {
                sourceModule = 'EVIDENCE';
            } else if (record.type !== undefined && record.location !== undefined) {
                sourceModule = 'PETAR';
            } else if (record.file_url !== undefined && record.responsible !== undefined) {
                sourceModule = 'ATS';
            } else if (record.category !== undefined && record.description !== undefined) {
                sourceModule = 'PMA';
            }
        }

        // --- 1. DEFINE SOURCE TABLE ---
        let sourceTable = '';
        if (sourceModule === 'INSPECTION') sourceTable = 'inspection_records';
        else if (sourceModule === 'HHC') sourceTable = 'hhc_records';
        else if (sourceModule === 'EVIDENCE') sourceTable = 'evidence_center_records';
        else if (sourceModule === 'PMA') sourceTable = 'pma_evidence_records';
        else if (sourceModule === 'ATS') sourceTable = 'ats_records';
        else if (sourceModule === 'PETAR') sourceTable = 'petar_records';
        else if (sourceModule === 'DETOUR') sourceTable = 'desvio_evidence_records';
        else if (sourceModule === 'SIMULACRO') sourceTable = 'simulacro_records';
        else if (sourceModule === 'BRIGADISTA') sourceTable = 'brigadista_records';
        else if (sourceModule === 'RISSTMA') sourceTable = 'risstma_records';
        else if (sourceModule === 'REPORTE_AC') sourceTable = 'reporte_ac_records';

        // Fallback: If sourceTable is still not resolved, probe the database tables using recordId
        if (!sourceTable && recordId) {
            const probeList = [
                { mod: 'HHC', table: 'hhc_records', col: 'id' },
                { mod: 'INSPECTION', table: 'inspection_records', col: 'id' },
                { mod: 'EVIDENCE', table: 'evidence_center_records', col: 'id' },
                { mod: 'PMA', table: 'pma_evidence_records', col: 'record_id' },
                { mod: 'PMA', table: 'pma_evidence_records', col: 'id' },
                { mod: 'ATS', table: 'ats_records', col: 'id' },
                { mod: 'PETAR', table: 'petar_records', col: 'id' },
                { mod: 'DETOUR', table: 'desvio_evidence_records', col: 'record_id' },
                { mod: 'DETOUR', table: 'desvio_evidence_records', col: 'id' },
                { mod: 'SIMULACRO', table: 'simulacro_records', col: 'id' },
                { mod: 'BRIGADISTA', table: 'brigadista_records', col: 'id' },
                { mod: 'RISSTMA', table: 'risstma_records', col: 'id' },
                { mod: 'REPORTE_AC', table: 'reporte_ac_records', col: 'id' }
            ];

            for (const item of probeList) {
                try {
                    const found = await db.fetchOne(`SELECT ${item.col} FROM ${item.table} WHERE ${item.col} = ? OR ${item.col} = ? LIMIT 1`, [recordId, String(recordId)]);
                    if (found) {
                        sourceTable = item.table;
                        sourceModule = item.mod;
                        break;
                    }
                } catch {
                    // Ignore table query error and proceed
                }
            }
        }

        if (!sourceTable) {
            return NextResponse.json({ success: false, error: `Invalid source module: ${sourceModule || 'undefined'}` }, { status: 400 });
        }

        const deleteFromSource = async () => {
            try {
                await db.execute(`DELETE FROM ${sourceTable} WHERE id = ? OR id = ? OR record_id = ? OR record_id = ?`, [recordId, String(recordId), recordId, String(recordId)]);
            } catch {
                await db.execute(`DELETE FROM ${sourceTable} WHERE id = ? OR id = ?`, [recordId, String(recordId)]);
            }
        };

        // --- Handle Delete Action ---
        if (action === 'delete') {
            await deleteFromSource();
            return NextResponse.json({ success: true, message: 'Record deleted successfully' });
        }

        // --- 2. DEFINE TARGET MAPPING ---
        const TABLE_MAPPING: Record<string, any> = {
            'Control de ATS': {
                table: 'ats_records',
                columns: ['date', 'responsible', 'location', 'file_url', 'workspace'],
                map: (rec: any) => [
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable || 'Sin responsable', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    rec.evidencePdf || rec.evidence_pdf || rec.fileUrl || rec.file_url || rec.pdfUrl || rec.pdf_url || '',
                    rec.workspace || 'Red Vial 6'
                ]
            },
            'Control de PETAR': {
                table: 'petar_records',
                columns: ['date', 'responsible', 'location', 'type', 'file_url', 'workspace'],
                map: (rec: any) => [
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable || 'Sin responsable', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    targetSubtype || rec.type || 'Caliente', 
                    rec.evidencePdf || rec.evidence_pdf || rec.fileUrl || rec.file_url || rec.pdfUrl || rec.pdf_url || '',
                    rec.workspace || 'Red Vial 6'
                ]
            },
            'Control de HHC': {
                table: 'hhc_records',
                columns: ['date', 'responsable', 'lugar', 'tema', 'tipo', 'evidence_pdf', 'evidence_imgs', 'workspace'],
                map: (rec: any) => {
                    let fullTema = targetTema || targetSubtype || rec.tema || '';
                    if (temaAdicional) {
                        fullTema = fullTema ? `${fullTema} / ${temaAdicional}` : temaAdicional;
                    }
                    return [
                        targetDate || rec.date, 
                        rec.responsible || rec.responsable || 'Sin responsable', 
                        rec.location || rec.zone || rec.zona || rec.lugar || '', 
                        fullTema, 
                        targetSubtype || rec.tipo || 'capacitacion', 
                        rec.evidencePdf || rec.evidence_pdf || rec.fileUrl || rec.file_url || rec.pdfUrl || rec.pdf_url || '', 
                        JSON.stringify(rec.evidenceImgs || rec.evidence_imgs || (rec.images ? rec.images : [])),
                        rec.workspace || 'Red Vial 6'
                    ];
                }
            },
            'Control de Inspecciones': {
                table: 'inspection_records',
                columns: ['id', 'date', 'responsible', 'inspection_type', 'area', 'zone', 'status', 'observations', 'evidence_pdf', 'evidence_imgs', 'workspace'],
                map: (rec: any) => [
                    Date.now(), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable || 'Sin responsable', 
                    targetSubtype || rec.inspection_type || '', 
                    targetArea || rec.area || 'Seguridad', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    'Completado', 
                    rec.observations || rec.description || '', 
                    rec.evidencePdf || rec.evidence_pdf || rec.fileUrl || rec.file_url || rec.pdfUrl || rec.pdf_url || '', 
                    JSON.stringify(rec.evidenceImgs || rec.evidence_imgs || (rec.images ? rec.images : [])),
                    rec.workspace || 'Red Vial 6'
                ]
            },
            'PMA': {
                table: 'pma_evidence_records',
                columns: ['id', 'record_id', 'date', 'responsible', 'category', 'description', 'location', 'images', 'workspace'],
                map: (rec: any) => [
                    Date.now(),
                    String(Date.now()), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable || 'Sin responsable', 
                    targetSubtype || rec.category || '', 
                    rec.observations || rec.description || '', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    JSON.stringify(rec.evidenceImgs || rec.evidence_imgs || (rec.images ? rec.images : [])),
                    rec.workspace || 'Red Vial 6'
                ]
            },
            'Desvíos': {
                table: 'desvio_evidence_records',
                columns: ['id', 'record_id', 'date', 'responsible', 'category', 'description', 'location', 'images', 'workspace'],
                map: (rec: any) => [
                    Date.now(),
                    String(Date.now()), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable || 'Sin responsable', 
                    targetSubtype || rec.category || '', 
                    rec.observations || rec.description || '', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    JSON.stringify(rec.evidenceImgs || rec.evidence_imgs || (rec.images ? rec.images : [])),
                    rec.workspace || 'Red Vial 6'
                ]
            }
        };

        const targetConfig = TABLE_MAPPING[targetCategory];
        if (!targetConfig) {
            return NextResponse.json({ success: false, error: `Invalid target category: ${targetCategory}` }, { status: 400 });
        }

        // --- 3. HELPER FOR IMAGES ---
        const parseImages = (rec: any) => {
            let imgs = rec.evidenceImgs || rec.evidence_imgs || rec.images || [];
            if (typeof imgs === 'string') {
                try {
                    imgs = JSON.parse(imgs);
                } catch (e) {
                    imgs = [imgs];
                }
            }
            return JSON.stringify(Array.isArray(imgs) ? imgs : [imgs]);
        };

        // --- 4. EXECUTE MIGRATION ---
        const placeholders = targetConfig.columns.map(() => '?').join(', ');
        
        // Dynamic map adjustment for images in target
        const mappedValues = targetConfig.map(record);
        // Find if any column is an image column and fix it
        const finalValues = mappedValues.map((val: any, idx: number) => {
            const colName = targetConfig.columns[idx];
            if (colName === 'evidence_imgs' || colName === 'images') {
                return parseImages(record);
            }
            return val;
        });

        // Insert into target
        await db.execute(
            `INSERT INTO ${targetConfig.table} (${targetConfig.columns.join(', ')}) VALUES (${placeholders})`,
            finalValues
        );

        // Delete from source
        await deleteFromSource();

        return NextResponse.json({ 
            success: true, 
            message: `Record migrated from ${sourceModule} to ${targetCategory}`,
            newSubtype: targetSubtype
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
