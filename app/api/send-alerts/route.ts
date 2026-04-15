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
];

// Solo jlcantu.jlct recibe CC diario por solicitud propia. Los demás solo semanal.
const DAILY_CC_EMAILS = [
    'jlcantu.jlct@gmail.com'
];

// Recibe copia de todos los WhatsApp enviados (Solicitud de administrador)
const WHATSAPP_CC_PHONE = '+51949260281';

// Lista de feriados nacionales en Perú (YYYY-MM-DD)
const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', 
    '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29', '2026-08-06', 
    '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25'
];

// Cuántos días hacia atrás revisar (hoy + 4 anteriores)
const DAYS_TO_CHECK = 5;

// ─── VERIFICAR MÓDULOS PENDIENTES PARA UNA FECHA ESPECÍFICA ──────────────────
async function getPendingForDate(firstName: string, dateStr: string): Promise<string[]> {
    const pending: string[] = [];
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`,
            [`${dateStr}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('Inspecciones');
    } catch { pending.push('Inspecciones'); }

    if (!isGladys) {
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${dateStr}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('ATS');
        } catch { pending.push('ATS'); }

        try {
            const rows = await db.fetchAll(
                `SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${dateStr}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('PETAR');
        } catch { pending.push('PETAR'); }
    }

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`,
            [`${dateStr}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('HHC');
    } catch { pending.push('HHC'); }

    return pending;
}

// ─── OBTENER HISTORIAL DE LOS ÚLTIMOS N DÍAS ─────────────────────────────────
interface DayRecord {
    dateStr: string;   // YYYY-MM-DD
    label: string;     // "lunes 10 de abril"
    isToday: boolean;
    pending: string[]; // módulos que faltan
}

async function getHistorial(firstName: string): Promise<DayRecord[]> {
    const records: DayRecord[] = [];
    const lima = { timeZone: 'America/Lima' };

    for (let i = 0; i < DAYS_TO_CHECK; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);

        // Saltar fines de semana (0=domingo, 6=sábado)
        const dayOfWeek = new Intl.DateTimeFormat('es-PE', { ...lima, weekday: 'long' }).format(d);
        const dow = d.getDay();
        if (dow === 0 || dow === 6) continue;

        const dateStr = d.toLocaleDateString('en-CA', lima); // YYYY-MM-DD en zona Lima
        const label = d.toLocaleDateString('es-PE', { ...lima, weekday: 'long', day: 'numeric', month: 'long' });

        const pending = await getPendingForDate(firstName, dateStr);

        // Solo incluir días con pendientes
        if (pending.length > 0) {
            records.push({ dateStr, label, isToday: i === 0, pending });
        }
    }

    return records;
}

// ─── DETERMINAR SEVERIDAD ─────────────────────────────────────────────────────
function getSeveridad(diasConPendientes: number): 'normal' | 'reincidente' | 'grave' {
    if (diasConPendientes >= 4) return 'grave';
    if (diasConPendientes >= 2) return 'reincidente';
    return 'normal';
}

// ─── GENERAR HTML DEL EMAIL ───────────────────────────────────────────────────
function buildEmailHtml(userName: string, historial: DayRecord[], fecha: string): string {
    const diasConPendientes = historial.length;
    const severidad = getSeveridad(diasConPendientes);

    // Colores por severidad
    const config = {
        normal:      { color: '#f97316', bg: '#fff7ed', border: '#f97316', emoji: '⚠️',  titulo: 'REGISTROS PENDIENTES DEL DÍA' },
        reincidente: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', emoji: '🔴', titulo: `REINCIDENCIA — ${diasConPendientes} DÍAS SIN REGISTRAR` },
        grave:       { color: '#7f1d1d', bg: '#450a0a', border: '#ef4444', emoji: '⛔', titulo: `INCUMPLIMIENTO GRAVE — ${diasConPendientes} DÍAS ACUMULADOS` },
    }[severidad];

    // Generar secciones por día
    const seccionesDias = historial.map((day, index) => {
        const esHoy = day.isToday;
        const bgHeader = esHoy ? '#064e3b' : (severidad === 'grave' ? '#7f1d1d' : '#1e293b');
        const labelHoy = esHoy ? ' <span style="background:#10b981; color:#fff; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; margin-left:8px;">HOY</span>' : '';
        const labelAnterior = !esHoy && index === 1 ? ' <span style="background:#64748b; color:#fff; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; margin-left:6px;">AYER</span>' : '';

        const moduleRows = day.pending.map(mod => `
            <tr>
                <td style="padding:9px 16px; border-bottom:1px solid #f1f5f9;">
                    <span style="display:inline-block; width:8px; height:8px; background:#ef4444; border-radius:50%; margin-right:10px;"></span>
                    <strong style="color:#1e293b; font-size:13px;">${mod}</strong>
                </td>
                <td style="padding:9px 16px; border-bottom:1px solid #f1f5f9; text-align:right; color:#ef4444; font-weight:700; font-size:12px;">
                    ${esHoy ? '⚠ Pendiente' : '✗ No registró'}
                </td>
            </tr>
        `).join('');

        return `
        <div style="margin-bottom:16px; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
            <div style="background:${bgHeader}; padding:10px 16px; display:flex; align-items:center;">
                <span style="font-size:14px; margin-right:8px;">📅</span>
                <span style="color:#fff; font-weight:700; font-size:13px; text-transform:capitalize;">
                    ${day.label}${labelHoy}${labelAnterior}
                </span>
            </div>
            <table style="width:100%; border-collapse:collapse; background:#fff;">
                <tbody>${moduleRows}</tbody>
            </table>
        </div>`;
    }).join('');

    // Banner de severidad extra para casos graves
    const bannerGrave = severidad === 'grave' ? `
        <div style="background:#450a0a; border:1px solid #ef4444; border-radius:10px; padding:14px 20px; margin-bottom:20px; text-align:center;">
            <p style="margin:0; color:#fca5a5; font-size:13px; font-weight:700;">
                ⛔ Este colaborador lleva <strong style="color:#fff;">${diasConPendientes} días laborables</strong> sin registrar actividades.<br>
                <span style="font-size:12px; color:#f87171; font-weight:400;">Se recomienda tomar acción inmediata.</span>
            </p>
        </div>` : '';

    const bannerReincidente = severidad === 'reincidente' ? `
        <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:12px 20px; margin-bottom:20px; text-align:center;">
            <p style="margin:0; color:#dc2626; font-size:13px; font-weight:700;">
                🔴 Segundo día consecutivo sin registrar. Por favor complete los módulos pendientes.
            </p>
        </div>` : '';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px; margin:30px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <div style="background:linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); padding:28px 40px; text-align:center;">
                <div style="width:60px; height:60px; background:rgba(255,255,255,0.15); border-radius:14px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px;">
                    <span style="font-size:28px;">🛡️</span>
                </div>
                <h1 style="color:#fff; margin:0; font-size:20px; font-weight:800; letter-spacing:-0.5px;">DASHBOARD SSOMA</h1>
                <p style="color:#a7f3d0; margin:6px 0 0; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Sistema de Gestión Integral · Alerta Diaria</p>
            </div>

            <!-- BANNER SEVERIDAD -->
            <div style="background:${config.bg}; border-left:4px solid ${config.border}; padding:14px 40px;">
                <span style="font-size:18px; margin-right:10px;">${config.emoji}</span>
                <div style="display:inline-block; vertical-align:middle;">
                    <p style="margin:0; color:${config.color}; font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">${config.titulo}</p>
                    <p style="margin:3px 0 0; color:${config.color}; font-size:12px; opacity:0.8;">${fecha}</p>
                </div>
            </div>

            <!-- CONTENIDO -->
            <div style="padding:28px 32px;">
                <p style="color:#334155; font-size:14px; margin:0 0 6px;">
                    Estimado(a) <strong>${userName}</strong>,
                </p>
                <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0 0 20px;">
                    ${diasConPendientes === 1
                        ? 'Aún <strong style="color:#ef4444;">no has registrado información</strong> en los siguientes módulos del día de hoy. Completa los registros antes de finalizar tu jornada.'
                        : `Se detectaron <strong style="color:#ef4444;">${diasConPendientes} días</strong> con registros incompletos en la plataforma SSOMA. A continuación el detalle:`
                    }
                </p>

                ${bannerGrave}
                ${bannerReincidente}

                <!-- SECCIONES POR DÍA -->
                ${seccionesDias}

                <!-- CTA -->
                <div style="text-align:center; margin:24px 0 8px;">
                    <a href="https://ssoma-platform.vercel.app"
                       style="display:inline-block; background:linear-gradient(135deg, #059669, #047857); color:#fff; text-decoration:none; padding:13px 36px; border-radius:10px; font-weight:700; font-size:14px;">
                        Ingresar a la Plataforma →
                    </a>
                </div>

                <p style="color:#94a3b8; font-size:11px; text-align:center; margin:12px 0 0;">
                    Recordatorio automático enviado a las 5:00 PM · Solo aparece si hay registros pendientes
                </p>
            </div>

            <!-- FOOTER -->
            <div style="background:#f1f5f9; padding:16px 40px; border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8; font-size:11px; margin:0; text-align:center;">
                    SSOMA Platform · Casa Contratistas SAC<br>
                    <span style="color:#cbd5e1;">No responder a este correo automático</span>
                </p>
            </div>
        </div>
    </body>
    </html>`;
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── VERIFICACIÓN DE DOMINGOS Y FERIADOS ───
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD
    const dayOfWeekName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', weekday: 'long' }).format(now);

    const esDomingo = dayOfWeekName === 'Sunday';
    const esFeriado = FERIADOS.includes(todayStr);

    if (esDomingo || esFeriado) {
        return NextResponse.json({ 
            success: true, 
            message: `Hoy (${todayStr}) es ${esDomingo ? 'Domingo' : 'Feriado'}. No se envían alertas.` 
        });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const fromName  = process.env.ALERT_FROM_NAME || 'SSOMA - Sistema de Alertas';

    if (!gmailUser || !gmailPass || gmailPass === 'xxxx xxxx xxxx xxxx') {
        return NextResponse.json({ error: 'Gmail no configurado' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
    });

    const fecha = new Date().toLocaleDateString('es-PE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'America/Lima'
    });

    const results: any[] = [];

    for (const user of ALERT_USERS) {
        try {
            const firstName = user.name.split(' ')[0];
            const historial  = await getHistorial(firstName);

            // Si no tiene ningún día pendiente, no se envía correo
            if (historial.length === 0) {
                results.push({ user: user.name, status: 'ok', message: 'Sin pendientes' });
                continue;
            }

            // Si HOY no tiene pendientes (solo días anteriores), no enviar
            const tieneHoyPendiente = historial.some(h => h.isToday);
            if (!tieneHoyPendiente) {
                results.push({ user: user.name, status: 'ok', message: 'Hoy completo (días anteriores ya pasaron)' });
                continue;
            }

            const diasConPendientes = historial.length;
            const severidad = getSeveridad(diasConPendientes);

            const subjectPrefix = severidad === 'grave'
                ? `⛔ [SSOMA] INCUMPLIMIENTO GRAVE (${diasConPendientes} días)`
                : severidad === 'reincidente'
                ? `🔴 [SSOMA] Reincidencia — ${diasConPendientes} días sin registrar`
                : `⚠️ [SSOMA] Registros pendientes`;

            await transporter.sendMail({
                from: `"${fromName}" <${gmailUser}>`,
                to: user.email,
                cc: DAILY_CC_EMAILS.join(', '),
                subject: `${subjectPrefix} — ${user.name.split(' ')[0]} · ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`,
                html: buildEmailHtml(user.name, historial, fecha),
            });

            // ─── ENVÍO DE WHATSAPP (AUTOMÁTICO) ───
            if (user.phone) {
                const hoyPendientes = historial.find(h => h.isToday)?.pending || [];
                if (hoyPendientes.length > 0) {
                    const waMessage = `🛡️ *DASHBOARD SSOMA - Recordatorio*\n\nHola *${user.name.split(' ')[0]}*,\n\nAún tienes registros pendientes para el día de hoy en los siguientes módulos:\n\n${hoyPendientes.map(p => `❌ ${p}`).join('\n')}\n\nPor favor, completa tus registros a la brevedad aquí:\nhttps://ssoma-platform.vercel.app\n\n_Este es un recordatorio automático del Sistema de Gestión SSOMA._`;
                    
                    await sendAutomatedWhatsApp(user.phone, waMessage);

                    // Enviar copia CC al administrador
                    const ccMessage = `[COPIA CC] Para *${user.name}*:\n\n${waMessage}`;
                    await sendAutomatedWhatsApp(WHATSAPP_CC_PHONE, ccMessage);
                }
            }

            results.push({
                user: user.name,
                email: user.email,
                status: 'sent',
                severidad,
                diasConPendientes,
                historial: historial.map(h => ({ fecha: h.dateStr, pendientes: h.pending })),
            });

        } catch (err: any) {
            console.error(`Error enviando alerta a ${user.name}:`, err);
            results.push({ user: user.name, status: 'error', error: err.message });
        }
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
}

export async function POST(req: NextRequest) {
    return GET(req);
}
