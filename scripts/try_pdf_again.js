const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('temp_pma.pdf');

pdf(dataBuffer).then(function (data) {
    console.log("Number of pages:", data.numpages);
    console.log("Info:", JSON.stringify(data.info));
    console.log("Text snippet (first 1000 chars):");
    console.log(data.text.substring(0, 1000));
}).catch(function (error) {
    console.error("Error parsing PDF:", error);
});
