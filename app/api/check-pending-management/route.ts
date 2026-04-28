export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladys Aroste Huertas',     phone: '+51969683799' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', phone: '+51929906173' },
    { username: 'brayan.pena',         name: 'Brayan Jeanpool Peña Villafuerte', phone: '+51971087023' },
];

const ADMIN_PHONE = '+51949260281';

const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', 
    '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29', '2026-08-06', 
    '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25'
];

async function getDetailedPending(user: any): Promise<string[]> {
    const pendingDetails: string[] = [];
    const firstName = user.name.split(' ')[0];
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const isBrayan = firstName.toLowerCase() === 'brayan';
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    const monthName = now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' });
    const pmaMonthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    if (isBrayan) {
        try {
            const rows = await db.fetchAll(
                `SELECT e.id FROM evidence e 
                 JOIN activities a ON e.activity_id = a.id 
                 WHERE e.created_at LIKE ? AND a.responsible LIKE ?`,
                [`${todayStr}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pendingDetails.push('Fotos PMA');
        } catch {}

        try {
            const rows = await db.fetchAll(
                `SELECT id FROM desvio_evidence_records WHERE date = ? AND responsible LIKE ?`,
                [todayStr, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pendingDetails.push('Control de Desvíos');
        } catch {}
        return pendingDetails;
    }

    if (!isGladys) {
        try {
            const ats = await db.fetchOne(`SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!ats) pendingDetails.push('ATS');
        } catch {}

        try {
            const petar = await db.fetchOne(`SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!petar) pendingDetails.push('PETAR');
        } catch {}

        try {
            const hhc = await db.fetchOne(`SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!hhc) pendingDetails.push('HHC');
        } catch {}
    }

    try {
        const pmaTasks = await db.fetchAll(
            `SELECT category, topic FROM pma_records 
             WHERE month = ? AND responsible LIKE ? AND (status IS NULL OR status != 'Completado')`,
            [pmaMonthFormatted, `%${firstName}%`]
        );
        for (const task of pmaTasks) {
            const cat = task.category;
            if (isGladys) {
                if (cat === 'Salud Ocupacional') pendingDetails.push(`Salud: ${task.topic}`);
            } else {
                if (cat === 'Formación') pendingDetails.push(`PMA Formación`);
                else if (cat === 'Gestión de riesgos' || cat === 'Inspecciones') pendingDetails.push(`PMA Insp`);
            }
        }
    } catch {}

    return pendingDetails;
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        const dayOfWeekName = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', weekday: 'long' }).format(now);

        if (dayOfWeekName === 'Sunday' || FERIADOS.includes(todayStr)) {
            return NextResponse.json({ success: true, message: "Día no laborable" });
        }

        const summaryLines: string[] = [];
        let pendingTotal = 0;

        for (const user of ALERT_USERS) {
            const pending = await getDetailedPending(user);
            const firstName = user.name.split(' ')[0];
            
            if (pending.length === 0) {
                summaryLines.push(`✅ *${firstName}*: Al día`);
            } else {
                summaryLines.push(`❌ *${firstName}*: ${pending.join(', ')}`);
                pendingTotal++;
            }
        }

        const reportDate = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' });
        const message = `🤖 *REPORTE DE GESTIÓN SSOMA*\n_${reportDate}_\n\n*Estado de Cumplimiento:*\n\n${summaryLines.join('\n')}\n\n${pendingTotal === 0 ? "🌟 ¡Todo el equipo está al día!" : `⚠️ Hay *${pendingTotal}* personas con pendientes.`}\n\nhttps://ssoma-platform.vercel.app`;

        return NextResponse.json({ 
            success: true, 
            adminPhone: ADMIN_PHONE, 
            message: message 
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
