const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const oldParse = `const text = await driveRes.text();
                const driveData = JSON.parse(text);
                if (driveData.result === 'success') {
                    driveUrl = driveData.url || driveData.viewLink || '';
                }`;

const newParse = `const text = await driveRes.text();
                try {
                    const driveData = JSON.parse(text);
                    if (driveData.result === 'success') {
                        driveUrl = driveData.url || driveData.viewLink || '';
                    } else {
                        console.error('Drive script error:', driveData);
                    }
                } catch (err) {
                    console.error('Error parsing Drive response. It might be an HTML error page due to size limits:', err.message);
                }`;

code = code.replace(oldParse, newParse);
fs.writeFileSync(path, code);
console.log("Patched JSON.parse for driveRes!");
