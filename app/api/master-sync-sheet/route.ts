import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzejhIn8c-dF7bgoIEokyCsm1k-U2D_1Q50BCnjZI9OzTiVcGv5LcsgSql6zsoN69ne/exec";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = 50; // Procesar de 50 en 50 para no morir por timeout

        let allRecords: any[] = [];

        // Recolectar de TODAS las tablas posibles
        // SCTR
        const sctr = await db.fetchAll('SELECT * FROM sctr_monthly_records');
        sctr.forEach(r => allRecords.push({
            control: "SCTR", fecha: `${r.month} ${r.year}`, lugar: "GENERAL", responsable: "SISTEMA",
            detalle: `Empresa: ${r.company}, Póliza: ${r.policy_number}`, link: r.file_url, created: r.created_at
        }));

        // Brigadistas
        const brig = await db.fetchAll('SELECT * FROM brigadista_records');
        brig.forEach(r => allRecords.push({
            control: "BRIGADISTAS", fecha: r.date, lugar: r.location, responsable: r.responsible,
            detalle: `Tipo: ${r.brigadista_type}`, link: r.file_url, created: r.created_at
        }));

        // Inspecciones
        try {
            const insp = await db.fetchAll('SELECT * FROM inspection_records');
            insp.forEach(r => allRecords.push({
                control: "INSPECCIÓN", fecha: r.date, lugar: r.zone || r.area || "GENERAL", responsable: r.responsible,
                detalle: `Tipo: ${r.inspection_type}`, link: r.evidence_pdf || r.file_url, created: r.created_at
            }));
        } catch(e){}

        // HHC
        try {
            const hhc = await db.fetchAll('SELECT * FROM hhc_records');
            hhc.forEach(r => allRecords.push({
                control: "HHC / CHARLA", fecha: r.date, lugar: r.location, responsable: r.responsible,
                detalle: `Tema: ${r.topic}`, link: r.file_url, created: r.created_at
            }));
        } catch(e){}

        // 5. ATS / PETAR
        try {
            const ats = await db.fetchAll('SELECT * FROM ats_records');
            ats.forEach(r => allRecords.push({
                control: "ATS / PERMISO", fecha: r.date, lugar: r.location, responsable: r.responsible,
                detalle: `Registro ATS`, link: r.file_url, created: r.created_at
            }));
        } catch(e){}

        // 6. PMA (Fotos / Ambiental)
        try {
            const pma = await db.fetchAll('SELECT * FROM pma_evidence_records'); 
            pma.forEach(r => {
                let allImgs = "";
                try {
                    const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
                    if (Array.isArray(imgs)) {
                        allImgs = imgs.join(", "); // Poner todos los links separados por coma
                    }
                } catch(e){}
                
                allRecords.push({
                    control: "PMA / AMBIENTAL", 
                    fecha: r.date, 
                    lugar: r.location, 
                    responsable: r.responsible,
                    detalle: `Categoría: ${r.category}${r.description ? ' - ' + r.description : ''}`, 
                    link: allImgs, 
                    created: r.created_at
                });
            });
        } catch(e){}

        // Simulacros
        try {
            const sim = await db.fetchAll('SELECT * FROM simulacro_records');
            sim.forEach(r => allRecords.push({
                control: "SIMULACRO", fecha: r.date, lugar: r.location, responsable: r.responsible,
                detalle: `Tipo: ${r.simulacro_type}`, link: r.file_url, created: r.created_at
            }));
        } catch(e){}

        // RISSTMA
        try {
            const risstma = await db.fetchAll('SELECT * FROM risstma_records');
            risstma.forEach(r => allRecords.push({
                control: "RISSTMA", fecha: r.date, lugar: "GENERAL", responsable: r.responsible,
                detalle: `Documento: ${r.document_type}`, link: r.file_url, created: r.created_at
            }));
        } catch(e){}

        // EPP
        try {
            const epp = await db.fetchAll('SELECT * FROM epp_records');
            epp.forEach(r => allRecords.push({
                control: "EPP / EQUIPOS", fecha: r.date, lugar: r.location, responsable: r.responsible,
                detalle: `Personal: ${r.worker_name}`, link: r.file_url, created: r.created_at
            }));
        } catch(e){}

        // Ordenar por fecha de creación para que el Excel tenga sentido cronológico
        allRecords.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

        // Cortar según el offset para procesar por partes
        const slice = allRecords.slice(offset, offset + limit);
        const remaining = allRecords.length - (offset + slice.length);

        console.log(`Syncing block: ${offset} to ${offset + slice.length}. Remaining: ${remaining}`);

        for (const data of slice) {
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'log', data }),
                    headers: { 'Content-Type': 'text/plain' }
                });
            } catch (e) {}
        }

        return NextResponse.json({ 
            success: true, 
            synced: slice.length,
            nextOffset: offset + slice.length,
            remaining: remaining,
            message: remaining > 0 ? `Quedan ${remaining} registros pendientes. Refresca para continuar.` : "¡Sincronización Total Completada!"
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
