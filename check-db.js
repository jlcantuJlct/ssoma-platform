const db = require('./lib/db.ts').default;
async function run() {
    const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(tables);
}
run();
