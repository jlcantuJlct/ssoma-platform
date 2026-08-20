const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
const content = fs.readFileSync(path, 'utf8');

const regex = /(<div className="flex justify-between items-center mb-4">[\s\S]*?)<div className="flex-1 overflow-y-auto/g;
let match;
while ((match = regex.exec(content)) !== null) {
    if (match[0].includes('Importar Excel')) {
        console.log(match[0].substring(0, 3000));
        break;
    }
}
