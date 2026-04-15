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

async function getDetailedPending(user: any): Promise<string[]> {
    const pendingDetails: string[] = [];
    const firstName = user.name.split(' ')[0];
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    // 1. Obtener Mes Actual para el PMA (e.g. "Abril 2026")
    const monthName = now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' });
    const pmaMonthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // 2. Tareas Diarias (Solo si NO es Gladys o si se requiere)
    // El usuario pidió para Gladys SOLO Salud. Los ATS/PETAR/Inspecciones normales suelen ser Operativos.
    if (!isGladys) {
        // ATS Diario
        try {
            const ats = await db.fetchOne(`SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!ats) pendingDetails.push('Operativo: ATS Diario');
        } catch {}

        // PETAR Diario
        try {
            const petar = await db.fetchOne(`SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!petar) pendingDetails.push('Operativo: PETAR Diario');
        } catch {}

        // HHC Diario
        try {
            const hhc = await db.fetchOne(`SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`, [`${todayStr}%`, `%${firstName}%`]);
            if (!hhc) pendingDetails.push('Operativo: Control HHC');
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
                    pendingDetails.push(`Formación: ${topic}`);
                } else if (cat === 'Gestión de riesgos' || cat === 'Inspecciones') {
                    pendingDetails.push(`Inspección: ${topic}`);
                } else {
                    pendingDetails.push(`${cat}: ${topic}`);
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

            if (pending.length > 0) {
                const firstName = user.name.split(' ')[0];
                results.push({
                    name: user.name,
                    phone: user.phone,
                    pendingCount: pending.length,
                    message: `🛡️ *DASHBOARD SSOMA - Recordatorio*\n\nHola *${firstName}*,\n\nAún tienes registros pendientes para el día de hoy:\n\n${pending.map(p => `❌ ${p}`).join('\n')}\n\nPor favor, completa tus registros aquí:\nhttps://ssoma-platform.vercel.app\n\n_Recordatorio automático de gestión SSOMA._`
                });
            }
        }

        return NextResponse.json({ success: true, adminPhone: ADMIN_PHONE, count: results.length, data: results });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
