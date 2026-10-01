const fs = require('fs');
let c = fs.readFileSync('components/inspections/AlmacenCustomForm.tsx', 'utf8');

c = c.replace(/const \[showSignatureModal, setShowSignatureModal\] = useState\(false\);/, `const [showSignatureModal, setShowSignatureModal] = useState(false);\n    const [activeSignatureField, setActiveSignatureField] = useState<'inspectorFirma'|'responsableFirma'>('inspectorFirma');`);

const modalSaveStr = `setFirmas(prev => ({ ...prev, inspectorFirma: sig }));`;
const newModalSaveStr = `setFirmas(prev => ({ ...prev, [activeSignatureField]: sig }));`;
c = c.replace(modalSaveStr, newModalSaveStr);

fs.writeFileSync('components/inspections/AlmacenCustomForm.tsx', c);
console.log('Fixed signature modal');
