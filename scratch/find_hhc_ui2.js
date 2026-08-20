const fs = require('fs');
const lines = fs.readFileSync('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx', 'utf8').split('\n');

const res = lines.map((line, idx) => ({ line, idx })).filter(item => item.line.includes('Herramienta') || item.line.includes('Horas Hombre') || item.line.includes('HHC') || item.line.includes('hhc'));

res.slice(50, 100).forEach(item => {
    console.log(`${item.idx + 1}: ${item.line.trim()}`);
});
