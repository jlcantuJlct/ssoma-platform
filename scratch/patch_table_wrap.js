const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the table
content = content.replace(
    '<table className="w-full text-left text-[10px]">',
    '<div className="overflow-x-auto w-full"><table className="w-full text-left text-[10px] min-w-[400px]">'
);

// We need to replace the VERY NEXT </table> after min-w-[400px].
const tableStartIdx = content.indexOf('min-w-[400px]');
if (tableStartIdx !== -1) {
    const tableEndIdx = content.indexOf('</table>', tableStartIdx);
    if (tableEndIdx !== -1) {
        content = content.substring(0, tableEndIdx) + '</table></div>' + content.substring(tableEndIdx + 8);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed table wrapping.');
