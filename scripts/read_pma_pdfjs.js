const fs = require('fs');
try {
    // Try legacy build for Node.js
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    const dataBuffer = fs.readFileSync('temp_pma.pdf');
    const uint8Array = new Uint8Array(dataBuffer);

    const loadingTask = pdfjsLib.getDocument(uint8Array);
    loadingTask.promise.then(function (pdf) {
        console.log('PDF loaded. Pages:', pdf.numPages);
        let maxPages = Math.min(pdf.numPages, 20); // Read first 20 pages first to test
        let countPromises = [];
        for (let j = 1; j <= maxPages; j++) {
            let page = pdf.getPage(j);
            countPromises.push(page.then(function (page) {
                return page.getTextContent().then(function (textContent) {
                    return textContent.items.map(function (s) { return s.str; }).join(' ');
                });
            }));
        }
        // Wait for all pages and join text
        return Promise.all(countPromises).then(function (texts) {
            console.log('----- TEXT CONTENT -----');
            console.log(texts.join('\n\n--- PAGE BREAK ---\n\n'));
            console.log('----- END CONTENT -----');
        });
    }, function (reason) {
        console.error('Error loading PDF:', reason);
    });
} catch (e) {
    console.error("Setup error:", e);
}
