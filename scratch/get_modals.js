const fs=require('fs');
const txt=fs.readFileSync('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx','utf8');
const m = txt.match(/<div className="fixed inset-0[^>]*>/g);
console.log(m);
