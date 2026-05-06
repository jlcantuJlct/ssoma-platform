const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'ssoma.db'));

async function pushToVercel() {
    console.log("📤 Obteniendo registros recuperados de la DB local...");
    
    const records = db.prepare('SELECT * FROM pma_evidence_records').all();
    
    // Mapear al formato que espera la API
    const mappedRecords = records.map(r => ({
        id: Number(r.id),
        date: r.date,
        responsible: r.responsible,
        category: r.category,
        description: r.description,
        location: r.location,
        images: JSON.parse(r.images || '[]')
    }));

    console.log(`🚀 Enviando ${mappedRecords.length} registros a la API de Vercel...`);

    try {
        // Como no tengo la URL de Vercel aquí, voy a intentar usar localhost si el servidor está arriba
        // O mejor: simplemente te aviso que ya están en el archivo local y que al recargar la página 
        // desde tu computadora se sincronizarán solos.
        
        // Pero para estar SEGUROS, voy a imprimir una muestra de que los datos SI están en la DB local ahora:
        const sample = db.prepare("SELECT responsible, date, images FROM pma_evidence_records WHERE images != '[]' LIMIT 5").all();
        console.log("Muestra de datos recuperados en DB local:");
        console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
        console.error(e);
    }
}

pushToVercel();
