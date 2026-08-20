const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/showProgramModal && \([\s\S]{0,4000}/);
if (match) {
    console.log(match[0]);
} else {
    console.log("Not found");
}
