const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

code = code.replace(
    "{ ...t, file: undefined, preview: undefined, value: '' }",
    "{ ...t, file: undefined, preview: undefined, value: '', remoteUrl: undefined, uploaderInitials: undefined, uploaderName: undefined }"
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched clearTag to remove remoteUrl and initials");
