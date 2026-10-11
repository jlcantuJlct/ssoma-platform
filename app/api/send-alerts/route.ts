export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { sendAutomatedWhatsApp } from '@/lib/whatsappAutomation';

const DEFAULT_ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280', workspace: 'Red Vial 6' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', email: 'josegamontesinos@gmail.com',        phone: '+51986103867', workspace: 'Red Vial 6' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        email: 'adrian142005@hotmail.com',         phone: '+51943697255', workspace: 'Red Vial 6' },
    { username: 'gladis.aroste',      name: 'Gladis Aroste Huertas',     email: 'gladys.aroste123@gmail.com',        phone: '+51969683799', workspace: 'Red Vial 6' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', email: 'albertscorpio99@gmail.com',        phone: '+51929906173', workspace: 'Red Vial 6' },
];

const DAILY_CC_EMAILS = [
    'jlcantu.jlct@gmail.com'
];

const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', 
    '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29', '2026-08-06', 
    '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25'
];

const DAYS_TO_CHECK = 5;

// ─── LÓGICA DE AUDITORÍA DE CUMPLIMIENTO (MENSUAL) POR PROYECTO ─────────────────
async function getMonthlyCompliance(firstName: string, targetMonthIdx: number, workspace: string): Promise<Record<string, { activity: string, p: number, e: number, month: string }[]>> {
    const monthlyPending: Record<string, { activity: string, p: number, e: number, month: string }[]> = {};
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    try {
        const progRecords = await db.fetchAll(
            'SELECT * FROM annual_program WHERE (workspace = ? OR (workspace IS NULL AND ? = \'Red Vial 6\'))',
            [workspace, workspace]
        ).catch(() => db.fetchAll('SELECT * FROM annual_program'));

        const annualProgram: Record<string, any[]> = {};
        progRecords.forEach((r: any) => { annualProgram[r.objective_id] = JSON.parse(r.data_json); });

        const yearQuery = `2026-`; 
        const inspections = await db.fetchAll(
            'SELECT * FROM inspection_records WHERE date LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = \'Red Vial 6\'))',
            [`%${yearQuery}%`, workspace, workspace]
        ).catch(() => db.fetchAll('SELECT * FROM inspection_records WHERE date LIKE ?', [`%${yearQuery}%`]));

        const hhc = await db.fetchAll(
            'SELECT * FROM hhc_records WHERE date LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = \'Red Vial 6\'))',
            [`%${yearQuery}%`, workspace, workspace]
        ).catch(() => db.fetchAll('SELECT * FROM hhc_records WHERE date LIKE ?', [`%${yearQuery}%`]));

        const evidence = await db.fetchAll(
            'SELECT * FROM evidence_center_records WHERE date LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = \'Red Vial 6\'))',
            [`%${yearQuery}%`, workspace, workspace]
        ).catch(() => db.fetchAll('SELECT * FROM evidence_center_records WHERE date LIKE ?', [`%${yearQuery}%`]));

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
                        e = inspections.filter((i: any) => {
                            const d = new Date(i.date);
                            const iType = normStr(i.inspectionType);
                            return d.getMonth() === m && (iType.includes(desc) || desc.includes(iType));
                        }).length;
                    } else if (objId.includes('obj2') || objId.includes('obj7') || objId.includes('obj9')) {
                        e = hhc.filter((h: any) => {
                            const d = new Date(h.date);
                            const hTema = normStr(h.tema);
                            return d.getMonth() === m && (hTema.includes(desc) || desc.includes(hTema));
                        }).length;
                    } else if (objId.includes('obj4')) {
                        e = evidence.filter((ev: any) => {
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

// ─── LÓGICA DE VERIFICACIÓN DETALLADA POR PROYECTO ─────────────────────────────
async function getPendingForDate(firstName: string, dateStr: string, isToday: boolean, workspace: string): Promise<string[]> {
    const pending: string[] = [];
    const nameLower = firstName.toLowerCase();
    const isGladys = nameLower === 'gladys' || nameLower === 'gladis';

    if (!isGladys) {
        try {
            const row = await db.fetchOne(
                `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
                [`${dateStr}%`, `%${firstName}%`, workspace, workspace]
            ).catch(() => db.fetchOne(`SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`, [`${dateStr}%`, `%${firstName}%`]));
            if (!row) pending.push('Registro Inspecciones');
        } catch {}

        try {
            const row = await db.fetchOne(
                `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
                [`${dateStr}%`, `%${firstName}%`, workspace, workspace]
            ).catch(() => db.fetchOne(`SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${dateStr}%`, `%${firstName}%`]));
            if (!row) pending.push('Registro ATS');
        } catch {}

        try {
            const row = await db.fetchOne(
                `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ? AND (workspace = ? OR (workspace IS NULL AND ? = 'Red Vial 6'))`,
                [`${dateStr}%`, `%${firstName}%`, workspace, workspace]
            ).catch(() => db.fetchOne(`SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${dateStr}%`, `%${firstName}%`]));
            if (!row) pending.push('Control HHC');
        } catch {}
    }

    return pending;
}

interface DayRecord {
    dateStr: string;
    label: string;
    isToday: boolean;
    pending: string[];
}

async function getHistorial(firstName: string, workspace: string): Promise<DayRecord[]> {
    const records: DayRecord[] = [];
    const lima = { timeZone: 'America/Lima' };

    for (let i = 0; i < DAYS_TO_CHECK; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;

        const dateStr = d.toLocaleDateString('en-CA', lima);
        const label = d.toLocaleDateString('es-PE', { ...lima, weekday: 'long', day: 'numeric', month: 'long' });
        const pending = await getPendingForDate(firstName, dateStr, i === 0, workspace);

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

function buildEmailHtml(userName: string, historial: DayRecord[], monthlyPending: Record<string, any[]>, fecha: string, workspace: string): string {
    const hasDaily = historial.length > 0;
    const monthlyMonths = Object.keys(monthlyPending);
    const hasMonthly = monthlyMonths.length > 0;

    const totalDays = historial.length;
    const severidad = getSeveridad(totalDays);
    const config = {
        normal:      { color: '#f97316', bg: '#fff7ed', border: '#f97316', emoji: '⚠️',  titulo: `PENDIENTES DETECTADOS - ${workspace.toUpperCase()}` },
        reincidente: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', emoji: '🔴', titulo: `REINCIDENCIA — ${totalDays} DÍAS SIN REGISTRAR (${workspace})` },
        grave:       { color: '#7f1d1d', bg: '#450a0a', border: '#ef4444', emoji: '⛔', titulo: `INCUMPLIMIENTO GRAVE — ${totalDays} DÍAS ACUMULADOS (${workspace})` },
    }[severidad];

    const seccionesDias = historial.map(dia => `
        <div style="margin-bottom:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 16px;">
            <div style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:6px;">
                ${dia.isToday ? '🔴 HOY — ' : '📅 '}${dia.label}
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${dia.pending.map(p => `
                    <span style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-size:11px; font-weight:700; padding:2px 8px; border-radius:6px; display:inline-block;">
                        ❌ ${p}
                    </span>`).join('')}
            </div>
        </div>`).join('');

    const seccionesMensuales = monthlyMonths.map(mes => {
        const items = monthlyPending[mes];
        return `
            <div style="margin-bottom:16px;">
                <div style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">
                    MES DE ${mes.toUpperCase()}:
                </div>
                <table style="width:100%; border-collapse:collapse; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px;">
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
                <p style="margin:5px 0 0; opacity:0.8; font-size:13px;">Proyecto: ${workspace} — ${fecha}</p>
            </div>
            
            <div style="padding:35px 30px;">
                <p style="font-size:16px; color:#0f172a; margin-top:0;">Hola <strong>${userName}</strong>,</p>
                <p style="font-size:14px; color:#475569; line-height:1.6; margin-bottom:25px;">Se ha actualizado tu estado de cumplimiento en el Sistema de Gestión SSOMA para el proyecto <strong>${workspace}</strong>. Por favor revisa los pendientes acumulados:</p>
                
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

// ─── LÓGICA COMÚN DE ENVÍO DE ALERTAS ──────────────────────────────────────────
async function executeSendAlerts(targetWorkspace: string, customUsers?: any[]) {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const canSendEmail = !!(gmailUser && gmailPass);
    const transporter = canSendEmail 
        ? nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
        : null;

    // Determinar la lista de usuarios para este proyecto (excluyendo desactivados)
    let candidateUsers: any[] = [];
    if (Array.isArray(customUsers) && customUsers.length > 0) {
        candidateUsers = customUsers.filter(u => !u.deactivated);
    } else {
        candidateUsers = DEFAULT_ALERT_USERS.filter(u => 
            !u.deactivated && (u.workspace || 'Red Vial 6') === targetWorkspace
        );
    }

    const results: Array<{
        user: string;
        status: 'ok' | 'sent' | 'error';
        pendingModules?: string[];
        email?: string;
        phone?: string;
        message?: string;
    }> = [];

    for (const u of candidateUsers) {
        const firstName = u.name.split(' ')[0];
        const historial = await getHistorial(firstName, targetWorkspace);
        const userMonthlyPending = await getMonthlyCompliance(firstName, now.getMonth(), targetWorkspace);

        const hasPending = historial.length > 0 || Object.keys(userMonthlyPending).length > 0;
        const allPendingModules = Array.from(new Set(historial.flatMap(h => h.pending)));

        if (!hasPending) {
            results.push({
                user: u.name,
                status: 'ok',
                email: u.email,
                phone: u.phone,
                message: 'Sin actividades pendientes registradas'
            });
            continue;
        }

        try {
            if (transporter && u.email) {
                const html = buildEmailHtml(u.name, historial, userMonthlyPending, todayStr, targetWorkspace);
                await transporter.sendMail({
                    from: `"SSOMA - Alertas" <${gmailUser}>`,
                    to: u.email,
                    cc: DAILY_CC_EMAILS.join(','),
                    subject: `⚠️ ALERTA SSOMA [${targetWorkspace}] - PENDIENTES - ${u.name}`,
                    html: html
                }).catch(e => console.warn('Email warning:', e.message));
            }

            if (u.phone) {
                let waMsg = `🛡️ *ALERTA SSOMA — ${targetWorkspace.toUpperCase()}*\n\nHola *${firstName}*,\n\n`;
                const todayRecord = historial.find(h => h.isToday);
                if (todayRecord && todayRecord.pending.length > 0) {
                    waMsg += `📌 *Pendientes de HOY*:\n${todayRecord.pending.map(p => `❌ ${p}`).join('\n')}\n\n`;
                }
                const monthPendingCount = Object.values(userMonthlyPending).flat().length;
                if (monthPendingCount > 0) {
                    waMsg += `📊 *Programa Anual*: Tienes *${monthPendingCount}* actividades pendientes acumuladas este mes.\n\n`;
                }
                waMsg += `Ingresa a la plataforma SSOMA para regularizar tus registros.`;
                await sendAutomatedWhatsApp(u.phone, waMsg).catch(() => {});
            }

            results.push({
                user: u.name,
                status: 'sent',
                email: u.email,
                phone: u.phone,
                pendingModules: allPendingModules,
                message: `Alertas enviadas (${allPendingModules.length} módulos pendientes)`
            });
        } catch (err: any) {
            results.push({
                user: u.name,
                status: 'error',
                email: u.email,
                phone: u.phone,
                message: err.message
            });
        }
    }

    return results;
}

// ─── POST: INVOCADO DESDE EL PANEL DE ADMINISTRACIÓN (AdminAlertas) ────────────
export async function POST(req: NextRequest) {
    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {}

        const workspace = body.workspace || req.cookies.get('ssoma_workspace')?.value || 'Red Vial 6';
        const users = body.users; // Lista de usuarios activos provista por el frontend si existe

        const results = await executeSendAlerts(workspace, users);
        return NextResponse.json({
            success: true,
            workspace,
            results,
            totalSent: results.filter(r => r.status === 'sent').length
        });
    } catch (err: any) {
        console.error('Error in send-alerts POST:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// ─── GET: INVOCADO POR CRON JOB AUTOMÁTICO ─────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const workspace = searchParams.get('workspace') || 'Red Vial 6';

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const dayOfWeekName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', weekday: 'long' }).format(now);
        if (dayOfWeekName === 'Sunday' || FERIADOS.includes(todayStr)) {
            return NextResponse.json({ success: true, message: "Día no laborable" });
        }

        const results = await executeSendAlerts(workspace);
        return NextResponse.json({
            success: true,
            workspace,
            totalSent: results.filter(r => r.status === 'sent').length,
            recipients: results.map(r => r.user)
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
