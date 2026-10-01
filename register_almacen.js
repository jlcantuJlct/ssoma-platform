const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

if (!c.includes('AlmacenCustomForm')) {
    c = c.replace(/import MachineryCustomForm from '@\/components\/inspections\/MachineryCustomForm';/, `import MachineryCustomForm from '@/components/inspections/MachineryCustomForm';\nimport AlmacenCustomForm from '@/components/inspections/AlmacenCustomForm';`);
    
    // Add case to the switch
    const caseStr = `if (moduleName.includes('botiquin')) {
            return <BotiquinCustomForm />
        }`;
    const newCaseStr = `if (moduleName.includes('botiquin')) {
            return <BotiquinCustomForm />
        }
        if (moduleName.includes('almac')) {
            return <AlmacenCustomForm />
        }`;
    c = c.replace(caseStr, newCaseStr);
    
    fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
    console.log('Registered AlmacenCustomForm');
} else {
    console.log('Already registered');
}
