// Simple test runner for the monthly report logic
const { fetchMonthlyReportData } = require('../lib/reportDataFetch');
const { generateWordReport } = require('../lib/wordGenerator');
const fs = require('fs-extra');
const path = require('path');

// Mocking environment for the test (since lib/db uses process.env)
process.env.POSTGRES_URL = ''; // Force SQLite mode

async function runTest() {
    try {
        console.log("Starting Report Generation Test...");
        const month = 3; // Marzo
        const year = 2026;
        const location = "SAN CLEMENTE";

        const data = await fetchMonthlyReportData(month, year, location);
        console.log("Data fetched successfully for:", data.monthName);
        console.log("Stats:", data.stats);

        const buffer = await generateWordReport(data, true);
        
        const testPath = path.join(process.cwd(), 'Informe_Prueba_Abril_2026.docx');
        await fs.writeFile(testPath, buffer);
        
        console.log("Test report generated at:", testPath);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTest();
