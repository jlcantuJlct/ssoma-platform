const fs = require('fs');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

const xmlData = fs.readFileSync('temp_unzip/word/document.xml', 'utf8');
const result = XMLValidator.validate(xmlData);

if (result === true) {
    console.log("XML is perfectly valid!");
} else {
    console.log("XML is INVALID:", result);
}
