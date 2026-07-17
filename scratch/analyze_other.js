const fs = require('fs');

function checkFile(filename) {
    if (fs.existsSync(filename)) {
        try {
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            console.log(`\n--- ${filename} ---`);
            if (Array.isArray(data)) {
                console.log(`Array length: ${data.length}`);
                if (data.length > 0) console.log("Keys of first item:", Object.keys(data[0]));
            } else {
                console.log("Keys:", Object.keys(data));
                if (data['desvio_evidence_records']) {
                    console.log(`Found ${data['desvio_evidence_records'].length} records in desvio_evidence_records.`);
                }
            }
        } catch(e) {
            console.log(`\n--- ${filename} ---`);
            console.log("Error parsing or not an array/object", e.message);
        }
    }
}

checkFile('scratch/data.json');
checkFile('scratch/excel_dump.json');
checkFile('public/data.csv');
