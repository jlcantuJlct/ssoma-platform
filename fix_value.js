const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const target = `const TextInputWithMic = ({ value, onChange, placeholder, className, isTextArea = false }: any) => {`;
const rep = `const TextInputWithMic = ({ value, onChange, placeholder, className, isTextArea = false }: any) => {
    value = value || '';`;

code = code.replace(target, rep);
fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
console.log('Fixed undefined value in TextInputWithMic');
