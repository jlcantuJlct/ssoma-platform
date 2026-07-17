const { Pool } = require('pg');
const JSZip = require('jszip');

const pool = new Pool({
    connectionString: 'postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.time('DB_DUMP');
    const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    const tables = res.rows.map(r => r.table_name);
    
    const zip = new JSZip();
    let totalRows = 0;

    for (const table of tables) {
        const data = await pool.query(`SELECT * FROM ${table}`);
        totalRows += data.rows.length;
        if (data.rows.length === 0) continue;
        
        const keys = Object.keys(data.rows[0]);
        const header = keys.join(',') + '\n';
        const body = data.rows.map(r => keys.map(k => {
            let val = r[k];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') val = JSON.stringify(val);
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')).join('\n');
        
        zip.file(`${table}.csv`, header + body);
    }

    const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
    console.timeEnd('DB_DUMP');
    console.log(`Total tables: ${tables.length}, Total rows: ${totalRows}, Zip Base64 size: ${(base64.length/1024).toFixed(2)} KB`);

    await pool.end();
}
main().catch(console.error);
