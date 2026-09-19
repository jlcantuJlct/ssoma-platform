const fs = require('fs');
let code = fs.readFileSync('app/inspections/page.tsx', 'utf8');

// 1. Add viewMode state
code = code.replace(
    "const [showDigitalMenu, setShowDigitalMenu] = useState(false);",
    "const [viewMode, setViewMode] = useState<'menu' | 'fisica' | 'digital'>('menu');"
);

// 2. Fix the link in digital inspections
code = code.replace(
    /`\/digital-inspections\/\$\{encodeURIComponent\(mod\.name\)\}`/g,
    "(mod.name.includes('Vehículo') ? '/vehicle-inspections' : `/digital-inspections/${encodeURIComponent(mod.name)}/fill`)"
);

fs.writeFileSync('app/inspections/page.tsx', code);
console.log('Step 1 and 2 done');
