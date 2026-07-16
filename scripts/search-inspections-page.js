const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'app', 'inspections', 'page.tsx');
if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    console.log("Found app/inspections/page.tsx. Searching for references to program, monthly, or DB...");
    lines.forEach((line, idx) => {
        if (line.includes('fetch') || line.includes('monthly') || line.includes('program') || line.includes('db')) {
            console.log(`Line ${idx+1}: ${line.trim()}`);
        }
    });
} else {
    console.log("app/inspections/page.tsx does not exist.");
}
