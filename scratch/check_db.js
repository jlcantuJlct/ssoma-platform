const { createClient } = require('@libsql/client');

async function check() {
    const db = createClient({ url: 'file:database.sqlite' });
    try {
        const result = await db.execute("SELECT id, doc_type, month_name FROM report_archives");
        console.log("Archives:", result.rows);
    } catch(e) {
        console.error(e.message);
    }
}
check();
