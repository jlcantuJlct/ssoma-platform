import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { year, month } = await req.json();
        const targetYear = parseInt(year, 10);
        const targetMonth = parseInt(month, 10);

        const counts = {
            ats: 0, petar: 0, epp: 0, top: 0, osem: 0, sctr: 0, simulacros: 0,
            capacitaciones_plan: 0, capacitaciones_ejecutadas: 0,
            inspecciones_plan: 0, inspecciones_ejecutadas: 0
        };

        const getMonthFromStr = (d: string) => { const p = (d||'').split('-'); return p.length >= 2 ? parseInt(p[1],10)-1 : -1; };
        const getYearFromStr = (d: string) => { const p = (d||'').split('-'); return p.length >= 1 ? parseInt(p[0],10) : -1; };
        const isMatch = (d: string) => getYearFromStr(d) === targetYear && getMonthFromStr(d) === targetMonth;

        try { (await db.fetchAll('SELECT date FROM ats_records')).forEach((r:any) => { if(isMatch(r.date)) counts.ats++; }); } catch(e){}
        try { (await db.fetchAll('SELECT date, type FROM evidence_records')).forEach((r:any) => { 
            if(isMatch(r.date)) {
                if(r.type === 'petar') counts.petar++;
                if(r.type === 'top') counts.top++;
                if(r.type === 'osem') counts.osem++;
                if(r.type === 'sctr') counts.sctr++;
                if(r.type === 'simulacro') counts.simulacros++;
                if(r.type === 'capacitacion') counts.capacitaciones_ejecutadas++;
                if(r.type === 'inspeccion') counts.inspecciones_ejecutadas++;
            }
        }); } catch(e){}
        try { (await db.fetchAll('SELECT date FROM epp_records')).forEach((r:any) => { if(isMatch(r.date)) counts.epp++; }); } catch(e){}

        try { 
            const prog = await db.fetchAll('SELECT objective_id, data_json FROM annual_program');
            prog.forEach((r: any) => {
                let data = []; try { data = JSON.parse(r.data_json || '[]'); } catch(e){}
                if (r.objective_id === 'obj2') {
                    data.forEach((item: any) => { if (item.programmed && item.programmed[targetMonth]) counts.capacitaciones_plan += item.programmed[targetMonth]; });
                } else if (['obj6', 'obj7', 'obj8', 'obj9', 'obj10', 'obj11'].includes(r.objective_id)) {
                    data.forEach((item: any) => { if (item.programmed && item.programmed[targetMonth]) counts.inspecciones_plan += item.programmed[targetMonth]; });
                }
            });
        } catch(e){}

        return NextResponse.json({ success: true, counts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
