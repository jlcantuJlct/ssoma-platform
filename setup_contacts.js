require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL.replace('5432', '6543'),
    ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Creating table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        area TEXT,
        is_permanent_cc BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Clearing old data...");
  await pool.query(`DELETE FROM notification_contacts`);

  const contacts = [
    { name: 'Rodolfo Guerra', email: 'rguerra@casacontratistas.com', area: 'Gerencia Vial', cc: true },
    { name: 'Jose Parodi', email: 'jparodi@casacontratistas.com', area: 'Administración', cc: true },
    { name: 'Marcus Escobar', email: 'mescobar@casacontratistas.com', area: 'Residencia', cc: true },
    { name: 'Javier Uculmana', email: 'juculmana@casacontratistas.com', area: 'RRHH', cc: true },
    { name: 'Javier Alvarado', email: 'jalvarado@casacontratistas.com', area: 'Almacén', cc: false },
    { name: 'Roberto Cabezas', email: 'rcabezas@casacontratistas.com', area: 'Equipos', cc: false },
    { name: 'Cristhian Altamirano', email: 'caltamirano@casacontratistas.com', area: 'Equipos', cc: false },
    { name: 'M. Taipe', email: 'mtaipe@casacontratistas.com', area: 'Mantenimiento rutinario', cc: false },
    { name: 'Richard Bayona', email: 'richard_bayona05@hotmail.com', area: 'Mantenimiento periódico', cc: false },
    { name: 'Adrian Suares', email: 'adrian142005@hotmail.com', area: 'Prevención SSOMA', cc: false },
    { name: 'Edwin Pastor', email: 'epastor@casacontratistas.com', area: 'Señalización', cc: false },
    { name: 'Luis Mamani', email: 'lmamani@casacontratistas.com', area: 'PAD San Clemente', cc: false },
    { name: 'Luis Mamani', email: 'lmamani@casacontratistas.com', area: 'Chancadora', cc: false },
    { name: 'Luis Mamani', email: 'lmamani@casacontratistas.com', area: 'DME', cc: false }
  ];

  for (const c of contacts) {
    await pool.query(
      `INSERT INTO notification_contacts (name, email, area, is_permanent_cc) VALUES ($1, $2, $3, $4)`,
      [c.name, c.email, c.area, c.cc]
    );
  }
  
  console.log("Inserted " + contacts.length + " records!");
  process.exit(0);
}

run().catch(console.error);
