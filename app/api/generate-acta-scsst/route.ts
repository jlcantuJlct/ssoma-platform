import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { getDashboardActivities } from '@/app/actions';
import fs from 'fs';
import path from 'path';

// Helper to check if a record has evidence
function hasEvidence(rec: any) {
    return !!(
        rec.evidencePdf || rec.evidence_pdf || rec.pdfUrl || rec.evidenceUrl || rec.evidence_url ||
        (rec.fileUrl && String(rec.fileUrl).toLowerCase().includes('.pdf')) ||
        (rec.file_url && String(rec.file_url).toLowerCase().includes('.pdf')) ||
        (rec.evidenceImgs && Array.isArray(rec.evidenceImgs) && rec.evidenceImgs.length > 0) ||
        (rec.images && Array.isArray(rec.images) && rec.images.length > 0) ||
        rec.imageUrl || (rec.files && Array.isArray(rec.files) && rec.files.length > 0) ||
        (rec.fileUrl && !String(rec.fileUrl).toLowerCase().includes('.pdf')) ||
        (rec.file_url && !String(rec.file_url).toLowerCase().includes('.pdf'))
    );
}

// Helper to get month index from date string (0-11)
function getMonthFromStr(dateStr: string) {
    if (!dateStr) return -1;
    const parts = dateStr.split('-');
    if (parts.length >= 2) return parseInt(parts[1], 10) - 1;
    return -1;
}

// Helper to filter by year
function getYearFromStr(dateStr: string) {
    if (!dateStr) return -1;
    const parts = dateStr.split('-');
    if (parts.length >= 1) return parseInt(parts[0], 10);
    return -1;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        let file = formData.get('file') as File | null;
        const actaDataStr = formData.get('actaData') as string;

        let fileBuffer: ArrayBuffer;

        if (file) {
            fileBuffer = await file.arrayBuffer();
        } else {
            const templatePath = path.join(process.cwd(), 'public', 'templates', 'scsst_acta_template.docx');
            if (fs.existsSync(templatePath)) {
                fileBuffer = fs.readFileSync(templatePath);
            } else {
                return NextResponse.json({ success: false, error: 'No se encontró la plantilla en el servidor ni se envió una.' }, { status: 400 });
            }
        }

        if (!actaDataStr) {
            return NextResponse.json({ success: false, error: 'Faltan datos obligatorios.' }, { status: 400 });
        }

        const actaData = JSON.parse(actaDataStr);
        const { year, month, date, startTime, endTime, location, attendees, agenda, agreements } = actaData;
        const targetYear = parseInt(year, 10);
        const targetMonth = parseInt(month, 10); // 0-11

        // 1. Fetch Program Data for P (Programmed)
        const programRecords = await db.fetchAll('SELECT * FROM annual_program');
        let pCapacitaciones = 0;
        let pInspecciones = 0;

        programRecords.forEach((r: any) => {
            const objId = r.objective_id;
            let data = [];
            try { data = JSON.parse(r.data_json || '[]'); } catch(e){}

            if (objId === 'obj2') { // Capacitaciones
                data.forEach((item: any) => {
                    if (item.programmed && item.programmed[targetMonth]) {
                        pCapacitaciones += item.programmed[targetMonth];
                    }
                });
            } else if (['obj6', 'obj7', 'obj8', 'obj9', 'obj10', 'obj11'].includes(objId)) { // Inspecciones
                data.forEach((item: any) => {
                    if (item.programmed && item.programmed[targetMonth]) {
                        pInspecciones += item.programmed[targetMonth];
                    }
                });
            }
        });

        // 2. Fetch Executed Data for E (Executed)
        let eCapacitaciones = 0;
        let eInspecciones = 0;

        try {
            const hhcRecords = await db.fetchAll('SELECT * FROM hhc_records');
            hhcRecords.forEach((rec: any) => {
                if (getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    if (hasEvidence(rec)) eCapacitaciones++;
                }
            });
        } catch(e){}

        try {
            const evRecords = await db.fetchAll('SELECT * FROM evidence_records');
            evRecords.forEach((rec: any) => {
                if (rec.type === 'capacitacion' && getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    if (hasEvidence(rec)) eCapacitaciones++;
                }
                if (rec.type === 'inspeccion' && getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    if (hasEvidence(rec)) eInspecciones++;
                }
            });
        } catch(e){}

        try {
            const inspections = await db.fetchAll('SELECT * FROM inspections');
            inspections.forEach((rec: any) => {
                if (getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    if (hasEvidence(rec)) eInspecciones++;
                }
            });
        } catch(e){}

        try {
            const brigadistas = await db.fetchAll('SELECT * FROM brigadista_records');
            brigadistas.forEach((rec: any) => {
                if (getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    if (hasEvidence(rec)) eInspecciones++;
                }
            });
        } catch(e){}

        // 3. Fetch Accidentes del Mes
        let accidentesDelMes: any[] = [];
        try {
            const accidentes = await db.fetchAll('SELECT * FROM accidentes_records');
            accidentes.forEach((rec: any) => {
                if (getYearFromStr(rec.date) === targetYear && getMonthFromStr(rec.date) === targetMonth) {
                    accidentesDelMes.push({
                        fecha: rec.date,
                        tipo: rec.type || 'N/A',
                        descripcion: rec.description || 'N/A',
                        involucrado: rec.involved_person || 'N/A'
                    });
                }
            });
        } catch(e){}

        // 4. Generate Dashboard Chart using QuickChart (Avance Anual)
        let chartBuffer: Buffer | null = null;
        try {
            const dashData = await getDashboardActivities();
            if (dashData.success && dashData.data) {
                const totalPlan = new Array(12).fill(0);
                const totalExec = new Array(12).fill(0);

                dashData.data.forEach((act: any) => {
                    act.plan.forEach((p: number, i: number) => totalPlan[i] += (p || 0));
                    act.executed.forEach((e: number, i: number) => totalExec[i] += (e || 0));
                });

                const cappedExec = totalExec.map((e, i) => Math.min(e, totalPlan[i]));

                const chartConfig = {
                    type: 'bar',
                    data: {
                        labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
                        datasets: [
                            { label: 'Programado', data: totalPlan, backgroundColor: '#0f172a' },
                            { label: 'Ejecutado', data: cappedExec, backgroundColor: '#10b981' }
                        ]
                    },
                    options: {
                        title: { display: true, text: 'Avance del Programa Anual SCSST' },
                        plugins: { datalabels: { display: true, align: 'end', anchor: 'end' } }
                    }
                };

                const chartUrl = "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig)) + "&w=600&h=300&bkg=white";
                const response = await fetch(chartUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    chartBuffer = Buffer.from(arrayBuffer);
                }
            }
        } catch(e) {
            console.error('Error fetching QuickChart:', e);
        }

                let atsCount = 0; let petarCount = 0; let eppCount = 0; let topCount = 0;
        try { (await db.fetchAll('SELECT date FROM ats_records')).forEach((r:any) => { if(getYearFromStr(r.date) === targetYear && getMonthFromStr(r.date) === targetMonth) atsCount++; }); } catch(e){}
        try { (await db.fetchAll('SELECT date, type FROM evidence_records')).forEach((r:any) => { 
            if(getYearFromStr(r.date) === targetYear && getMonthFromStr(r.date) === targetMonth) {
                if(r.type === 'petar') petarCount++;
                if(r.type === 'top') topCount++;
            }
        }); } catch(e){}
        try { (await db.fetchAll('SELECT date FROM epp_records')).forEach((r:any) => { if(getYearFromStr(r.date) === targetYear && getMonthFromStr(r.date) === targetMonth) eppCount++; }); } catch(e){}

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const targetMonthName = monthNames[targetMonth];

        let monthlyChartBuffer: Buffer | null = null;
        try {
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: ['Capacita.', 'Inspec.', 'ATS', 'PETAR', 'EPP', 'TOP'],
                    datasets: [{
                        label: `Gestión SSOMA - ${targetMonthName} ${targetYear}`,
                        data: [eCapacitaciones, eInspecciones, atsCount, petarCount, eppCount, topCount],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
                    }]
                },
                options: { title: { display: true, text: `Resultados de Gestión SSOMA - ${targetMonthName} ${targetYear}` } }
            };
            const monthlyChartUrl = "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig)) + "&w=600&h=300&bkg=white";
            const response = await fetch(monthlyChartUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                monthlyChartBuffer = Buffer.from(arrayBuffer);
            }
        } catch(e) { console.error('Error fetching monthly QuickChart:', e); }

        const minCapacitaciones = Math.min(pCapacitaciones, eCapacitaciones);
        const minInspecciones = Math.min(pInspecciones, eInspecciones);
        const pctCapacitaciones = pCapacitaciones > 0 ? Math.round((minCapacitaciones / pCapacitaciones) * 100) : (eCapacitaciones > 0 ? 100 : 0);
        const pctInspecciones = pInspecciones > 0 ? Math.round((minInspecciones / pInspecciones) * 100) : (eInspecciones > 0 ? 100 : 0);

        const templateData = {
            fecha: date,
            hora_inicio: startTime,
            hora_fin: endTime,
            lugar: location,
            asistentes: attendees.map((a: any) => ({ nombre: a.nombre, cargo: a.cargo, tipo: a.tipo, firma: a.firma ? "firma_" + a.nombre : null })),
            agenda: agenda.map((a: any, i: number) => ({ numero: i + 1, tema: a })),
            acuerdos: agreements.map((a: any, i: number) => ({ numero: i + 1, acuerdo: a.acuerdo, responsable: a.responsable, fecha_cumplimiento: a.fecha })),
            
            p_inspecciones: pInspecciones,
            e_inspecciones: eInspecciones,
            pct_inspecciones: pctInspecciones + '%',
            
            p_capacitaciones: pCapacitaciones,
            e_capacitaciones: eCapacitaciones,
            pct_capacitaciones: pctCapacitaciones + '%',

            accidentes_mes: accidentesDelMes,
            total_accidentes: accidentesDelMes.length,
            
            chart_image: chartBuffer ? "true" : null, grafico_mensual: monthlyChartBuffer ? "true" : null
        };

        const zip = new PizZip(fileBuffer);
        
        const imageOptions = {
            centered: true,
            getImage: (tagValue: string, tagName: string) => {
                                if (tagName === 'chart_image' && chartBuffer) {
                    return chartBuffer;
                }
                if (tagName === 'grafico_mensual' && monthlyChartBuffer) {
                    return monthlyChartBuffer;
                }
                if (tagName === 'firma' && tagValue && typeof tagValue === 'string') {
                    // tagValue will be "firma_Nombre" but we need the actual base64
                    const attendee = attendees.find((a:any) => a.firma && ("firma_" + a.nombre) === tagValue);
                    if (attendee && attendee.firma) {
                        const base64Data = attendee.firma.replace(/^data:image\/\w+;base64,/, "");
                        return Buffer.from(base64Data, 'base64');
                    }
                }
                return Buffer.from("");
            },
            getSize: (img: any, tagValue: string, tagName: string) => {
                if (tagName === 'firma') return [120, 40];
                return [600, 300];
            }
        };

        const imageModule = new ImageModule(imageOptions);
        const doc = new Docxtemplater(zip, { 
            paragraphLoop: true, 
            linebreaks: true,
            modules: [imageModule]
        });

        doc.render(templateData);

        const buf = doc.getZip().generate({ type: 'nodebuffer' });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename=Acta_SCSST_Generada.docx',
            },
        });

    } catch (error: any) {
        console.error('Error generating acta:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


