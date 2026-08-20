import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return NextResponse.json({ success: false, error: 'GEMINI_API_KEY no configurada' }, { status: 500 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const targetMonthName = monthNames[targetMonth];

        const prompt = `Eres un Secretario Técnico y Auditor Senior experto en Seguridad y Salud en el Trabajo (SST) de Perú. Tu redacción es impecable, formal, extensa y rigurosamente apegada a la Ley 29783 y al DS 011-2019-TR.
Tu tarea es redactar la Agenda y el Acta de la reunión del Subcomité de SST correspondiente al mes de ${targetMonthName.toUpperCase()} del año ${targetYear}. ¡NUNCA INVENTES OTRO MES, ESTAMOS TRATANDO EXCLUSIVAMENTE ${targetMonthName.toUpperCase()} ${targetYear}!

REQUISITOS DE AGENDA:
Propón una agenda oficial completa (minimo 5 puntos) que incluya: Aprobación del acta anterior, Reporte de accidentes, Análisis del Programa Anual, Estadísticas de Gestión del mes, y Acuerdos.

REQUISITOS DE REDACCIÓN Y ACUERDOS:
Redacta el desarrollo de cada punto de la agenda de forma MUY PROFESIONAL, detallada, fluida y con un lenguaje corporativo avanzado. NO hagas resúmenes cortos; escribe párrafos completos describiendo qué se deliberó, quién tomó la palabra y qué resolvió el comité.

Debes integrar obligatoriamente y analizar a profundidad los siguientes KPI reales del mes de ${targetMonthName} ${targetYear}:
- Avance de Capacitaciones: ${counts.capacitaciones_ejecutadas} ejecutadas de ${counts.capacitaciones_plan} programadas. (Analiza si hay déficit o buen avance).
- Avance de Inspecciones: ${counts.inspecciones_ejecutadas} ejecutadas de ${counts.inspecciones_plan} programadas.
- Documentos de Gestión: Se revisaron y aprobaron ${counts.ats} permisos ATS y ${counts.petar} permisos PETAR.
- Control Operativo: Se registraron ${counts.epp} entregas de EPP.
- Participación Preventiva: Se levantaron ${counts.top} reportes TOP (Tarjetas de Observación Preventiva) y ${counts.osem} observaciones OSEM.
- Otros: Cobertura de ${counts.sctr} trabajadores en SCTR y ejecución de ${counts.simulacros} simulacros.

Devuelve la respuesta ESTRICTAMENTE en formato JSON válido con esta estructura:
{
  "agenda": ["1. Lectura y aprobación del acta anterior", "2. Revisión de estadísticas mensuales...", "..."],
  "acuerdos": [
    {"acuerdo": "El Presidente del Subcomité dio inicio a la sesión agradeciendo la participación de todos los miembros titulares y suplentes. Acto seguido, el Secretario Técnico procedió a dar lectura al acta correspondiente a la sesión del mes anterior. Tras una breve deliberación donde se absolvieron dudas menores, el pleno del Subcomité aprobó el acta por unanimidad, procediendo a su suscripción oficial.", "responsable": "Subcomité", "fecha": "${targetYear}-08-30"},
    {"acuerdo": "En cumplimiento estricto del Programa Anual de SST, se presentó ante el pleno el reporte mensual de indicadores correspondientes al mes de ${targetMonthName}. El Secretario detalló que se han ejecutado ${counts.capacitaciones_ejecutadas} capacitaciones de un total de ${counts.capacitaciones_plan} programadas... (continúa redactando de forma muy rica y profesional)", "responsable": "Secretario Técnico", "fecha": "${targetYear}-08-30"}
  ]
}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const aiData = JSON.parse(text);
        return NextResponse.json({ success: true, data: aiData });

    } catch (error: any) {
        console.error('Error en AI draft:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
