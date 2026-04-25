import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const cleanupLog: any = {};
        
        // 1. HHC (Capacitaciones)
        const hhcRes = await db.execute(`
            DELETE FROM hhc_records 
            WHERE (evidence_pdf IS NULL OR LENGTH(TRIM(evidence_pdf)) < 10) 
            AND (evidence_imgs IS NULL OR evidence_imgs = '[]' OR evidence_imgs = '' OR LENGTH(TRIM(evidence_imgs)) < 10)
        `);
        cleanupLog.hhc_records = hhcRes.rowCount;

        // 2. Inspecciones
        const inspRes = await db.execute(`
            DELETE FROM inspection_records 
            WHERE (evidence_pdf IS NULL OR LENGTH(TRIM(evidence_pdf)) < 10) 
            AND (evidence_imgs IS NULL OR evidence_imgs = '[]' OR evidence_imgs = '' OR LENGTH(TRIM(evidence_imgs)) < 10)
        `);
        cleanupLog.inspection_records = inspRes.rowCount;

        // 3. Evidence Center (SCSST / EMO)
        const evRes = await db.execute(`
            DELETE FROM evidence_center_records 
            WHERE (file_url IS NULL OR LENGTH(TRIM(file_url)) < 10)
        `);
        cleanupLog.evidence_center_records = evRes.rowCount;

        // 4. PMA (Medio Ambiente)
        const pmaRes = await db.execute(`
            DELETE FROM pma_evidence_records 
            WHERE (images IS NULL OR images = '[]' OR images = '' OR LENGTH(TRIM(images)) < 10)
        `);
        cleanupLog.pma_evidence_records = pmaRes.rowCount;

        // 5. ATS
        const atsRes = await db.execute(`
            DELETE FROM ats_records 
            WHERE (file_url IS NULL OR LENGTH(TRIM(file_url)) < 10)
        `);
        cleanupLog.ats_records = atsRes.rowCount;

        // 6. PETAR
        const petarRes = await db.execute(`
            DELETE FROM petar_records 
            WHERE (file_url IS NULL OR LENGTH(TRIM(file_url)) < 10)
        `);
        cleanupLog.petar_records = petarRes.rowCount;

        // 7. Desvio
        const desvioRes = await db.execute(`
            DELETE FROM desvio_evidence_records 
            WHERE (images IS NULL OR images = '[]' OR images = '' OR LENGTH(TRIM(images)) < 10)
        `);
        cleanupLog.desvio_evidence_records = desvioRes.rowCount;

        // 8. Simulacro
        const simRes = await db.execute(`
            DELETE FROM simulacro_records 
            WHERE (file_url IS NULL OR LENGTH(TRIM(file_url)) < 10)
        `);
        cleanupLog.simulacro_records = simRes.rowCount;

        // 9. Brigadista
        const briRes = await db.execute(`
            DELETE FROM brigadista_records 
            WHERE (file_url IS NULL OR LENGTH(TRIM(file_url)) < 10)
        `);
        cleanupLog.brigadista_records = briRes.rowCount;

        return NextResponse.json({ 
            success: true, 
            message: "Limpieza de registros sin evidencia completada.",
            cleanupLog 
        });
    } catch (error: any) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
