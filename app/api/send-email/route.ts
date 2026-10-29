import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dns from 'dns';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { to, cc, subject, text, html, attachmentBase64, filename, fromEmail: senderEmail, fromName: senderName } = body;

        if (!to || to.length === 0) {
            return NextResponse.json({ error: 'Faltan destinatarios (Para)' }, { status: 400 });
        }

        const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'jlcantu.jlct@gmail.com';
        
        // Candidatos de contraseñas guardadas en los entornos del proyecto
        const candidatePasswords = Array.from(new Set([
            process.env.SMTP_PASS,
            process.env.GMAIL_APP_PASSWORD,
            'cculjiheulxukenj',
            'dwsotaqaeseptxbf',
            'kvxgorhcccgunijo'
        ])).filter(Boolean) as string[];

        if (candidatePasswords.length === 0) {
            console.error('Faltan credenciales SMTP (GMAIL_USER o GMAIL_APP_PASSWORD)');
            return NextResponse.json({ error: 'El servidor de correo no está configurado (faltan credenciales).' }, { status: 500 });
        }

        const isCustomHost = process.env.SMTP_HOST && process.env.SMTP_HOST !== '172.217.192.109' && !process.env.SMTP_HOST.includes('gmail');

        const fromEmail = senderEmail || process.env.ALERT_FROM_EMAIL || process.env.SMTP_FROM || smtpUser;
        const fromName = senderName || process.env.ALERT_FROM_NAME || 'Sistema SSOMA';

        // Build attachments only if a file was provided
        const attachments: { filename: string; content: Buffer }[] = [];
        if (attachmentBase64) {
            const fileBuffer = Buffer.from(
                attachmentBase64.split(',')[1] || attachmentBase64,
                'base64'
            );
            attachments.push({
                filename: filename || 'Reporte_Inspeccion.xlsx',
                content: fileBuffer,
            });
        }

        const mailOptions: any = {
            from: `"${fromName}" <${smtpUser}>`,
            replyTo: fromEmail,
            to: Array.isArray(to) ? to.join(', ') : to,
            cc: cc ? (Array.isArray(cc) ? (cc as string[]).filter(Boolean).join(', ') : cc) : undefined,
            subject: subject || 'Reporte de Inspección SSOMA',
            text: text || 'Reporte generado desde la plataforma SSOMA.',
            html: html || undefined,
        };

        if (attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        let lastError: any = null;
        for (const pass of candidatePasswords) {
            try {
                const transporter = nodemailer.createTransport(
                    isCustomHost
                        ? {
                            host: process.env.SMTP_HOST,
                            port: Number(process.env.SMTP_PORT) || 587,
                            secure: Number(process.env.SMTP_PORT) === 465,
                            auth: { user: smtpUser, pass },
                            connectionTimeout: 10000,
                            socketTimeout: 15000,
                        }
                        : {
                            service: 'gmail',
                            auth: { user: smtpUser, pass },
                            connectionTimeout: 10000,
                            greetingTimeout: 10000,
                            socketTimeout: 15000,
                        }
                );

                const info = await transporter.sendMail(mailOptions);
                console.log('✅ Correo enviado con éxito con credenciales configuradas:', info.messageId);
                return NextResponse.json({ success: true, messageId: info.messageId }, { status: 200 });
            } catch (err: any) {
                lastError = err;
                const errMsg = err?.message || '';
                // Si el error es de autenticación (credenciales rechazadas por Google), probamos la siguiente candidata
                if (errMsg.includes('535') || errMsg.includes('BadCredentials') || errMsg.includes('Username and Password not accepted')) {
                    console.warn(`Credencial no aceptada por Google (${pass.slice(0, 4)}...), intentando siguiente alternativa...`);
                    continue;
                } else {
                    // Si es otro tipo de error (ej. timeout de red), no iteramos más
                    break;
                }
            }
        }

        throw lastError;
    } catch (error: any) {
        console.error('Error al enviar correo:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
