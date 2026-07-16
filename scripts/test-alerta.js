const { Client, LocalAuth } = require('whatsapp-web.js');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const RESPONSABLES = [
    { nombre: 'Jesus Villalobos',   phone: '51928893280' },
    { nombre: 'Jose Galliquio',     phone: '51986103867' },
    { nombre: 'Adrian Suarez',      phone: '51943697255' },
    { nombre: 'Gladis Aroste',      phone: '51969683799' },
    { nombre: 'Albert Chuquispuma', phone: '51929906173' },
    { nombre: 'Brayan Peña',        phone: '51971087023' },
];
const CC_PHONE = '51949260281';

const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '../.whatsapp-session') }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('ready', async () => {
    console.log('✅ Conectado para prueba forzada...');
    await enviarAlertasDiarias();
    console.log('🏁 Prueba finalizada. Cerrando robot...');
    await client.destroy();
    await pool.end();
    process.exit(0);
});

async function obtenerInspeccionesPendientes() {
    try {
        const res = await pool.query(`
            SELECT responsible, inspection_type, area, zone, date, status, CURRENT_DATE - date::date as dias_pendiente
            FROM inspection_records 
            WHERE status = 'Pendiente' AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND date::date <= CURRENT_DATE
            ORDER BY date ASC
        `);
        return res.rows;
    } catch (e) { return []; }
}

async function enviarMensaje(phone, mensaje) {
    try {
        await client.sendMessage(`${phone}@c.us`, mensaje);
        console.log(`   ✅ Enviado a ${phone}`);
        return true;
    } catch (e) {
        console.error(`   ❌ Error enviando a ${phone}:`, e.message);
        return false;
    }
}

async function enviarAlertasDiarias() {
    const hoy = new Date();
    const fechaStr = `${hoy.getDate().toString().padStart(2,'0')}/${(hoy.getMonth()+1).toString().padStart(2,'0')}/${hoy.getFullYear()}`;
    console.log(`\n🚨 Iniciando envío FORZADO de alertas — ${fechaStr}`);

    const pendientes = await obtenerInspeccionesPendientes();
    if (pendientes.length === 0) {
        console.log('   ✅ No hay inspecciones pendientes.');
        return;
    }

    const porResponsable = {};
    for (const insp of pendientes) {
        const resp = (insp.responsible || '').trim();
        if (!porResponsable[resp]) porResponsable[resp] = [];
        porResponsable[resp].push(insp);
    }

    for (const { nombre, phone } of RESPONSABLES) {
        const misInspecciones = pendientes.filter(i => (i.responsible || '').toLowerCase().includes(nombre.split(' ')[0].toLowerCase()));
        if (misInspecciones.length === 0) continue;

        let msg = `🦺 *ALERTA SSOMA (PRUEBA) — ${fechaStr}*\n\nHola *${nombre}*, tienes *${misInspecciones.length} inspección(es) PENDIENTE(S)*:\n\n`;
        misInspecciones.slice(0, 5).forEach((i, idx) => {
            msg += `*${idx + 1}.* ${(i.inspection_type || '').substring(0, 60)}...\n   📍 Lugar: ${i.zone || i.area || '-'}\n   📅 Fecha: ${i.date}\n\n`;
        });
        if (misInspecciones.length > 5) msg += `_...y ${misInspecciones.length - 5} más._\n\n`;
        msg += `🔗 https://ssoma-platform.vercel.app/inspections`;

        await enviarMensaje(phone, msg);
        await new Promise(r => setTimeout(r, 2000));
    }

    let resumenMsg = `📊 *RESUMEN SSOMA (PRUEBA) — ${fechaStr}*\n\n*Total pendientes: ${pendientes.length}*\n\n*Por responsable:*\n`;
    resumenMsg += Object.entries(porResponsable).map(([r, i]) => `• ${r}: ${i.length}`).join('\n');
    await enviarMensaje(CC_PHONE, resumenMsg);
}

console.log('Iniciando prueba...');
client.initialize();
