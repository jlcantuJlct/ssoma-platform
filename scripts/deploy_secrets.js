
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const path = require('path');

// 1. Leer credenciales
const keyPath = path.join(process.cwd(), 'service-account.json');
if (!fs.existsSync(keyPath)) {
    console.error("❌ No encuentro service-account.json");
    process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
const SHEETS_ID = '1V-oOFEgt1WBsKp29CHIKN7F3zSXeF0yyG566wOzL5yg'; // Hardcoded from chat

const envVars = {
    'GOOGLE_CLIENT_EMAIL': creds.client_email,
    'GOOGLE_PRIVATE_KEY': creds.private_key,
    'GOOGLE_SHEET_ID': SHEETS_ID
};

console.log("🚀 Iniciando configuración automática de variables en Vercel...");

async function setEnv(key, value) {
    return new Promise((resolve) => {
        console.log(`\n🔹 Configurando ${key}...`);

        // Primero intentamos borrarla por si existe mal configurada
        try {
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (e) { /* Ignorar si no existe */ }

        // Ahora la agregamos
        const child = spawn('npx', ['vercel', 'env', 'add', key, 'production'], {
            shell: true
        });

        child.stdout.on('data', (data) => {
            const str = data.toString();
            // Vercel pregunta por el valor
            if (str.includes('What\'s the value')) {
                child.stdin.write(value + '\n');
                child.stdin.end();
            }
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${key} configurada correctamente.`);
            } else {
                console.error(`❌ Error configurando ${key}.`);
            }
            resolve();
        });
    });
}

async function run() {
    for (const [key, val] of Object.entries(envVars)) {
        await setEnv(key, val);
    }
    console.log("\n✨ Todas las variables configuradas.");
    console.log("⏳ Iniciando despliegue final...");
    try {
        execSync('npx vercel --prod', { stdio: 'inherit' });
        console.log("\n🎉 ¡SISTEMA REPARADO! Ahora Drive y la Base de Datos funcionarán.");
    } catch (e) {
        console.error("Error en despliegue", e);
    }
}

run();
