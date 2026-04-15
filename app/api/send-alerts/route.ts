import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { sendAutomatedWhatsApp } from '@/lib/whatsappAutomation';

// ─── CONFIGURACIÓN DE USUARIOS ────────────────────────────────────────────────
const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', email: 'josegamontesinos@gmail.com',        phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        email: 'adrian142005@hotmail.com',         phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladys Aroste Huertas',     email: 'gladys.aroste123@gmail.com',        phone: '+51969683799' },
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

// ─── LÓGICA DE VERIFICACIÓN DETALLADA ─────────────────────────────────────────
async function getPendingForDate(firstName: string, dateStr: string, isToday: boolean): Promise<string[]> {
    const pending: string[] = [];
    const nameLower = firstName.toLowerCase();
    const isGladys = nameLower === 'gladys' || nameLower === 'gladis';
    const isBrayan = nameLower === 'brayan';

    // 1. Tareas de Brayan (SOLO Fotos PMA y Control Desvio)
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

    // 2. Tareas Diarias (Solo para No-Gladys ni Brayan)
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

    // 2. Tareas del PMA (Solo se revisan detalladamente para HOY)
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
                    if (task.category === 'Salud Ocupacional') {
                        pending.push(`Salud: ${task.topic}`);
                    }
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

function buildEmailHtml(userName: string, historial: DayRecord[], fecha: string): string {
    const diasConPendientes = historial.length;
    const severidad = getSeveridad(diasConPendientes);
    const config = {
        normal:      { color: '#f97316', bg: '#fff7ed', border: '#f97316', emoji: '⚠️',  titulo: 'REGISTROS PENDIENTES DEL DÍA' },
        reincidente: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', emoji: '🔴', titulo: `REINCIDENCIA — ${diasConPendientes} DÍAS SIN REGISTRAR` },
        grave:       { color: '#7f1d1d', bg: '#450a0a', border: '#ef4444', emoji: '⛔', titulo: `INCUMPLIMIENTO GRAVE — ${diasConPendientes} DÍAS ACUMULADOS` },
    }[severidad];

    const seccionesDias = historial.map((day, index) => {
        const esHoy = day.isToday;
        const bgHeader = esHoy ? '#064e3b' : (severidad === 'grave' ? '#7f1d1d' : '#1e293b');
        return `
            <div style="margin-bottom:20px; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; background:#fff;">
                <div style="background:${bgHeader}; color:#fff; padding:12px 16px; font-weight:700; font-size:14px;">
                    📅 ${day.label.toUpperCase()} ${esHoy ? '[HOY]' : ''}
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    ${day.pending.map(mod => `
                        <tr>
                            <td style="padding:10px 16px; border-bottom:1px solid #f1f5f9; font-size:14px; color:#334155;">
                                <span style="color:#ef4444;">❌</span> <strong>${mod}</strong>
                            </td>
                        </tr>`).join('')}
                </table>
            </div>`;
    }).join('');

    return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f8fafc; padding:30px 10px;">
        <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
            <div style="background-color:${config.color}; padding:25px; text-align:center; color:#ffffff;">
                <div style="font-size:40px; margin-bottom:10px;">${config.emoji}</div>
                <h1 style="margin:0; font-size:18px; letter-spacing:1px; font-weight:800;">${config.titulo}</h1>
                <p style="margin:5px 0 0; opacity:0.9; font-size:14px;">${fecha}</p>
            </div>
            <div style="padding:30px 25px;">
                <p style="font-size:16px; color:#1e293b; margin-top:0;">Hola <strong>${userName}</strong>,</p>
                <p style="font-size:14px; color:#475569; line-height:1.6;">Se han detectado los siguientes requerimientos pendientes en el Sistema de Gestión SSOMA:</p>
                ${seccionesDias}
                <div style="text-align:center; margin-top:30px;">
                    <a href="https://ssoma-platform.vercel.app" style="background-color:${config.color}; color:#ffffff; padding:16px 32px; text-decoration:none; border-radius:12px; font-weight:bold; display:inline-block; box-shadow:0 4px 6px rgba(0,0,0,0.1);">IR AL DASHBOARD SSOMA</a>
                </div>
            </div>
            <div style="background-color:#f1f5f9; padding:20px; text-align:center; color:#64748b; font-size:12px;">
                <p style="margin:0;">Este es un mensaje automático generado por el Sistema de Seguridad y Salud en el Trabajo.</p>
                <p style="margin:5px 0 0;">Por favor no responder a este correo.</p>
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
            const historial = await getHistorial(user.name.split(' ')[0]);
            if (historial.length > 0) {
                const html = buildEmailHtml(user.name, historial, todayStr);
                await transporter.sendMail({
                    from: `"SSOMA - Alertas" <${gmailUser}>`,
                    to: user.email,
                    cc: DAILY_CC_EMAILS.join(','),
                    subject: `⚠️ PENDIENTES SSOMA - ${user.name}`,
                    html: html
                });

                // Enviar WhatsApp si es Hoy
                const todayRecord = historial.find(h => h.isToday);
                if (todayRecord) {
                    const waMsg = `🛡️ *DASHBOARD SSOMA*\n\nHola *${user.name.split(' ')[0]}*,\n\nTienes pendientes hoy:\n${todayRecord.pending.map(p => `❌ ${p}`).join('\n')}\n\nIngresa aquí: https://ssoma-platform.vercel.app`;
                    await sendAutomatedWhatsApp(user.phone, waMsg);
                    await sendAutomatedWhatsApp(WHATSAPP_CC_PHONE, `🤖 CC Admin: Alerta enviada a ${user.name}\n\n${waMsg}`);
                }
                summary.push(user.name);
            }
        }
        return NextResponse.json({ success: true, totalSent: summary.length, recipients: summary });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
