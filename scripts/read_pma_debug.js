const fs = require('fs');
console.log("Loading pdf-parse...");
try {
    const pdf = require('pdf-parse');
    const filePath = './temp_pma.pdf';
    console.log("Reading local file:", filePath);
    if (fs.existsSync(filePath)) {
        const dataBuffer = fs.readFileSync(filePath);
        console.log("File read. Size:", dataBuffer.length);
        pdf(dataBuffer).then(function (data) {
            console.log("PDF parsed successfully.");
            console.log("----- START TEXT -----");
            console.log(data.text);
            console.log("----- END TEXT -----");
        }).catch(err => {
            console.error("PDF parse error:", err);
        });
    } else {
        console.error("File DOES NOT exist according to fs.");
    }
} catch (e) {
    console.error("Global error:", e);
}
