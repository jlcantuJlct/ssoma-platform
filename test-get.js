const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sanitizeValue(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        if (val.label !== undefined) return sanitizeValue(val.label);
        if (val.id !== undefined) return sanitizeValue(val.id);
        if (val.name !== undefined) return sanitizeValue(val.name);
        return JSON.stringify(val);
    }
    return String(val);
}

async function run() {
    try {
        const res = await pool.query('SELECT * FROM inspection_records ORDER BY date DESC');
        
        const mapped = res.rows.map(r => {
            let parsedImgs = [];
            try {
                parsedImgs = r.evidence_imgs ? JSON.parse(r.evidence_imgs) : [];
                if (!Array.isArray(parsedImgs)) parsedImgs = [];
            } catch (e) {
                parsedImgs = [];
            }
            return {
                id: Number(r.id),
                date: sanitizeValue(r.date),
                responsible: sanitizeValue(r.responsible),
                inspectionType: sanitizeValue(r.inspection_type),
                area: sanitizeValue(r.area),
                zone: sanitizeValue(r.zone),
                status: sanitizeValue(r.status),
                observations: sanitizeValue(r.observations),
                evidencePdf: r.evidence_pdf || '',
                evidenceImgs: parsedImgs
            };
        });

        console.log("Success! Mapped count:", mapped.length);
        process.exit(0);
    } catch(err) {
        console.error("CAUGHT ERROR:", err);
        process.exit(1);
    }
}
run();
