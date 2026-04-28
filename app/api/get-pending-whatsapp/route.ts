export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// ─── CONFIGURACIÓN DE USUARIOS ────────────────────────────────────────────────
const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladys Aroste Huertas',     phone: '+51969683799' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', phone: '+51929906173' },
];

const ADMIN_PHONE = '+51949260281';

const FERIADOS = [
    '2026-01-01', '2026-04-02', '2026-04-03', '2026-05-01', '2026-06-07', 
    '2026-06-29', '2026-07-23', '2026-07-28', '2026-07-29', '2026-08-06', 
    '2026-08-30', '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25'
];

// ─── LÓGICA DE VERIFICACIÓN DETALLADA ─────────────────────────────────────────

async function getPhotosForUser(firstName: string, todayStr: string): Promise<string[]> {
    const photos: string[] = [];
    
    // 1. De ATS
    try {
        const ats = await db.fetchOne(`SELECT file_url FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
        if (ats?.file_url) photos.push(ats.file_url);
    } catch {}

    // 2. De HHC
    try {
        const hhc = await db.fetchOne(`SELECT evidence_imgs FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
        if (hhc?.evidence_imgs) {
            try {
                const imgs = JSON.parse(hhc.evidence_imgs);
                if (Array.isArray(imgs)) photos.push(...imgs);
            } catch {
                if (typeof hhc.evidence_imgs === 'string' && hhc.evidence_imgs.startsWith('http')) photos.push(hhc.evidence_imgs);
            }
        }
    } catch {}

    // 3. De PMA Evidence
    try {
        const pma = await db.fetchAll(`SELECT images FROM pma_evidence_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
        for (const row of pma) {
            if (row.images) {
                try {
                    const imgs = JSON.parse(row.images);
                    if (Array.isArray(imgs)) photos.push(...imgs);
                } catch {}
            }
        }
    } catch {}

    return [...new Set(photos)].filter(p => p && p.startsWith('http')); // Limpiar y filtrar URLs válidas
}

async function getDetailedPending(user: any): Promise<string[]> {
    const pendingDetails: string[] = [];
    const firstName = user.name.split(' ')[0];
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    // 1. Obtener Mes Actual para el PMA (e.g. "Abril 2026")
    const monthName = now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' });
    const pmaMonthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);


    // ─── Tareas Diarias (Solo si NO es Gladys o Brayan) ───
    if (!isGladys) {
        // ATS Diario
        try {
            const ats = await db.fetchOne(`SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!ats) pendingDetails.push('ATS Diario');
        } catch {}

        // PETAR Diario
        try {
            const petar = await db.fetchOne(`SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!petar) pendingDetails.push('PETAR Diario');
        } catch {}

        // HHC Diario
        try {
            const hhc = await db.fetchOne(`SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!hhc) pendingDetails.push('Control HHC');
        } catch {}
    }

    // 3. Tareas del PMA (Formación, Inspecciones, Salud)
    try {
        const pmaTasks = await db.fetchAll(
            `SELECT category, topic FROM pma_records 
             WHERE month = ? AND responsible LIKE ? AND (status IS NULL OR status != 'Completado')`,
            [pmaMonthFormatted, `%${firstName}%`]
        );

        for (const task of pmaTasks) {
            const cat = task.category;
            const topic = task.topic;

            if (isGladys) {
                // Para Gladys SOLO Salud Ocupacional
                if (cat === 'Salud Ocupacional') {
                    pendingDetails.push(`Salud: ${topic}`);
                }
            } else {
                // Para los demás, clasificar por tipo
                if (cat === 'Formación') {
                    pendingDetails.push(`PMA Formación`);
                } else if (cat === 'Gestión de riesgos' || cat === 'Inspecciones') {
                    pendingDetails.push(`PMA Insp`);
                }
            }
        }
    } catch (err) {
        console.error("Error consultando PMA para", user.name, err);
    }

    return pendingDetails;
}

// ─── HANDLER GET ──────────────────────────────────────────────────────────────
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
            return NextResponse.json({ success: true, count: 0, data: [], message: "Día no laborable" });
        }

        const results = [];
        for (const user of ALERT_USERS) {
            const pending = await getDetailedPending(user);
            const firstName = user.name.split(' ')[0];
            const photos = await getPhotosForUser(firstName, todayStr);

            if (pending.length > 0) {
                results.push({
                    name: user.name,
                    phone: user.phone,
                    pendingCount: pending.length,
                    photoUrls: photos,
                    message: `🛡️ *DASHBOARD SSOMA - Recordatorio*\n\nHola *${firstName}*,\n\nAún tienes registros pendientes para el día de hoy:\n\n${pending.map(p => `❌ ${p}`).join('\n')}\n\nPor favor, completa tus registros aquí:\nhttps://ssoma-platform.vercel.app\n\n_Recordatorio automático de gestión SSOMA._`
                });
            }
        }

        return NextResponse.json({ success: true, adminPhone: ADMIN_PHONE, count: results.length, data: results });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

