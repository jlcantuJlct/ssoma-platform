export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { sendAutomatedWhatsApp } from '@/lib/whatsappAutomation';

// ─── CONFIGURACIÓN DE USUARIOS ────────────────────────────────────────────────
const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', email: 'josegamontesinos@gmail.com',        phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        email: 'adrian142005@hotmail.com',         phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladis Aroste Huertas',     email: 'gladys.aroste123@gmail.com',        phone: '+51969683799' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', email: 'albertscorpio99@gmail.com',        phone: '+51929906173' },
    { username: 'brayan.pena',         name: 'Brayan Jeanpool Peña Villafuerte', email: '20173143@unica.edu.pe',       phone: '+51971087023' },
];

const DAILY_CC_EMAILS = [
    'jlcantu.jlct@gmail.com'
];

const WHATSAPP_CC_PHONE = '+51949260281';

const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', 
    '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29', '2026-08-06', 
    '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25'
];

const DAYS_TO_CHECK = 5;

// ─── LÓGICA DE AUDITORÍA DE CUMPLIMIENTO (MENSUAL) ────────────────────────────
async function getMonthlyCompliance(firstName: string, targetMonthIdx: number): Promise<Record<string, { activity: string, p: number, e: number, month: string }[]>> {
    const monthlyPending: Record<string, { activity: string, p: number, e: number, month: string }[]> = {};
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    try {
        const progRecords = await db.fetchAll('SELECT * FROM annual_program');
        const annualProgram: Record<string, any[]> = {};
        progRecords.forEach((r: any) => { annualProgram[r.objective_id] = JSON.parse(r.data_json); });

        const yearQuery = `2026-`; 
        const inspections = await db.fetchAll('SELECT * FROM inspection_records WHERE date LIKE ?', [`%${yearQuery}%`]);
        const hhc = await db.fetchAll('SELECT * FROM hhc_records WHERE date LIKE ?', [`%${yearQuery}%`]);
        const evidence = await db.fetchAll('SELECT * FROM evidence_center_records WHERE date LIKE ?', [`%${yearQuery}%`]);

        const normStr = (s: string) => (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        for (let m = 0; m <= targetMonthIdx; m++) {
            const mName = months[m];

            for (const [objId, activities] of Object.entries(annualProgram)) {
                activities.forEach((act: any) => {
                    const p = act.programmed?.[m] || 0;
                    if (p === 0) return;

                    const desc = normStr(act.description);
                    const resp = (act.responsible || act.responsable || '').toLowerCase();
                    const fName = firstName.toLowerCase();
                    
                    if (!resp.includes(fName) && !fName.includes(resp)) return;

                    let e = 0;
                    if (objId.includes('obj3') || objId.includes('obj6') || objId.includes('obj8')) {
                        e = inspections.filter(i => {
                            const d = new Date(i.date);
                            const iType = normStr(i.inspectionType);
                            return d.getMonth() === m && (iType.includes(desc) || desc.includes(iType));
                        }).length;
                    } else if (objId.includes('obj2') || objId.includes('obj7') || objId.includes('obj9')) {
                        e = hhc.filter(h => {
                            const d = new Date(h.date);
                            const hTema = normStr(h.tema);
                            return d.getMonth() === m && (hTema.includes(desc) || desc.includes(hTema));
                        }).length;
                    } else if (objId.includes('obj4')) {
                        e = evidence.filter(ev => {
                            const d = new Date(ev.date);
                            const evDesc = normStr(ev.description || ev.activity);
                            return d.getMonth() === m && (evDesc.includes(desc) || desc.includes(evDesc));
                        }).length;
                    }

                    if (e < p) {
                        if (!monthlyPending[mName]) monthlyPending[mName] = [];
                        monthlyPending[mName].push({ activity: act.description, p, e, month: mName });
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error calculating monthly compliance:', err);
    }

    return monthlyPending;
}

// ─── LÓGICA DE VERIFICACIÓN DETALLADA ─────────────────────────────────────────
async function getPendingForDate(firstName: string, dateStr: string, isToday: boolean): Promise<string[]> {
    const pending: string[] = [];
    const nameLower = firstName.toLowerCase();
    const isGladys = nameLower === 'gladys' || nameLower === 'gladis';
    const isBrayan = nameLower === 'brayan';

    if (isBrayan) {
        try {
            const row = await db.fetchOne(
                `SELECT e.id FROM evidence e 
                 JOIN activities a ON e.activity_id = a.id 
                 WHERE e.created_at LIKE ? AND a.responsible LIKE ?`,
                [`${dateStr}%`, `%${firstName}%`]
            );
            if (!row) pending.push('Fotos PMA');
        } catch {}

        try {
            const row = await db.fetchOne(`SELECT id FROM desvio_evidence_records WHERE date = ? AND responsible LIKE ?`, [dateStr, `%${firstName}%`]);
            if (!row) pending.push('Control de Desvíos');
        } catch {}

        return pending;
    }

    if (!isGladys) {
        try {
            const row = await db.fetchOne(`SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`, [`${dateStr}%`, `%${firstName}%`]);
            if (!row) pending.push('Registro Inspecciones');
        } catch {}

        try {
            const row = await db.fetchOne(`SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${dateStr}%`, `%${firstName}%`]);
            if (!row) pending.push('Registro ATS');
        } catch {}

        try {
            const row = await db.fetchOne(`SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${dateStr}%`, `%${firstName}%`]);
            if (!row) pending.push('Control HHC');
        } catch {}
    }

    if (isToday) {
        try {
            const now = new Date();
            const monthName = now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' });
            const pmaMonthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            const pmaTasks = await db.fetchAll(
                `SELECT category, topic FROM pma_records 
                 WHERE month = ? AND responsible LIKE ? AND (status IS NULL OR status != 'Completado')`,
                [pmaMonthFormatted, `%${firstName}%`]
            );

            for (const task of pmaTasks) {
                if (isGladys) {
                    if (task.category === 'Salud Ocupacional') pending.push(`Salud: ${task.topic}`);
                } else {
                    if (task.category === 'Formación') pending.push(`Formación: ${task.topic}`);
                    else if (task.category === 'Gestión de riesgos') pending.push(`Inspección: ${task.topic}`);
                    else if (task.category === 'Salud Ocupacional') pending.push(`Salud: ${task.topic}`);
                }
            }
        } catch {}
    }

    return pending;
}

// ─── OBTENER HISTORIAL ────────────────────────────────────────────────────────
interface DayRecord {
    dateStr: string;
    label: string;
    isToday: boolean;
    pending: string[];
}

async function getHistorial(firstName: string): Promise<DayRecord[]> {
    const records: DayRecord[] = [];
    const lima = { timeZone: 'America/Lima' };

    for (let i = 0; i < DAYS_TO_CHECK; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;

        const dateStr = d.toLocaleDateString('en-CA', lima);
        const label = d.toLocaleDateString('es-PE', { ...lima, weekday: 'long', day: 'numeric', month: 'long' });
        const pending = await getPendingForDate(firstName, dateStr, i === 0);

        if (pending.length > 0) {
            records.push({ dateStr, label, isToday: i === 0, pending });
        }
    }
    return records;
}

function getSeveridad(diasConPendientes: number): 'normal' | 'reincidente' | 'grave' {
    if (diasConPendientes >= 4) return 'grave';
    if (diasConPendientes >= 2) return 'reincidente';
    return 'normal';
}

function buildEmailHtml(userName: string, historial: DayRecord[], monthlyPending: Record<string, any[]>, fecha: string): string {
    const hasDaily = historial.length > 0;
    const monthlyMonths = Object.keys(monthlyPending);
    const hasMonthly = monthlyMonths.length > 0;

    const totalDays = historial.length;
    const severidad = getSeveridad(totalDays);
    const config = {
        normal:      { color: '#f97316', bg: '#fff7ed', border: '#f97316', emoji: '⚠️',  titulo: 'PENDIENTES DETECTADOS' },
        reincidente: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', emoji: '🔴', titulo: `REINCIDENCIA — ${totalDays} DÍAS SIN REGISTRAR` },
        grave:       { color: '#7f1d1d', bg: '#450a0a', border: '#ef4444', emoji: '⛔', titulo: `INCUMPLIMIENTO GRAVE — ${totalDays} DÍAS ACUMULADOS` },
    }[severidad];

    const seccionesDias = historial.map((day) => {
        const esHoy = day.isToday;
        const bgHeader = esHoy ? '#064e3b' : (severidad === 'grave' ? '#7f1d1d' : '#1e293b');
        return `
            <div style="margin-bottom:15px; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; background:#fff;">
                <div style="background:${bgHeader}; color:#fff; padding:10px 16px; font-weight:700; font-size:13px;">
                    📅 ${day.label.toUpperCase()} ${esHoy ? '[HOY]' : ''}
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${day.pending.map(mod => `
                        <tr>
                            <td style="padding:10px 16px; border-bottom:1px solid #f1f5f9; font-size:14px; color:#334155;">
                                <span style="color:#ef4444; margin-right:8px;">❌</span> <strong>${mod}</strong>
                            </td>
                        </tr>`).join('')}
                </table>
            </div>`;
    }).join('');

    const seccionesMensuales = monthlyMonths.map(month => {
        const items = monthlyPending[month];
        return `
            <div style="margin-bottom:15px; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; background:#fff;">
                <div style="background:#4338ca; color:#fff; padding:10px 16px; font-weight:700; font-size:13px;">
                    📊 PENDIENTES DEL MES: ${month.toUpperCase()}
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${items.map(it => `
                        <tr>
                            <td style="padding:12px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#1e293b;">
                                <div style="font-weight:700; color:#4338ca; margin-bottom:4px;">${it.activity}</div>
                                <div style="font-size:11px; color:#64748b;">Progreso: <span style="color:#dc2626;">${it.e} de ${it.p}</span> realizados</div>
                            </td>
                        </tr>`).join('')}
                </table>
            </div>`;
    }).join('');

    return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f1f5f9; padding:30px 10px;">
        <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
            <div style="background-color:${config.color}; padding:30px 25px; text-align:center; color:#ffffff;">
                <div style="font-size:45px; margin-bottom:15px;">${config.emoji}</div>
                <h1 style="margin:0; font-size:20px; letter-spacing:1px; font-weight:900; text-transform:uppercase;">${config.titulo}</h1>
                <p style="margin:5px 0 0; opacity:0.8; font-size:13px;">${fecha}</p>
            </div>
            
            <div style="padding:35px 30px;">
                <p style="font-size:16px; color:#0f172a; margin-top:0;">Hola <strong>${userName}</strong>,</p>
                <p style="font-size:14px; color:#475569; line-height:1.6; margin-bottom:25px;">Se ha actualizado tu estado de cumplimiento en el Sistema de Gestión SSOMA. Por favor revisa los pendientes acumulados:</p>
                
                ${hasDaily ? `
                    <div style="margin-bottom:30px;">
                        <h2 style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; font-weight:800;">🔔 REGISTROS DIARIOS</h2>
                        ${seccionesDias}
                    </div>` : ''}

                ${hasMonthly ? `
                    <div style="margin-bottom:30px;">
                        <h2 style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px; font-weight:800;">📅 PROGRAMA ANUAL</h2>
                        ${seccionesMensuales}
                    </div>` : ''}

                <div style="text-align:center; margin-top:40px; background:#f8fafc; padding:30px; border-radius:16px; border:1px dashed #cbd5e1;">
                    <p style="font-size:13px; color:#64748b; margin-bottom:20px;">Recuerda que la regularización de estos registros es obligatoria para el cierre de mes.</p>
                    <a href="https://ssoma-platform.vercel.app" style="background-color:${config.color}; color:#ffffff; padding:18px 40px; text-decoration:none; border-radius:14px; font-weight:900; font-size:14px; display:inline-block; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">IR AL DASHBOARD SSOMA</a>
                </div>
            </div>

            <div style="background-color:#0f172a; padding:25px; text-align:center; color:#94a3b8; font-size:11px;">
                <p style="margin:0;">Sistema de Gestión de Seguridad y Salud en el Trabajo - SSOMA 2026</p>
                <p style="margin:8px 0 0; opacity:0.6;">Esta es una notificación automática. Por favor no responder.</p>
            </div>
        </div>
    </div>`;
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';
        if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const dayOfWeekName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', weekday: 'long' }).format(now);
        if (dayOfWeekName === 'Sunday' || FERIADOS.includes(todayStr)) {
            return NextResponse.json({ success: true, message: "Día no laborable" });
        }

        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } });

        const summary = [];

        for (const user of ALERT_USERS) {
            const firstName = user.name.split(' ')[0];
            const historial = await getHistorial(firstName);
            const userMonthlyPending = await getMonthlyCompliance(firstName, now.getMonth());

            if (historial.length > 0 || Object.keys(userMonthlyPending).length > 0) {
                const html = buildEmailHtml(user.name, historial, userMonthlyPending, todayStr);
                await transporter.sendMail({
                    from: `"SSOMA - Alertas" <${gmailUser}>`,
                    to: user.email,
                    cc: DAILY_CC_EMAILS.join(','),
                    subject: `⚠️ ALERTA SSOMA - PENDIENTES - ${user.name}`,
                    html: html
                });

                let waMsg = `🛡️ *ALERTA SSOMA*\n\nHola *${firstName}*,\n\n`;
                const todayRecord = historial.find(h => h.isToday);
                if (todayRecord) {
                    waMsg += `📌 *Pendientes de HOY*:\n${todayRecord.pending.map(p => `❌ ${p}`).join('\n')}\n\n`;
                }
                
                const monthPendingCount = Object.values(userMonthlyPending).flat().length;
                if (monthPendingCount > 0) {
                    waMsg += `📊 *Programa Anual*: Tienes *${monthPendingCount}* actividades pendientes acumuladas este mes.\n\n`;
                }
                
                waMsg += `Ingresa aquí: https://ssoma-platform.vercel.app`;
                await sendAutomatedWhatsApp(user.phone, waMsg);
                summary.push(user.name);
            }
        }

        return NextResponse.json({ success: true, totalSent: summary.length, recipients: summary });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
