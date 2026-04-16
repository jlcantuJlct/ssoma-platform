const db = require('../lib/db').default;

const normalizeTag = (str) => {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9]/g, '_') 
        .replace(/_+/g, '_') 
        .replace(/^_|_$/g, ''); 
};

async function run() {
    try {
        const rows = await db.fetchAll('SELECT DISTINCT activity FROM evidence_center_records WHERE activity IS NOT NULL');
        console.log("---- TUS ETIQUETAS MAGICAS PARA EL WORD ----");
        rows.forEach(r => {
            const tag = normalizeTag(r.activity);
            console.log(`Actividad original: "${r.activity}"`);
            console.log(`Escribe esto en Word:\n{#${tag}}\n{%url}\n{/${tag}}\n`);
        });
        console.log("-------------------------------------------");
    } catch(e) {
        console.error(e);
    }
}
run();
