const fs = require('fs');

let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import BotiquinesCustomForm from '@\/components\/inspections\/BotiquinesCustomForm';\n/, '');

c = c.replace(/    if \(moduleName\.toLowerCase\(\)\.includes\('botiquin'\) \|\| moduleName\.toLowerCase\(\)\.includes\('botiquín'\)\) \{\n        return <BotiquinesCustomForm SignaturePad=\{SignaturePad\} \/>;\n    }\n/, '');

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);

if (fs.existsSync('components/inspections/BotiquinesCustomForm.tsx')) {
    fs.unlinkSync('components/inspections/BotiquinesCustomForm.tsx');
}
console.log("Cleaned up Botiquines routing");
