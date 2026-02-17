
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../service-account.json');
const tsPath = path.join(__dirname, '../lib/credentials.ts');

if (!fs.existsSync(jsonPath)) {
    console.error("❌ No existe service-account.json");
    process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Escapar newlines para que sean literales en el string TS si es necesario, 
// o simplemente usarlos.
// JSON.stringify will escape \n to \\n automatically for the string representation.
const cleanKey = creds.private_key;

const fileContent = `
// Credenciales del Robot (Service Account) para Producción
// Sincronizado automáticamente desde service-account.json
// Fecha: ${new Date().toISOString()}

export const ROBOT_CREDENTIALS = {
    client_email: "${creds.client_email}",
    private_key: ${JSON.stringify(cleanKey)}
};
`;

fs.writeFileSync(tsPath, fileContent);
console.log("✅ lib/credentials.ts actualizado correctamente desde service-account.json");
console.log(`   Email: ${creds.client_email}`);
console.log(`   Key Length: ${cleanKey.length}`);
