const fs = require('fs');
const path = require('path');

function printFile(filename) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File ${filename} does not exist.`);
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf16le');
        console.log(`=== ${filename} ===`);
        console.log(content);
    } catch (e) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`=== ${filename} (utf8) ===`);
            console.log(content);
        } catch (e2) {
            console.error(`Error reading ${filename}:`, e2.message);
        }
    }
}

printFile('errors.log');
printFile('build.log');
