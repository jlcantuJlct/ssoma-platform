export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { smartSplit, extractDni, extractWorkerName } from '@/lib/sctrParser';

export async function GET() {
    try {
        // Obtenemos los últimos 5 registros de SCTR para cubrir diferentes empresas/contratistas
        const records = await db.fetchAll('SELECT personnel_list FROM sctr_monthly_records ORDER BY id DESC LIMIT 5');
        
        const allNames = new Set<string>();

        records.forEach((r: any) => {
            if (!r.personnel_list) return;
            const lines = smartSplit(r.personnel_list);
            lines.forEach((line: string) => {
                const dni = extractDni(line);
                if (dni) {
                    const name = extractWorkerName(line, dni);
                    if (name && name.length > 5 && name.includes(' ')) {
                        allNames.add(name);
                    }
                }
            });
        });

        const namesArray = Array.from(allNames).sort();
        return NextResponse.json({ success: true, names: namesArray });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
