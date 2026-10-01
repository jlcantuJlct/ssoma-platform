const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import MachineryCustomForm from '@\/components\/inspections\/MachineryCustomForm';/g, "import MachineryCustomForm from '@/components/inspections/MachineryCustomForm';\nimport AlmacenCustomForm from '@/components/inspections/AlmacenCustomForm';");

const regex = /if \(moduleName\.toLowerCase\(\)\.includes\('botiquin'\)\) \{[\s\S]*?return <BotiquinCustomForm[\s\S]*?\}/m;

c = c.replace(regex, (match) => {
    return match + `\n\n    if (moduleName.toLowerCase().includes('almac')) {\n        return <AlmacenCustomForm />;\n    }`;
});

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Fixed routing via regex');
