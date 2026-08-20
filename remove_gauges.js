const fs = require('fs');

let file = 'C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/inspections/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove state
content = content.replace(
    'const [showGoals, setShowGoals] = useState(true);\n',
    ''
);

// 2. Remove import
content = content.replace(
    "import { ComplianceGauge } from '@/components/dashboard/ComplianceGauge';\n",
    ""
);

// 3. Remove toggle button
const buttonRegex = /<button\s+onClick=\{\(\) => setShowGoals\(!showGoals\)\}[\s\S]*?<\/button>/;
content = content.replace(buttonRegex, '');

// 4. Remove toggle button logic from Metas Manuales
content = content.replace(
    'onClick={() => { setShowQuotaSettings(!showQuotaSettings); setShowGoals(true); }}',
    'onClick={() => { setShowQuotaSettings(!showQuotaSettings); }}'
);

// 5. Remove the actual Gauges section
const sectionRegex = /\{\/\* SECTION: METAS Y AVANCE \(3D Gauges\) - REPOSICIONADO \*\/\}\s*\{showGoals && \([\s\S]*?\}\)/;
content = content.replace(sectionRegex, '');

fs.writeFileSync(file, content);
console.log('Removed gauges and related code!');
