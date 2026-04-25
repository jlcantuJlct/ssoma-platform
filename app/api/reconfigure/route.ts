import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { record, targetCategory, targetSubtype, targetTema, targetArea, targetDate, action } = await req.json();
        
        if (!record || (!targetCategory && action !== 'delete')) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const sourceModule = record._type; // INSPECTION, HHC, EVIDENCE, PMA, ATS, PETAR, DETOUR
        const recordId = record.id;

        // --- 1. DEFINE SOURCE TABLE ---
        let sourceTable = '';
        if (sourceModule === 'INSPECTION') sourceTable = 'inspection_records';
        else if (sourceModule === 'HHC') sourceTable = 'hhc_records';
        else if (sourceModule === 'EVIDENCE') sourceTable = 'evidence_center_records';
        else if (sourceModule === 'PMA') sourceTable = 'pma_evidence_records';
        else if (sourceModule === 'ATS') sourceTable = 'ats_records';
        else if (sourceModule === 'PETAR') sourceTable = 'petar_records';
        else if (sourceModule === 'DETOUR') sourceTable = 'desvio_evidence_records';

        if (!sourceTable) {
            return NextResponse.json({ success: false, error: `Invalid source module: ${sourceModule}` }, { status: 400 });
        }

        // --- Handle Delete Action ---
        if (action === 'delete') {
            await db.execute(`DELETE FROM ${sourceTable} WHERE id = ? OR id = ?`, [recordId, String(recordId)]);
            return NextResponse.json({ success: true, message: 'Record deleted successfully' });
        }

        // --- 2. DEFINE TARGET MAPPING ---
        const TABLE_MAPPING: Record<string, any> = {
            'Control de ATS': {
                table: 'ats_records',
                columns: ['date', 'responsible', 'location', 'file_url'],
                map: (rec: any) => [
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    rec.evidencePdf || rec.fileUrl || rec.file_url || ''
                ]
            },
            'Control de PETAR': {
                table: 'petar_records',
                columns: ['date', 'responsible', 'location', 'type', 'file_url'],
                map: (rec: any) => [
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    targetSubtype || 'Caliente', 
                    rec.evidencePdf || rec.fileUrl || rec.file_url || ''
                ]
            },
            'Control de HHC': {
                table: 'hhc_records',
                // Adding 'area' to columns to support area filtering if table has it?
                // Actually hhc_records only has these columns in standard setup, but let's assume 'tema' and 'tipo' are main ones.
                columns: ['date', 'responsable', 'lugar', 'tema', 'tipo', 'evidence_pdf', 'evidence_imgs'],
                map: (rec: any) => [
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    targetTema || targetSubtype || '', 
                    targetSubtype || 'capacitacion', 
                    rec.evidencePdf || rec.fileUrl || rec.file_url || '', 
                    JSON.stringify(rec.evidenceImgs || (rec.images ? rec.images : []))
                ]
            },
            'Control de Inspecciones': {
                table: 'inspection_records',
                columns: ['id', 'date', 'responsible', 'inspection_type', 'area', 'zone', 'status', 'observations', 'evidence_pdf', 'evidence_imgs'],
                map: (rec: any) => [
                    Date.now(), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    targetSubtype || '', 
                    targetArea || 'Seguridad', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    'Completado', 
                    rec.observations || rec.description || '', 
                    rec.evidencePdf || rec.fileUrl || rec.file_url || '', 
                    JSON.stringify(rec.evidenceImgs || (rec.images ? rec.images : []))
                ]
            },
            'PMA': {
                table: 'pma_evidence_records',
                columns: ['record_id', 'date', 'responsible', 'category', 'description', 'location', 'images'],
                map: (rec: any) => [
                    String(Date.now()), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    targetSubtype || '', 
                    rec.observations || rec.description || '', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    JSON.stringify(rec.evidenceImgs || (rec.images ? rec.images : []))
                ]
            },
            'Desvíos': {
                table: 'desvio_evidence_records',
                columns: ['record_id', 'date', 'responsible', 'category', 'description', 'location', 'images'],
                map: (rec: any) => [
                    String(Date.now()), 
                    targetDate || rec.date, 
                    rec.responsible || rec.responsable, 
                    targetSubtype || '', 
                    rec.observations || rec.description || '', 
                    rec.location || rec.zone || rec.zona || rec.lugar || '', 
                    JSON.stringify(rec.evidenceImgs || (rec.images ? rec.images : []))
                ]
            }
        };

        const targetConfig = TABLE_MAPPING[targetCategory];
        if (!targetConfig) {
            return NextResponse.json({ success: false, error: `Invalid target category: ${targetCategory}` }, { status: 400 });
        }

        // --- 3. HELPER FOR IMAGES ---
        const parseImages = (rec: any) => {
            let imgs = rec.evidenceImgs || rec.images || rec.evidence_imgs || [];
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
        await db.execute(`DELETE FROM ${sourceTable} WHERE id = ? OR id = ?`, [recordId, String(recordId)]);

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
