const fs = require('fs');
const path = require('path');
const { XMLValidator } = require('fast-xml-parser');

function findXmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findXmlFiles(filePath, fileList);
        } else if (filePath.endsWith('.xml') || filePath.endsWith('.rels')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const allFiles = findXmlFiles('temp_unzip');
let allValid = true;

for (const file of allFiles) {
    const data = fs.readFileSync(file, 'utf8');
    const result = XMLValidator.validate(data);
    if (result !== true) {
        console.log(`❌ INVALID XML IN: ${file}`);
        console.log(result);
        allValid = false;
    }
}

if (allValid) {
    console.log("✅ All XML and .rels files are valid!");
}
