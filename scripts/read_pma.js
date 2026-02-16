const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = 'c:\\Users\\LENOVO\\Desktop\\MEIA\\MEIA OBRAS ADICIONALES RV6 V02\\13. PMA v02 OBRAS ADICIONALES.pdf';

try {
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer).then(function (data) {
        console.log(data.text);
    }).catch(function (error) {
        console.error("Error parsing PDF:", error);
    });
} catch (err) {
    console.error("Error reading file:", err);
}
