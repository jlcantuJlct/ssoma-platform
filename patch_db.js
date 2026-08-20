require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete all non-permanent CCs
    await client.query('DELETE FROM notification_contacts WHERE is_permanent_cc = false');

    const newContacts = [
      { name: 'Roberto Cabezas', email: 'rcabezas@casacontratistas.com', area: 'Equipos' },
      { name: 'Javier Alvarado', email: 'jalvarado@casacontratistas.com', area: 'Almacén' },
      { name: 'J. Espinoza', email: 'jespinoza@casacontratistas.com', area: 'Almacén' },
      { name: 'M. Taipe', email: 'mtaipe@casacontratistas.com', area: 'Mantenimiento Rutinario' },
      { name: 'Richard Bayona', email: 'richard_bayona05@hotmail.com', area: 'Mantenimiento Periódico' },
      { name: 'Edwin Pastor', email: 'epastor@casacontratistas.com', area: 'Señalización' },
      { name: 'Luis Mamani', email: 'lmamani@casacontratistas.com', area: 'Movimiento de Tierras' },
      { name: 'Marcus Escobar', email: 'mescobar@casacontratistas.com', area: 'Obras de Arte' },
      { name: 'Jose Parodi', email: 'jparodi@casacontratistas.com', area: 'Administración' },
      { name: 'Jose Luis Cancino', email: 'jcancino@casacontratistas.com', area: 'SSTMA' },
      { name: 'Adrian Suarez', email: 'adrian142005@hotmail.com', area: 'SSTMA' }
    ];

    for (const c of newContacts) {
      await client.query(
        'INSERT INTO notification_contacts (name, email, area, is_permanent_cc) VALUES ($1, $2, $3, false)',
        [c.name, c.email, c.area]
      );
    }

    await client.query('COMMIT');
    console.log("Database updated successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
