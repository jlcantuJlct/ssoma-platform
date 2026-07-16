const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = envFile.match(/POSTGRES_URL="?([^"\n]+)"?/);
    if (!urlMatch) {
        console.error("No POSTGRES_URL in .env.local");
        return;
    }
    const url = urlMatch[1].replace('5432', '6543');

    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const initialStock = [
        { qty: 300, unit: 'PAR', name: 'Guantes de Badana - Color: Amarillo - Marca: Vulkan' },
        { qty: 150, unit: 'UNIDAD', name: 'Buzo Descartable - Modelo: Safeguard - Talla: L' },
        { qty: 230, unit: 'UNIDAD', name: 'Buzo Descartable - Modelo: Safeguard - Talla: XL' },
        { qty: 18, unit: 'PAR', name: 'Filtro 2091 - Modelo: P100 (Partículas) - Marca: 3M' },
        { qty: 178, unit: 'UNIDAD', name: 'Tapón de Oído con Estuche - Mod: Elite Verde - Marca: Clute' },
        { qty: 182, unit: 'UNIDAD', name: 'Cortavientos - Modelo 1 Cara - Tela: Drill Naranja' },
        { qty: 61, unit: 'PAR', name: 'Guantes de Jebe Calibre 35 - Modelo: Protec - Clute - Talla: 9' },
        { qty: 60, unit: 'UNIDAD', name: 'Suspensión de Cinta Nylon Rachet Acolchada - Marca: Spro' },
        { qty: 4, unit: 'PAR', name: 'Botas P. de Acero PVC - Marca: Segusa - Mod: Xtreme - T.43' },
        { qty: 3, unit: 'PAR', name: 'Botas P. de Acero PVC - Marca: Segusa - Mod: Xtreme - T.44' },
        { qty: 4, unit: 'UNIDAD', name: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: M' },
        { qty: 4, unit: 'UNIDAD', name: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: L' },
        { qty: 3, unit: 'UNIDAD', name: 'Chaleco de Drill - Mod. Capataz - Color: Naranja - Talla: XL' },
        { qty: 11, unit: 'PAR', name: 'Filtro 2097 - Modelo: P100 (Partículas y V/Orgánicos) - 3M' },
        { qty: 100, unit: 'PAR', name: 'Guantes Anticorte - R. P. Nitrilo - Cut 5 - Marca: Vulkan' },
        { qty: 200, unit: 'UNIDAD', name: 'Anteojos Modelo: Spider HC - Marca: Spro - Lunas: Claras' },
        { qty: 380, unit: 'UNIDAD', name: 'Anteojos Modelo: Spider HC - Marca: Spro - Lunas: Oscuras' },
        { qty: 10, unit: 'UNIDAD', name: 'Respirador Media Cara - Modelo: 7502 - Marca: 3M' },
        { qty: 10, unit: 'PAR', name: 'Filtro 2096 - Modelo: P100 (Gases Ácidos) - Marca: 3M' },
        { qty: 8, unit: 'CAJA', name: 'Respirador N95 - Modelo: 8210 - Marca: 3M (20 Unidades)' },
        { qty: 10, unit: 'PAR', name: 'Guante de Neoprene Corrugado 14" - Marca: Galaxy' },
        { qty: 19, unit: 'PAR', name: 'Guantes de Nitrilo con Puño Tejido - Mod.: Nitro - Marca: Spro' },
        { qty: 14, unit: 'PAR', name: 'Guantes de Nitrilo 13" - Mod. Tychem NT480 - Marca: Dupont' },
        { qty: 4, unit: 'CAJA', name: 'Guante de Nitrilo Descartable Touch N Tuff 92-600 - Ansell E.' }
    ];

    const date = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);

    // Create table if not exists in PG
    await client.query(`
        CREATE TABLE IF NOT EXISTS epp_inventory_log (
            id SERIAL PRIMARY KEY,
            type VARCHAR(10) NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            quantity INT NOT NULL,
            date VARCHAR(20) NOT NULL,
            month VARCHAR(20) NOT NULL,
            responsible VARCHAR(150),
            location VARCHAR(200),
            description TEXT,
            files JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    for (const item of initialStock) {
        await client.query(
            `INSERT INTO epp_inventory_log (type, item_name, unit, quantity, date, month, responsible, location, description, files)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                'IN',
                item.name,
                item.unit,
                item.qty,
                date,
                month,
                'Sistema',
                'Almacén Principal',
                'Carga inicial de stock (Migración)',
                '[]'
            ]
        );
    }

    console.log('Stock inicial cargado correctamente en Postgres.');
    await client.end();
}

run().catch(console.error);
