export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
        return NextResponse.json({ error: 'Gmail no configurado' }, { status: 500 });
    }

    // Parámetro: ?dias=1|2|4  (default=1)
    const { searchParams } = new URL(req.url);
    const diasParam = parseInt(searchParams.get('dias') || '1');
    const diasSimulados = Math.min(Math.max(diasParam, 1), 5);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
    });

    const lima = { timeZone: 'America/Lima' };
    const fecha = new Date().toLocaleDateString('es-PE', {
        ...lima, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Simular historial de N días con pendientes
    const MODULOS_POSIBLES = ['Inspecciones', 'ATS', 'PETAR', 'HHC', 'Objetivos PMA', 'Evidencias PMA'];

    const historial = Array.from({ length: diasSimulados }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Saltar fines de semana en simulacro
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
        const label = d.toLocaleDateString('es-PE', { ...lima, weekday: 'long', day: 'numeric', month: 'long' });
        // Cada día tiene entre 2 y 4 módulos pendientes aleatorios
        const cantidad = 2 + (i % 3);
        const pending = MODULOS_POSIBLES.slice(0, cantidad);
        return { dateStr: d.toLocaleDateString('en-CA', lima), label, isToday: i === 0, pending };
    });

    const severidad: 'normal' | 'reincidente' | 'grave' =
        diasSimulados >= 4 ? 'grave' : diasSimulados >= 2 ? 'reincidente' : 'normal';

    const config = {
        normal:      { color: '#f97316', bg: '#fff7ed', border: '#f97316', emoji: '⚠️',  titulo: 'REGISTROS PENDIENTES DEL DÍA' },
        reincidente: { color: '#dc2626', bg: '#fef2f2', border: '#dc2626', emoji: '🔴', titulo: `REINCIDENCIA — ${diasSimulados} DÍAS SIN REGISTRAR` },
        grave:       { color: '#7f1d1d', bg: '#450a0a', border: '#ef4444', emoji: '⛔', titulo: `INCUMPLIMIENTO GRAVE — ${diasSimulados} DÍAS ACUMULADOS` },
    }[severidad];

    const seccionesDias = historial.map((day, index) => {
        const bgHeader = day.isToday ? '#064e3b' : (severidad === 'grave' ? '#7f1d1d' : '#1e293b');
        const labelHoy = day.isToday ? ' <span style="background:#10b981; color:#fff; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; margin-left:8px;">HOY</span>' : '';
        const labelAyer = !day.isToday && index === 1 ? ' <span style="background:#64748b; color:#fff; font-size:10px; padding:2px 7px; border-radius:999px; font-weight:700; margin-left:6px;">AYER</span>' : '';

        const moduleRows = day.pending.map(mod => `
            <tr>
                <td style="padding:9px 16px; border-bottom:1px solid #f1f5f9;">
                    <span style="display:inline-block; width:8px; height:8px; background:#ef4444; border-radius:50%; margin-right:10px;"></span>
                    <strong style="color:#1e293b; font-size:13px;">${mod}</strong>
                </td>
                <td style="padding:9px 16px; border-bottom:1px solid #f1f5f9; text-align:right; color:#ef4444; font-weight:700; font-size:12px;">
                    ${day.isToday ? '⚠ Pendiente' : '✗ No registró'}
                </td>
            </tr>`).join('');

        return `
        <div style="margin-bottom:16px; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
            <div style="background:${bgHeader}; padding:10px 16px;">
                <span style="font-size:14px; margin-right:8px;">📅</span>
                <span style="color:#fff; font-weight:700; font-size:13px; text-transform:capitalize;">
                    ${day.label}${labelHoy}${labelAyer}
                </span>
            </div>
            <table style="width:100%; border-collapse:collapse; background:#fff;"><tbody>${moduleRows}</tbody></table>
        </div>`;
    }).join('');

    const bannerExtra = severidad === 'grave'
        ? `<div style="background:#450a0a; border:1px solid #ef4444; border-radius:10px; padding:14px 20px; margin-bottom:20px; text-align:center;">
               <p style="margin:0; color:#fca5a5; font-size:13px; font-weight:700;">
                   ⛔ Este colaborador lleva <strong style="color:#fff;">${diasSimulados} días laborables</strong> sin registrar actividades.<br>
                   <span style="font-size:12px; color:#f87171; font-weight:400;">Se recomienda tomar acción inmediata.</span>
               </p>
           </div>`
        : severidad === 'reincidente'
        ? `<div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:12px 20px; margin-bottom:20px; text-align:center;">
               <p style="margin:0; color:#dc2626; font-size:13px; font-weight:700;">
                   🔴 ${diasSimulados} días consecutivos sin registrar. Por favor complete los módulos pendientes.
               </p>
           </div>`
        : '';

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background:#f8fafc; font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px; margin:30px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:#7c3aed; padding:8px 24px; text-align:center;">
                <p style="margin:0; color:#fff; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                    🧪 SIMULACRO ${diasSimulados} DÍA${diasSimulados > 1 ? 'S' : ''} — Correo de prueba del sistema
                </p>
            </div>
            <div style="background:linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%); padding:28px 40px; text-align:center;">
                <span style="font-size:28px;">🛡️</span>
                <h1 style="color:#fff; margin:8px 0 0; font-size:20px; font-weight:800;">DASHBOARD SSOMA</h1>
                <p style="color:#a7f3d0; margin:6px 0 0; font-size:11px; letter-spacing:2px; text-transform:uppercase;">Sistema de Gestión Integral · Alerta Diaria</p>
            </div>
            <div style="background:${config.bg}; border-left:4px solid ${config.border}; padding:14px 32px;">
                <span style="font-size:18px; margin-right:10px;">${config.emoji}</span>
                <span style="color:${config.color}; font-weight:800; font-size:13px; text-transform:uppercase;">${config.titulo}</span>
                <p style="margin:3px 0 0 28px; color:${config.color}; font-size:12px; opacity:0.8;">${fecha}</p>
            </div>
            <div style="padding:28px 32px;">
                <p style="color:#334155; font-size:14px; margin:0 0 6px;">Estimado(a) <strong>Jose Luis Cancino Tueros</strong>,</p>
                <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0 0 20px;">
                    ${diasSimulados === 1
                        ? 'Aún no has registrado información en los siguientes módulos del día de hoy.'
                        : `Se detectaron <strong style="color:#ef4444;">${diasSimulados} días</strong> con registros incompletos en la plataforma SSOMA.`
                    }
                </p>
                ${bannerExtra}
                ${seccionesDias}
                <div style="text-align:center; margin:24px 0 8px;">
                    <a href="https://ssoma-platform.vercel.app"
                       style="display:inline-block; background:linear-gradient(135deg,#059669,#047857); color:#fff; text-decoration:none; padding:13px 36px; border-radius:10px; font-weight:700; font-size:14px;">
                        Ingresar a la Plataforma →
                    </a>
                </div>
                <p style="color:#94a3b8; font-size:11px; text-align:center; margin:12px 0 0;">
                    Recordatorio automático · 5:00 PM · Solo aparece si hay registros pendientes
                </p>
            </div>
            <div style="background:#f1f5f9; padding:16px 40px; border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8; font-size:11px; margin:0; text-align:center;">
                    SSOMA Platform · Casa Contratistas SAC<br>
                    <span style="color:#cbd5e1;">No responder a este correo automático</span>
                </p>
            </div>
        </div>
    </body>
    </html>`;

    const subjectPrefix = severidad === 'grave'
        ? `⛔ [SIMULACRO] INCUMPLIMIENTO GRAVE (${diasSimulados} días)`
        : severidad === 'reincidente'
        ? `🔴 [SIMULACRO] Reincidencia — ${diasSimulados} días`
        : `🧪 [SIMULACRO] Alerta diaria (1 día)`;

    try {
        await transporter.sendMail({
            from: `"SSOMA - Sistema de Alertas" <${gmailUser}>`,
            to: 'jcancino@casacontratistas.com, jlcantu.jlct@gmail.com',
            subject: `${subjectPrefix} · ${new Date().toLocaleDateString('es-PE', lima)}`,
            html,
        });
        return NextResponse.json({
            success: true,
            message: `✅ Simulacro de ${diasSimulados} día${diasSimulados > 1 ? 's' : ''} enviado a jcancino@casacontratistas.com y jlcantu.jlct@gmail.com`,
            severidad,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
