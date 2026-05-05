import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzejhIn8c-dF7bgoIEokyCsm1k-U2D_1Q50BCnjZI9OzTiVcGv5LcsgSql6zsoN69ne/exec";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let total = 0;

        // Función auxiliar para enviar al Excel
        const logToSheet = async (data: any) => {
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'log', data }),
                    headers: { 'Content-Type': 'text/plain' }
                });
                total++;
            } catch (e) {
                console.warn("Error enviando a Sheet:", e);
            }
        };

        // 1. SCTR
        const sctr = await db.fetchAll('SELECT * FROM sctr_monthly_records ORDER BY created_at ASC');
        for (const r of sctr) {
            await logToSheet({
                control: "SCTR",
                fecha: `${r.month} ${r.year}`,
                lugar: "GENERAL",
                responsable: "SISTEMA",
                detalle: `Empresa: ${r.company}, Póliza: ${r.policy_number}`,
                link: r.file_url
            });
        }

        // 2. Brigadistas
        const brig = await db.fetchAll('SELECT * FROM brigadista_records ORDER BY created_at ASC');
        for (const r of brig) {
            await logToSheet({
                control: "BRIGADISTAS",
                fecha: r.date,
                lugar: r.location,
                responsable: r.responsible,
                detalle: `Tipo: ${r.brigadista_type}`,
                link: r.file_url
            });
        }

        // 3. Inspecciones
        try {
            const insp = await db.fetchAll('SELECT * FROM inspection_records ORDER BY created_at ASC');
            for (const r of insp) {
                await logToSheet({
                    control: "INSPECCIÓN",
                    fecha: r.date,
                    lugar: r.location,
                    responsable: r.responsible,
                    detalle: `Tipo: ${r.inspection_type}`,
                    link: r.file_url
                });
            }
        } catch (e) {}

        // 4. HHC (Charlas)
        try {
            const hhc = await db.fetchAll('SELECT * FROM hhc_records ORDER BY created_at ASC');
            for (const r of hhc) {
                await logToSheet({
                    control: "HHC / CHARLA",
                    fecha: r.date,
                    lugar: r.location,
                    responsable: r.responsible,
                    detalle: `Tema: ${r.topic}`,
                    link: r.file_url
                });
            }
        } catch (e) {}

        // 5. PMA (Fotos / Ambiental)
        try {
            const pma = await db.fetchAll('SELECT * FROM pma_records ORDER BY created_at ASC');
            for (const r of pma) {
                await logToSheet({
                    control: "PMA / AMBIENTAL",
                    fecha: r.date,
                    lugar: r.location,
                    responsable: r.responsible,
                    detalle: `Categoría: ${r.category}`,
                    link: r.file_url
                });
            }
        } catch (e) {}

        // 6. EPP
        try {
            const epp = await db.fetchAll('SELECT * FROM epp_records ORDER BY created_at ASC');
            for (const r of epp) {
                await logToSheet({
                    control: "EPP / EQUIPOS",
                    fecha: r.date,
                    lugar: r.location,
                    responsable: r.responsible,
                    detalle: `Personal: ${r.worker_name}`,
                    link: r.file_url
                });
            }
        } catch (e) {}

        // 7. Reporte A/C
        try {
            const ac = await db.fetchAll('SELECT * FROM reporte_ac_records ORDER BY created_at ASC');
            for (const r of ac) {
                await logToSheet({
                    control: "REPORTE A/C",
                    fecha: r.date,
                    lugar: r.location,
                    responsable: r.responsible,
                    detalle: `Hallazgo: ${r.finding_type}`,
                    link: r.file_url
                });
            }
        } catch (e) {}

        return NextResponse.json({ 
            success: true, 
            message: `Sincronización Universal completada. Se han enviado ${total} registros de todos los módulos.`,
            count: total 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
