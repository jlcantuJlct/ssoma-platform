const { default: db } = require('./lib/db.ts');

async function run() {
    try {
        await db.execute("UPDATE inspection_modules SET status = 'active' WHERE name = 'Botiquines'");
        console.log('Botiquines activado exitosamente en DB');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
