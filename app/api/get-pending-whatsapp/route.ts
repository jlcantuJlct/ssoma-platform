import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// ─── CONFIGURACIÓN DE USUARIOS (Igual que en send-alerts) ──────────────────────
const ALERT_USERS = [
    { username: 'jesus.villalovos',   name: 'Jesus Villalobos Levano',   phone: '+51928893280' },
    { username: 'jose.galliquio',     name: 'Jose Galliquio Montesinos', phone: '+51986103867' },
    { username: 'adrian.suarez',      name: 'Adrian Suarez Soto',        phone: '+51943697255' },
    { username: 'gladis.aroste',      name: 'Gladys Aroste Huertas',     phone: '+51969683799' },
    { username: 'albert.chuquispuma', name: 'Albert Chuquispuma Santos', phone: '+51929906173' },
];

const ADMIN_PHONE = '+51949260281';

// Lista de feriados nacionales en Perú (YYYY-MM-DD)
const FERIADOS = [
    '2026-01-01', // Año Nuevo
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
    '2026-06-07', // Batalla de Arica
    '2026-06-29', // San Pedro y San Pablo
    '2026-07-23', // Día del Capitán FAP José Abelardo Quiñones Gonzales
    '2026-07-28', // Fiestas Patrias
    '2026-07-29', // Fiestas Patrias
    '2026-08-06', // Batalla de Junín
    '2026-08-30', // Santa Rosa de Lima
    '2026-10-08', // Combate de Angamos
    '2026-11-01', // Todos los Santos
    '2026-12-08', // Inmaculada Concepción
    '2026-12-09', // Batalla de Ayacucho
    '2026-12-25', // Navidad
];

// ─── LÓGICA DE VERIFICACIÓN ───────────────────────────────────────────────────
async function getPendingToday(firstName: string): Promise<string[]> {
    const pending: string[] = [];
    const isGladys = firstName.toLowerCase() === 'gladys' || firstName.toLowerCase() === 'gladis';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM inspection_records WHERE date LIKE ? AND responsible LIKE ?`,
            [`${today}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('Inspecciones');
    } catch { pending.push('Inspecciones'); }

    if (!isGladys) {
        try {
            const rows = await db.fetchAll(
                `SELECT id FROM ats_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('ATS');
        } catch { pending.push('ATS'); }

        try {
            const rows = await db.fetchAll(
                `SELECT id FROM petar_records WHERE date LIKE ? AND responsible LIKE ?`,
                [`${today}%`, `%${firstName}%`]
            );
            if (!rows || rows.length === 0) pending.push('PETAR');
        } catch { pending.push('PETAR'); }
    }

    try {
        const rows = await db.fetchAll(
            `SELECT id FROM hhc_records WHERE date LIKE ? AND responsable LIKE ?`,
            [`${today}%`, `%${firstName}%`]
        );
        if (!rows || rows.length === 0) pending.push('HHC');
    } catch { pending.push('HHC'); }

    return pending;
}

// ─── HANDLER GET ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ssoma_cron_2026';

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── VERIFICACIÓN DE DOMINGOS Y FERIADOS ───
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD
    const dayOfWeek = now.toLocaleDateString('en-US', { timeZone: 'America/Lima', weekday: 'numeric' }); // 0=Sunday, 1=Monday...

    const esDomingo = dayOfWeek === '0';
    const esFeriado = FERIADOS.includes(todayStr);

    if (esDomingo || esFeriado) {
        return NextResponse.json({ 
            success: true, 
            count: 0, 
            data: [], 
            message: `Hoy (${todayStr}) es ${esDomingo ? 'Domingo' : 'Feriado'}. No se envían alertas.` 
        });
    }

    const results = [];

    for (const user of ALERT_USERS) {
        const firstName = user.name.split(' ')[0];
        const pending = await getPendingToday(firstName);

        if (pending.length > 0) {
            results.push({
                name: user.name,
                firstName: firstName,
                phone: user.phone,
                pendingModules: pending,
                message: `🛡️ *DASHBOARD SSOMA - Recordatorio*\n\nHola *${firstName}*,\n\nAún tienes registros pendientes para el día de hoy en los siguientes módulos:\n\n${pending.map(p => `❌ ${p}`).join('\n')}\n\nPor favor, completa tus registros a la brevedad aquí:\nhttps://ssoma-platform.vercel.app\n\n_Este es un recordatorio automático del Sistema de Gestión SSOMA._`
            });
        }
    }

    return NextResponse.json({ 
        success: true, 
        adminPhone: ADMIN_PHONE,
        count: results.length,
        data: results 
    });
}
