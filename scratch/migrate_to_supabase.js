const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const neonUrl = process.env.POSTGRES_URL;
const supabaseUrl = "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres";

if (!neonUrl) {
    console.error("ERROR: POSTGRES_URL not found in .env.local!");
    process.exit(1);
}

async function migrate() {
    const neonClient = new Client({
        connectionString: neonUrl,
        ssl: { rejectUnauthorized: false }
    });
    
    const supabaseClient = new Client({
        connectionString: supabaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to databases...");
        await neonClient.connect();
        console.log("Connected to Neon (Source).");
        await supabaseClient.connect();
        console.log("Connected to Supabase (Destination).");

        // 1. Get all tables in Neon
        const tablesRes = await neonClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to migrate:`, tables);

        for (const tableName of tables) {
            console.log(`\n--------------------------------------------`);
            console.log(`Migrating table: ${tableName}`);

            // 2. Fetch column definitions and primary keys from Neon
            const colsRes = await neonClient.query(`
                SELECT 
                    c.column_name, 
                    c.data_type, 
                    c.is_nullable, 
                    c.column_default,
                    c.character_maximum_length,
                    (SELECT count(*) 
                     FROM information_schema.table_constraints tc 
                     JOIN information_schema.key_column_usage kcu 
                       ON tc.constraint_name = kcu.constraint_name 
                      AND tc.table_schema = kcu.table_schema
                     WHERE tc.constraint_type = 'PRIMARY KEY' 
                       AND tc.table_name = c.table_name 
                       AND kcu.column_name = c.column_name) as is_primary
                FROM information_schema.columns c
                WHERE c.table_schema = 'public' AND c.table_name = $1
                ORDER BY c.ordinal_position
            `, [tableName]);

            // 3. Construct DDL (CREATE TABLE)
            const columnDefs = [];
            let serialColumn = null;

            for (const col of colsRes.rows) {
                const name = `"${col.column_name}"`;
                let type = col.data_type;
                let defaultStr = "";
                const isPrimary = parseInt(col.is_primary) > 0;
                
                // Handle character varying length
                if (type === 'character varying' && col.character_maximum_length) {
                    type = `character varying(${col.character_maximum_length})`;
                }

                // Check for auto-increment / sequence
                const isSerial = col.column_default && col.column_default.includes('nextval');

                if (isSerial) {
                    if (col.data_type === 'bigint') {
                        type = 'BIGSERIAL';
                    } else {
                        type = 'SERIAL';
                    }
                    serialColumn = col.column_name;
                } else if (col.column_default) {
                    defaultStr = ` DEFAULT ${col.column_default}`;
                }

                const nullableStr = col.is_nullable === 'NO' ? ' NOT NULL' : '';
                const primaryStr = isPrimary ? ' PRIMARY KEY' : '';

                columnDefs.push(`${name} ${type}${nullableStr}${defaultStr}${primaryStr}`);
            }

            const ddl = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columnDefs.join(',\n  ')}\n);`;
            console.log(`Generated DDL for ${tableName}:\n${ddl}`);

            // 4. Create table in Supabase
            await supabaseClient.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
            await supabaseClient.query(ddl);
            console.log(`Table "${tableName}" created in Supabase.`);

            // 5. Fetch all rows from Neon
            const dataRes = await neonClient.query(`SELECT * FROM "${tableName}"`);
            const rows = dataRes.rows;
            console.log(`Fetched ${rows.length} rows from Neon.`);

            if (rows.length > 0) {
                // Get all column names
                const columns = Object.keys(rows[0]);
                const colsFormatted = columns.map(c => `"${c}"`).join(', ');

                // We will batch insert rows in chunks of 100 to avoid query size limits
                const batchSize = 100;
                for (let i = 0; i < rows.length; i += batchSize) {
                    const batch = rows.slice(i, i + batchSize);
                    
                    const valueParams = [];
                    const valuesList = [];
                    let valIndex = 1;

                    for (const row of batch) {
                        const vals = [];
                        for (const col of columns) {
                            vals.push(`$${valIndex++}`);
                            valueParams.push(row[col]);
                        }
                        valuesList.push(`(${vals.join(', ')})`);
                    }

                    const insertQuery = `INSERT INTO "${tableName}" (${colsFormatted}) VALUES ${valuesList.join(', ')}`;
                    await supabaseClient.query(insertQuery, valueParams);
                }
                console.log(`Successfully migrated ${rows.length} rows to "${tableName}" in Supabase.`);
            }

            // 6. Reset sequence if table has a SERIAL column
            if (serialColumn) {
                const seqQuery = `
                    SELECT setval(
                        pg_get_serial_sequence('"${tableName}"', '${serialColumn}'), 
                        COALESCE(max("${serialColumn}"), 1)
                    ) FROM "${tableName}"
                `;
                await supabaseClient.query(seqQuery);
                console.log(`Sequence reset for table "${tableName}" on column "${serialColumn}".`);
            }
        }

        console.log("\n============================================");
        console.log("SUCCESS: Database migration completed successfully!");
        console.log("============================================");

    } catch (e) {
        console.error("\nFATAL ERROR DURING MIGRATION:", e);
    } finally {
        await neonClient.end();
        await supabaseClient.end();
    }
}

migrate();
