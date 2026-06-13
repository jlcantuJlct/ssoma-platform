import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { areas, inspectionLink, areaText } = await request.json();

    // 1. Fetch contacts from DB
    const { rows } = await db.query('SELECT * FROM notification_contacts');
    
    // 2. Separate permanent CCs and the specific Area responsible
    const ccs = rows.filter(c => c.is_permanent_cc).map(c => c.email);
    
    let toEmails = [];
    let toNames = [];
    let finalAreaName = '';

    if (areas && Array.isArray(areas)) {
        const standardAreas = areas.filter(a => a !== 'Otros');
        const responsibles = rows.filter(c => !c.is_permanent_cc && standardAreas.includes(c.area));
        toEmails = responsibles.map(c => c.email);
        toNames = responsibles.map(c => c.name).filter(n => n);
        
        let areaNames = [...standardAreas];
        if (areas.includes('Otros') && areaText) {
            areaNames.push(areaText);
        }
        finalAreaName = areaNames.join(', ');
    }

    if (toEmails.length === 0 && ccs.length === 0) {
      return NextResponse.json({ message: 'No recipients found' }, { status: 200 });
    }

    // Dynamic greeting based on Lima time
    const limaTime = new Date().toLocaleString("en-US", { timeZone: "America/Lima", hour: 'numeric', hour12: false });
    const hour = parseInt(limaTime);
    let greeting = 'Buenos días';
    if (hour >= 12 && hour < 19) {
        greeting = 'Buenas tardes';
    } else if (hour >= 19 || hour < 6) {
        greeting = 'Buenas noches';
    }

    let namesText = toNames.length > 0 ? `Estimado(s) <strong>${toNames.join(', ')}</strong>,<br><br>` : `Estimados,<br><br>`;

    // 3. Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 4. Send Email
    const mailOptions = {
      from: `"${process.env.ALERT_FROM_NAME || 'SSOMA - Alertas'}" <${process.env.ALERT_FROM_EMAIL || process.env.GMAIL_USER}>`,
      to: toEmails.length > 0 ? toEmails.join(',') : ccs[0], // If no TO, use first CC as TO
      cc: ccs.join(','),
      subject: `⚠️ Alerta SSOMA: Observaciones en Inspección - ${finalAreaName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">Alerta de Inspección con Observaciones</h2>
          </div>
          <div style="padding: 20px; background-color: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">
                ${namesText}
                ${greeting},
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">
              Por medio del presente, se le notifica que se ha registrado una nueva inspección en el sistema, la cual contiene observaciones pendientes de levantar para el área de: <strong>${finalAreaName}</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inspectionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Ver Inspección y Observaciones
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5;">
              Por favor, ingrese al enlace adjunto para revisar el archivo cargado y gestionar los hallazgos a la brevedad posible.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Alert email sent:', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending alert email:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : '' }, { status: 500 });
  }
}
