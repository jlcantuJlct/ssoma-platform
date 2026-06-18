export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { fullName } = await req.json();
        
        if (!fullName) {
            return NextResponse.json({ success: false, error: 'Debe ingresar su nombre' }, { status: 400 });
        }

        const inputName = fullName.toUpperCase().trim();

        // Extraer todos los nombres válidos del SCTR
        const records = await db.fetchAll('SELECT personnel_list FROM sctr_monthly_records ORDER BY id DESC LIMIT 5');
        
        let found = false;

        for (const r of records) {
            if (!r.personnel_list) continue;
            const text = r.personnel_list.toUpperCase();
            
            if (text.includes(inputName)) {
                found = true;
                break;
            }
        }

        if (found) {
            return NextResponse.json({ success: true, valid: true });
        } else {
            return NextResponse.json({ 
                success: true, 
                valid: false, 
                error: 'No se encontró el nombre en la relación activa del SCTR. Verifique que lo haya escrito correctamente.' 
            });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
