const db = require('better-sqlite3')('ssoma.db');

const getStats = (tipoFilter) => {
    let query = `
        SELECT 
            area,
            COUNT(*) as n_cap,
            SUM(CAST(hhc as REAL)) as horas_cap
        FROM hhc_records
        WHERE date >= '2026-01-01' AND date <= '2026-03-31'
    `;
    
    if (tipoFilter) {
        query += ` AND tipo = '${tipoFilter}'`;
    }
    
    query += ` GROUP BY area`;
    
    return db.prepare(query).all();
};

console.log('--- SOLO TIPO = capacitacion ---');
console.log(getStats('capacitacion'));

console.log('--- TODOS LOS TIPOS (charla, capacitacion, etc) ---');
console.log(getStats());
