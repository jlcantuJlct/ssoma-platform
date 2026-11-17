export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { smartSplit, extractDni, extractWorkerName } from '@/lib/sctrParser';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const dniParam = url.searchParams.get('dni');
        
        if (!dniParam) {
            return NextResponse.json({ success: false, name: '' });
        }

        let searchDni = dniParam.trim();
        // Si tiene 7 dígitos (ej. le falta el cero inicial del DNI), se normaliza a 8 dígitos respetando el cero
        if (searchDni.length === 7) {
            searchDni = searchDni.padStart(8, '0');
        }

        if (searchDni.length < 8) {
            return NextResponse.json({ success: false, name: '' });
        }

        const records = await db.fetchAll('SELECT personnel_list FROM sctr_monthly_records ORDER BY id DESC LIMIT 5');
        
        for (const r of records) {
            if (!r.personnel_list) continue;
            
            const lines = smartSplit(r.personnel_list);
            
            for (const line of lines) {
                const lineDni = extractDni(line);
                if (lineDni === searchDni) {
                    const name = extractWorkerName(line, lineDni);
                    if (name && name.length > 5) {
                        return NextResponse.json({ success: true, name, dni: lineDni });
                    }
                }
            }
        }

        return NextResponse.json({ success: false, name: '' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
