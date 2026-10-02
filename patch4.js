
const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

const regexInspector = /\\{meta\\.firmaInspector \\? \\([\\s\\S]*?\\) : \\(\\s*<SignaturePad onSave=\\{\\(data\\) => setMeta\\(\\{\\.\\.\\.meta, firmaInspector: data\\}\\)\\} \\/>\\s*\\)\\}/g;

code = code.replace(regexInspector, '<SignaturePad onSave={(data) => setMeta({...meta, firmaInspector: data})} />');

const regexResponsable = /\\{meta\\.firmaResponsable \\? \\([\\s\\S]*?\\) : \\(\\s*<SignaturePad onSave=\\{\\(data\\) => setMeta\\(\\{\\.\\.\\.meta, firmaResponsable: data\\}\\)\\} \\/>\\s*\\)\\}/g;

code = code.replace(regexResponsable, '<SignaturePad onSave={(data) => setMeta({...meta, firmaResponsable: data})} />');

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log('patched signatures');

