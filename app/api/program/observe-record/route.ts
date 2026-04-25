import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sendAutomatedWhatsApp } from '@/lib/whatsappAutomation';

// ─── CONFIGURACIÓN DE USUARIOS ─────────────────────────────────────────────────
const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   email: 'jesusvillaloboslevano4@gmail.com', phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', email: 'josegamontesinos@gmail.com',        phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        email: 'adrian142005@hotmail.com',         phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladis Aroste Huertas',     email: 'gladys.aroste123@gmail.com',        phone: '+51969683799' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', email: 'albertscorpio99@gmail.com',        phone: '+51929906173' },
    { username: 'brayan.pena',        name: 'Brayan Jeanpool Peña Villafuerte', email: '20173143@unica.edu.pe',    phone: '+51971087023' },
];

const WHATSAPP_CC_PHONE = '+51949260281';

export async function POST(req: NextRequest) {
    try {
        const { responsibleName, documentName, month, activity, currentObjective } = await req.json();

        if (!responsibleName || !documentName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Buscar el destinatario con lógica robusta
        const recipient = ALERT_USERS.find(u => {
            const searchName = responsibleName.toLowerCase().trim();
            const targetName = u.name.toLowerCase().trim();
            const targetFirstName = targetName.split(' ')[0];
            if (targetName.includes(searchName) || searchName.includes(targetName)) return true;
            if (searchName.includes(targetFirstName)) return true;
            if (searchName.includes('gladis') || searchName.includes('gladys')) {
                if (targetFirstName === 'gladys' || targetFirstName === 'gladis') return true;
            }
            return false;
        });

        if (!recipient) {
            console.warn(`⚠️ No se encontró contacto para: ${responsibleName}`);
            // No bloqueamos — retornamos éxito con advertencia
            return NextResponse.json({ 
                success: true,
                sendedTo: responsibleName,
                warning: `No se encontró contacto para: ${responsibleName}. Observación registrada sin notificación.`
            });
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 20px;">⚠️ OBSERVACIÓN DE DOCUMENTACIÓN ⚠️</h1>
                </div>
                <div style="padding: 24px; color: #1e293b;">
                    <p>Hola <strong>${recipient.name}</strong>,</p>
                    <p>Se ha detectado una observación en la documentación del Programa Anual:</p>
                    <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0;"><strong>📄 Documento:</strong> ${documentName}</p>
                        <p style="margin: 0 0 8px 0;"><strong>📅 Mes:</strong> ${month}</p>
                        <p style="margin: 0 0 8px 0;"><strong>🎯 Objetivo:</strong> ${currentObjective || 'N/A'}</p>
                        <p style="margin: 0;"><strong>📋 Actividad:</strong> ${activity || 'N/A'}</p>
                    </div>
                    <p style="color: #ef4444; font-weight: bold;">Estado: NO CONFORME</p>
                    <p>Por favor, revisar y regularize este registro a la brevedad.</p>
                    <center style="margin-top: 30px;">
                        <a href="https://ssoma-platform.vercel.app" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">IR AL DASHBOARD</a>
                    </center>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
                    Mensaje automático generado por Sistema de Gestión SSOMA.
                </div>
            </div>
        `;

        const waMsg = `⚠️ *OBSERVACIÓN DE DOCUMENTACIÓN SSOMA* ⚠️\n\nHola *${recipient.name.split(' ')[0]}*,\n\nTienes una observación en tus registros:\n\n📄 *Documento:* ${documentName}\n📅 *Mes:* ${month}\n\n*ESTADO: NO CONFORME*\n\nPor favor, revisar y corregir.`;

        // 2. Intentar enviar correo — NO bloquea si falla (red local sin internet)
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;
        let emailSent = false;
        if (gmailUser && gmailPass) {
            try {
                const transporter = nodemailer.createTransport({ 
                    service: 'gmail', 
                    auth: { user: gmailUser, pass: gmailPass },
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                } as any);
                await transporter.sendMail({
                    from: `"SSOMA - Auditoría" <${gmailUser}>`,
                    to: recipient.email,
                    subject: `🚨 NO CONFORME: ${documentName} (${month})`,
                    html: emailHtml
                });
                emailSent = true;
            } catch (emailErr: any) {
                // Error de red en local — no bloquear la respuesta
                console.warn('⚠️ Email delivery failed (non-blocking):', emailErr.message);
            }
        }

        // 3. Intentar enviar WhatsApp — NO bloquea si falla
        let whatsappSent = false;
        try {
            await sendAutomatedWhatsApp(recipient.phone, waMsg);
            await sendAutomatedWhatsApp(WHATSAPP_CC_PHONE, `🤖 *AUDITORIA:* Doc. observado → ${recipient.name}\n\n${waMsg}`);
            whatsappSent = true;
        } catch (waErr: any) {
            console.warn('⚠️ WhatsApp delivery failed (non-blocking):', waErr.message);
        }

        const deliveredVia = [emailSent && 'Correo', whatsappSent && 'WhatsApp'].filter(Boolean).join(' y ');

        return NextResponse.json({ 
            success: true, 
            sendedTo: recipient.name,
            emailSent,
            whatsappSent,
            message: deliveredVia 
                ? `Observación notificada a ${recipient.name} vía ${deliveredVia}.` 
                : `Observación registrada para ${recipient.name}. (Notificaciones no disponibles en entorno local)`
        });

    } catch (error: any) {
        console.error('Error in observe-record API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
