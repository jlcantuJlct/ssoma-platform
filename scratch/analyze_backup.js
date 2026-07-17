const fs = require('fs');
const data = JSON.parse(fs.readFileSync('rescate_2026_final.json', 'utf8'));
console.log("Keys in backup:", Object.keys(data));
if (data['desvio_evidence_records']) {
    console.log(`Found ${data['desvio_evidence_records'].length} records in desvio_evidence_records.`);
    
    // Check months
    const counts = {};
    for (let r of data['desvio_evidence_records']) {
        let month = r.date ? r.date.substring(0, 7) : 'Unknown';
        counts[month] = (counts[month] || 0) + 1;
    }
    console.log("Records per month:", counts);
}
