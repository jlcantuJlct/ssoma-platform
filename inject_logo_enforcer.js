const fs = require('fs');
let code = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const logoSnippet = `
        const officialLogoPath = path.join(process.cwd(), 'public', 'templates', 'digital', 'official_casa_logo.png');
        if (fs.existsSync(officialLogoPath) && worksheet) {
            try {
                worksheet._media = [];
                const logoBuffer = fs.readFileSync(officialLogoPath);
                const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
                worksheet.addImage(logoId, {
                    tl: { col: 0, row: 0 },
                    ext: { width: 140, height: 48 },
                    editAs: 'oneCell'
                });
            } catch (e) {
                console.error('Error aplicando logo oficial CASA:', e);
            }
        }
`;

if (!code.includes('officialLogoPath')) {
    code = code.replace(
        'worksheet = workbook.worksheets[0];',
        'worksheet = workbook.worksheets[0];\n' + logoSnippet
    );
    fs.writeFileSync('app/api/export-excel/route.ts', code);
    console.log('Successfully injected automatic official logo enforcement into export-excel route!');
} else {
    console.log('Already injected.');
}
