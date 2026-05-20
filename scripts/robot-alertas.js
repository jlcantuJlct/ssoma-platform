/**
 * ROBOT SSOMA - Alertas Automáticas de WhatsApp
 * ================================================
 * Este script corre en tu PC en segundo plano y envía
 * alertas de WhatsApp a los responsables de inspecciones
 * pendientes todos los días de lunes a viernes a las 12:10.
 * 
 * CÓMO USARLO:
 * 1. node scripts/robot-alertas.js
 * 2. Escanear el código QR con tu WhatsApp (solo la primera vez)
 * 3. Dejar corriendo en segundo plano
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// =============================================
// CONFIGURACIÓN — EDITA ESTOS NÚMEROS DE TELÉFONO
// =============================================
const RESPONSABLES = [
    { nombre: 'Jesus Villalobos',   phone: '51928893280' },
    { nombre: 'Jose Galliquio',     phone: '51986103867' },
    { nombre: 'Adrian Suarez',      phone: '51943697255' },
    { nombre: 'Gladis Aroste',      phone: '51969683799' },
    { nombre: 'Albert Chuquispuma', phone: '51929906173' },
    { nombre: 'Brayan Peña',        phone: '51971087023' },
];

// Número del coordinador/jefe que recibe resumen general
const CC_PHONE = '51949260281';

// =============================================
// CONEXIÓN A SUPABASE (usa las mismas credenciales)
// =============================================
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

// =============================================
// CLIENTE DE WHATSAPP (tu propio número)
// =============================================
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '../.whatsapp-session') }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 ESCANEA ESTE QR CON TU WHATSAPP:');
    console.log('   (WhatsApp → ... → Dispositivos Vinculados → Vincular Dispositivo)\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado exitosamente!');
    console.log('🤖 Robot SSOMA activo. Enviando alertas de L-V a las 12:10.\n');
    programarAlertas();
});

client.on('auth_failure', () => {
    console.error('❌ Error de autenticación. Borra la carpeta .whatsapp-session y vuelve a escanear el QR.');
});

client.on('disconnected', (reason) => {
    console.warn('⚠️  WhatsApp desconectado:', reason, '— Reiniciando...');
    client.initialize();
});

// =============================================
// FUNCIÓN: Obtener inspecciones pendientes
// =============================================
async function obtenerInspeccionesPendientes() {
    try {
        const res = await pool.query(`
            SELECT 
                responsible,
                inspection_type,
                area,
                zone,
                date,
                status,
                CURRENT_DATE - date::date as dias_pendiente
            FROM inspection_records 
            WHERE status = 'Pendiente'
              AND date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND date::date <= CURRENT_DATE
            ORDER BY date ASC
        `);
        return res.rows;
    } catch (e) {
        console.error('Error consultando inspecciones:', e.message);
        return [];
    }
}

// =============================================
// FUNCIÓN: Formatear nombre del mes
// =============================================
function nombreMes(num) {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return meses[num] || '';
}

// =============================================
// FUNCIÓN: Enviar mensaje de WhatsApp
// =============================================
async function enviarMensaje(phone, mensaje) {
    try {
        const chatId = `${phone}@c.us`;
        await client.sendMessage(chatId, mensaje);
        console.log(`   ✅ Enviado a ${phone}`);
        return true;
    } catch (e) {
        console.error(`   ❌ Error enviando a ${phone}:`, e.message);
        return false;
    }
}

// =============================================
// FUNCIÓN PRINCIPAL: Enviar alertas diarias
// =============================================
async function enviarAlertasDiarias() {
    const hoy = new Date();
    const fechaStr = `${hoy.getDate().toString().padStart(2,'0')}/${(hoy.getMonth()+1).toString().padStart(2,'0')}/${hoy.getFullYear()}`;
    
    console.log(`\n🚨 [${new Date().toLocaleTimeString()}] Iniciando envío de alertas — ${fechaStr}`);

    const pendientes = await obtenerInspeccionesPendientes();
    
    if (pendientes.length === 0) {
        console.log('   ✅ No hay inspecciones pendientes. No se envían alertas.');
        return;
    }

    console.log(`   📋 ${pendientes.length} inspecciones pendientes encontradas.`);

    // Agrupar por responsable
    const porResponsable = {};
    for (const insp of pendientes) {
        const resp = (insp.responsible || '').trim();
        if (!porResponsable[resp]) porResponsable[resp] = [];
        porResponsable[resp].push(insp);
    }

    // Enviar mensaje personalizado a cada responsable
    for (const { nombre, phone } of RESPONSABLES) {
        const misInspecciones = pendientes.filter(i =>
            (i.responsible || '').toLowerCase().includes(nombre.split(' ')[0].toLowerCase())
        );

        if (misInspecciones.length === 0) continue;

        let msg = `🦺 *ALERTA SSOMA — ${fechaStr}*\n\n`;
        msg += `Hola *${nombre}*, tienes *${misInspecciones.length} inspección(es) PENDIENTE(S)*:\n\n`;
        
        misInspecciones.slice(0, 5).forEach((i, idx) => {
            const dias = parseInt(i.dias_pendiente) || 0;
            const tipo = (i.inspection_type || '').substring(0, 60);
            msg += `*${idx + 1}.* ${tipo}...\n`;
            msg += `   📍 Lugar: ${i.zone || i.area || '-'}\n`;
            msg += `   📅 Fecha: ${i.date} ${dias > 0 ? `(hace ${dias} días)` : ''}\n\n`;
        });

        if (misInspecciones.length > 5) {
            msg += `_...y ${misInspecciones.length - 5} más._\n\n`;
        }

        msg += `Por favor actualiza el estado en la plataforma SSOMA.\n`;
        msg += `🔗 https://ssoma-platform.vercel.app/inspections`;

        await enviarMensaje(phone, msg);
        await new Promise(r => setTimeout(r, 2000)); // pausa entre mensajes
    }

    // Enviar resumen al coordinador
    const totalPendientes = pendientes.length;
    const resumenPorResp = Object.entries(porResponsable)
        .map(([resp, items]) => `• ${resp}: ${items.length}`)
        .join('\n');

    let resumenMsg = `📊 *RESUMEN SSOMA — ${fechaStr}*\n\n`;
    resumenMsg += `*Total inspecciones pendientes: ${totalPendientes}*\n\n`;
    resumenMsg += `*Por responsable:*\n${resumenPorResp}\n\n`;
    resumenMsg += `🔗 https://ssoma-platform.vercel.app/inspections`;

    console.log(`   📤 Enviando resumen al coordinador (${CC_PHONE})...`);
    await enviarMensaje(CC_PHONE, resumenMsg);

    console.log(`   ✅ Alertas enviadas correctamente.\n`);
}

// =============================================
// PROGRAMAR ALERTAS: L-V a las 12:10
// =============================================
function programarAlertas() {
    // Cron: minuto 10, hora 12, cualquier día, cualquier mes, lunes a viernes (1-5)
    schedule.scheduleJob('10 12 * * 1-5', () => {
        enviarAlertasDiarias();
    });

    console.log('⏰ Alertas programadas: Lunes a Viernes a las 12:10\n');
    console.log('🔄 Puedes forzar un envío ahora con Ctrl+C para detener, o espera las 12:10.\n');
}

// =============================================
// INICIAR CLIENTE
// =============================================
console.log('=================================================');
console.log('   🤖 ROBOT DE ALERTAS SSOMA - WhatsApp');
console.log('=================================================');
console.log('Iniciando conexión con WhatsApp...\n');

client.initialize();

// Mantener proceso activo
process.on('SIGINT', async () => {
    console.log('\n🛑 Deteniendo robot...');
    await client.destroy();
    await pool.end();
    process.exit(0);
});
