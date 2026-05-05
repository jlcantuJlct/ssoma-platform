import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzejhIn8c-dF7bgoIEokyCsm1k-U2D_1Q50BCnjZI9OzTiVcGv5LcsgSql6zsoN69ne/exec";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let total = 0;

        // 1. Sincronizar SCTR
        const sctrRecords = await db.fetchAll('SELECT * FROM sctr_monthly_records ORDER BY created_at ASC');
        for (const r of sctrRecords) {
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'log',
                        data: {
                            control: "SCTR",
                            periodo: `${r.month} ${r.year}`,
                            empresa: r.company,
                            detalle: `Póliza: ${r.policy_number}, Vencimiento: ${r.expiration_date}`,
                            link: r.file_url
                        }
                    }),
                    headers: { 'Content-Type': 'text/plain' }
                });
                total++;
            } catch (e) {
                console.warn("Error sincronizando record SCTR:", e);
            }
        }

        // 2. Sincronizar Brigadistas
        const brigRecords = await db.fetchAll('SELECT * FROM brigadista_records ORDER BY created_at ASC');
        for (const r of brigRecords) {
            try {
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'log',
                        data: {
                            control: "BRIGADISTAS",
                            periodo: r.date,
                            empresa: r.responsible,
                            detalle: `Tipo: ${r.brigadista_type}, Sede: ${r.location}`,
                            link: r.file_url
                        }
                    }),
                    headers: { 'Content-Type': 'text/plain' }
                });
                total++;
            } catch (e) {
                console.warn("Error sincronizando record Brigadista:", e);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sincronización completada. Se han enviado ${total} registros al Excel.`,
            count: total 
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
