const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

c = c.replace(/const \[showSignatureModal, setShowSignatureModal\] = useState\(false\);\n/, '');
c = c.replace(/const \[activeSignatureField, setActiveSignatureField\] = useState<'inspectorFirma' \| 'responsableFirma'>\('inspectorFirma'\);\n/, '');

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Cleaned up modal states');
