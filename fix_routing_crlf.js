const fs = require('fs');
let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/if\s*\(moduleName\.toLowerCase\(\)\.includes\('botiquin'\)\)\s*\{\s*return\s*<BotiquinCustomForm[^>]*\/>;\s*\}/m, (match) => {
    return match + `\n\n    if (moduleName.toLowerCase().includes('almac')) {\n        return <AlmacenCustomForm />;\n    }`;
});

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log('Registered Almacen form with CRLF tolerance');
