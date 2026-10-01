const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('ssoma.db');
db.get("SELECT token FROM hallazgo_levantamientos ORDER BY id DESC LIMIT 1", (err, row) => {
    if (row) {
        console.log("Token:", row.token);
        fetch(`http://localhost:3000/api/levantamiento/${row.token}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({evidence: '{"test":"base64"}', comentario: 'test'})
        }).then(r => r.json()).then(console.log).catch(console.error);
    }
});
