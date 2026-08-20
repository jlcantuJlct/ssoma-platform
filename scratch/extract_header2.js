const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
const content = fs.readFileSync(path, 'utf8');

// We want to find the section near "Actividades Programadas"
const startStr = `<h4 className="text-sm font-bold text-blue-400">Actividades Programadas</h4>`;
const index = content.indexOf(startStr);
if (index !== -1) {
    console.log(content.substring(index - 200, index + 3000));
}
