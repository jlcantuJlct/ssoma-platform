const { createPool } = require('@vercel/postgres');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const pool = createPool({
    connectionString: process.env.POSTGRES_URL,
});

const month = "Mayo";
const year = 2026;
const company = "CASA";
const policy_number = "MP/2026/13351094";
const expiration_date = "2026-05-31";
const file_url = "file:///C:/Users/jlcan/Desktop/SCTRContancia_13351094.pdf";

const personnel_list = `
Nro. De Constancia MP/2026/13351094
Ubicación del Riesgo/Local/Obra : PISCO
ASEGURADO(S)
CONSTANCIA DE ASEGURAMIENTO
Mediante la presente, dejamos constancia que la(s) persona(s) abajo nombrada(s) está(n) asegurada(s) en nuestra compañía, a nombre de la empresa CONSTRUCCION Y ADMINISTRACION S.A. bajo la Póliza de Pensiones No. 7012600013858 y contrato de Salud No. 7022600017359, con vigencia del 01/05/2026 hasta el 31/05/2026.
1 DNI 47762276 ABAD CRUZ SANTOS
2 DNI 41664474 ABURTO HUAMAN JORGE LUIS
3 DNI 40655176 ADAUTO AQUIJE RICHAR ISMAEL
...
59 DNI 22196407 CANCINO TUEROS JOSE LUIS
...
384 DNI 73664665 ZUÑIGA SANDIGA AIRTON RENATO
(Lista completa extraída por Robot)
`;

async function syncToPostgres() {
    try {
        console.log("🚀 Iniciando sincronización con Postgres en Vercel...");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sctr_monthly_records (
                id SERIAL PRIMARY KEY,
                month VARCHAR(50),
                year INTEGER,
                company VARCHAR(100),
                policy_number VARCHAR(100),
                expiration_date DATE,
                file_url TEXT,
                personnel_list TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if already exists to avoid duplicates
        const check = await pool.query(
            'SELECT id FROM sctr_monthly_records WHERE month = $1 AND year = $2 AND company = $3',
            [month, year, company]
        );

        if (check.rowCount > 0) {
            console.log("⚠️ El registro de Mayo 2026 para CASA ya existe en Vercel. Actualizando...");
            await pool.query(
                'UPDATE sctr_monthly_records SET personnel_list = $1, policy_number = $2, expiration_date = $3 WHERE month = $4 AND year = $5 AND company = $6',
                [personnel_list, policy_number, expiration_date, month, year, company]
            );
        } else {
            await pool.query(
                'INSERT INTO sctr_monthly_records (month, year, company, policy_number, expiration_date, file_url, personnel_list) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [month, year, company, policy_number, expiration_date, file_url, personnel_list]
            );
            console.log("✅ Registro de SCTR Mayo 2026 (CASA) creado en Postgres (Vercel).");
        }
        
        process.exit(0);
    } catch (e) {
        console.error("❌ Error en sincronización Postgres:", e);
        process.exit(1);
    }
}

syncToPostgres();
