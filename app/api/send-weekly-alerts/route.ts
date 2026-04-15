import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { sendAutomatedWhatsApp } from '@/lib/whatsappAutomation';

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
const MANAGEMENT_RECIPIENTS = [
    { name: 'Jose Luis Galliquio', email: 'josegamontesinos@gmail.com', phone: '+51986103867' },
    { name: 'Jesus Villalobos',    email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280' },
    { name: 'Brayan Peña',         email: '20173143@unica.edu.pe', phone: '+51971087023' },
    { name: 'Jose Luis Cancino',   email: 'jlcantu.jlct@gmail.com', phone: '+51949260281' },
];

const TARGET_USERS = [
    { username: 'jose.galliquio',     name: 'Jose Galliquio',     firstName: 'Jose' },
    { username: 'jesus.villalovos',   name: 'Jesus Villalovos',   firstName: 'Jesus' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez',      firstName: 'Adrian' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma', firstName: 'Albert' },
    { username: 'gladis.aroste',      name: 'Gladis Aroste',      firstName: 'Gladis' },
];

const DAYS_TO_CHECK = 7; // Una semana completa

// ─── COMPROBACIÓN DE PENDIENTES ──────────────────────────────────────────────
async function getPendingForDate(firstName: string, dateStr: string): Promise<string[]> {
    const pending: string[] = [];

    // 1. Fotos PMA (Evidencias PMA en el código se llama 'evidence')
    try {
        const rows = await db.fetchAll(
            `SELECT e.id FROM evidence e
             JOIN activities a ON e.activity_id = a.id
             WHERE DATE(e.created_at) = ? AND a.responsible LIKE ?`,
            [dateStr, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('Fotos PMA');
    } catch { pending.push('Fotos PMA'); }

    // 2. Control de Desvíos (Nueva tabla desvio_evidence_records)
    try {
        const rows = await db.fetchAll(
            `SELECT id FROM desvio_evidence_records WHERE date = ? AND responsible LIKE ?`,
            [dateStr, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('Control de Desvíos');
    } catch { pending.push('Control de Desvíos'); }

    return pending;
}

// ─── CONSTRUCCIÓN DEL REPORTE SEMANAL ────────────────────────────────────────
async function buildWeeklyReport() {
    const reportData: any[] = [];
    const lima = { timeZone: 'America/Lima' };

    for (const user of TARGET_USERS) {
        const userStatus: any = { name: user.name, days: [] };
        
        for (let i = 0; i < DAYS_TO_CHECK; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            
            // Solo días laborables (L-V)
            const dow = d.getDay();
            if (dow === 0 || dow === 6) continue;

            const dateStr = d.toLocaleDateString('en-CA', lima);
            const pending = await getPendingForDate(user.firstName, dateStr);
            
            if (pending.length > 0) {
                userStatus.days.push({ 
                    label: d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }),
                    pending 
                });
            }
        }
        reportData.push(userStatus);
    }
    return reportData;
}

// ─── GENERAR HTML ────────────────────────────────────────────────────────────
function buildHtml(reportData: any[], fecha: string) {
    const userRows = reportData.map(user => {
        const dayBadges = user.days.length === 0 
            ? '✅ Todo al día' 
            : user.days.map((d:any) => `
                <div style="margin-bottom:8px; background:#fff; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px;">
                    <strong style="font-size:11px; color:#64748b; text-transform:uppercase;">${d.label}:</strong><br>
                    <span style="color:#ef4444; font-size:12px; font-weight:600;">${d.pending.join(', ')}</span>
                </div>
            `).join('');

        return `
            <tr>
                <td style="padding:15px; border-bottom:1px solid #e2e8f0; vertical-align:top; width:200px;">
                    <strong style="color:#1e293b; font-size:14px;">${user.name}</strong>
                    ${user.days.length > 0 ? `<br><span style="background:#fef2f2; color:#ef4444; font-size:10px; padding:2px 8px; border-radius:10px; font-weight:700;">${user.days.length} DÍAS PENDIENTES</span>` : ''}
                </td>
                <td style="padding:15px; border-bottom:1px solid #e2e8f0; background:#f8fafc;">
                    ${dayBadges}
                </td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family:'Segoe UI',Arial,sans-serif; background:#f8fafc; padding:20px; color:#334155;">
        <div style="max-width:700px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
            <div style="background:#064e3b; padding:25px; text-align:center; color:#fff;">
                <h1 style="margin:0; font-size:20px; font-weight:800; letter-spacing:1px;">REPORTE SEMANAL DE FOTOS PMA Y DESVÍOS</h1>
                <p style="margin:5px 0 0; opacity:0.8; font-size:12px;">SSOMA PLATFORM · SEMANA AL ${fecha}</p>
            </div>
            <div style="padding:20px;">
                <p style="font-size:14px; color:#64748b; margin-bottom:20px;">A continuación se detallan los registros pendientes de Fotos PMA y Control de Desvíos para el personal monitoreado:</p>
                <table style="width:100%; border-collapse:collapse;">
                    <thead style="background:#f1f5f9;">
                        <tr>
                            <th style="padding:12px; text-align:left; color:#475569; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Colaborador</th>
                            <th style="padding:12px; text-align:left; color:#475569; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Pendientes Detectados</th>
                        </tr>
                    </thead>
                    <tbody>${userRows}</tbody>
                </table>
                <div style="margin-top:30px; text-align:center;">
                    <a href="https://ssoma-platform.vercel.app" style="background:#059669; color:#fff; text-decoration:none; padding:12px 30px; border-radius:8px; font-weight:700; font-size:13px;">Revisar en la Plataforma</a>
                </div>
            </div>
            <div style="background:#f1f5f9; padding:15px; text-align:center; color:#94a3b8; font-size:11px;">
                Este es un reporte automático especializado generado para el equipo de gestión.
            </div>
        </div>
    </body>
    </html>
    `;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
        return NextResponse.json({ error: 'Gmail no configurado' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
    });

    const limaDate = new Date().toLocaleDateString('es-PE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'America/Lima'
    });

    try {
        const reportData = await buildWeeklyReport();
        
        const emailList = MANAGEMENT_RECIPIENTS.map(r => r.email).filter(Boolean).join(', ');

        await transporter.sendMail({
            from: `"SSOMA - Reporte Especializado" <${gmailUser}>`,
            to: emailList,
            subject: `📊 [SSOMA] Reporte de Fotos PMA y Desvíos — ${new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`,
            html: buildHtml(reportData, limaDate),
        });

        // ─── ENVÍO DE WHATSAPP A GESTIÓN ───
        for (const recipient of MANAGEMENT_RECIPIENTS) {
            if (recipient.phone) {
                const waMessage = `📊 *REPORTE SEMANAL SSOMA - Fotos PMA y Desvíos*\n\nHola *${recipient.name}*,\n\nSe ha generado el reporte semanal con el resumen de cumplimiento de Fotos PMA y Control de Desvíos. Puedes revisarlo en la plataforma:\nhttps://ssoma-platform.vercel.app\n\n_Este es un mensaje automático de gestión._`;
                
                await sendAutomatedWhatsApp(recipient.phone, waMessage);
            }
        }

        return NextResponse.json({ success: true, results: reportData });
    } catch (err: any) {
        console.error('Error enviando reporte semanal:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}
