const fs = require('fs');

let page = fs.readFileSync('app/levantamiento/[token]/page.tsx', 'utf8');

page = page.replace(
    /const \[driveUrl, setDriveUrl\] = useState\(''\);/,
    `const [driveUrl, setDriveUrl] = useState('');\n    const [fileBase64, setFileBase64] = useState('');`
);

page = page.replace(
    /setDriveUrl\(data\.driveUrl \|\| ''\);/g,
    `setDriveUrl(data.driveUrl || '');\n                setFileBase64(data.fileBase64 || '');`
);

// We add the download button right after the Ver Reporte button
page = page.replace(
    /\{driveUrl && \([\s\S]*?<\/a>\s*\)\}/m,
    `$&
                        {fileBase64 && (
                            <button onClick={() => {
                                const link = document.createElement('a');
                                link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + fileBase64;
                                link.download = 'Reporte_Levantamiento.xlsx';
                                link.click();
                            }} className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5 justify-center w-full bg-emerald-50 py-3 rounded-xl border border-emerald-100 mb-3">
                                ⬇️ Descargar Excel
                            </button>
                        )}`
);

fs.writeFileSync('app/levantamiento/[token]/page.tsx', page);
console.log("Updated levantamiento UI");
