const fs = require('fs');

let c = fs.readFileSync('app/digital-inspections/[module]/fill/page.tsx', 'utf8');

c = c.replace(/import \{ BotiquinCustomForm \} from '@\/components\/inspections\/BotiquinCustomForm';/, `import BotiquinCustomForm from '@/components/inspections/BotiquinCustomForm';`);
c = c.replace(/<BotiquinCustomForm moduleName=\{moduleName\} version=\{version\} SignaturePad=\{SignaturePad\} \/>/, `<BotiquinCustomForm SignaturePad={SignaturePad} />`);

fs.writeFileSync('app/digital-inspections/[module]/fill/page.tsx', c);
console.log("Updated router");
