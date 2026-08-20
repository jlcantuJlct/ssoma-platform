const fs = require('fs');

let file = 'C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/epp/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix handleFileUpload to accept files directly or event
content = content.replace(
    /const handleFileUpload = async \(e: any\) => \{[\s\S]*?if \(!inputFiles \|\| inputFiles\.length === 0\) return;/g,
    `const handleFileUpload = async (e: any, droppedFiles?: FileList | File[]) => {
        let inputFiles = droppedFiles || e?.target?.files;
        if (!inputFiles || inputFiles.length === 0) return;`
);

// Remove the blocking alert for missing responsible/location
content = content.replace(
    /if \(!form\.responsible \|\| !form\.location\) \{[\s\S]*?return;\n        \}/g,
    `// Permite subir sin responsable/lugar, usaremos valores por defecto temporales`
);

// Update uploadEvidence call to use fallbacks
content = content.replace(
    /form\.responsible\.replace\(\/\\s\+\/g, '_'\)/g,
    `(form.responsible || 'Sin_Asignar').replace(/\\s+/g, '_')`
);
content = content.replace(
    /form\.responsible,/g,
    `form.responsible || 'Sin Asignar',`
);
content = content.replace(
    /form\.location,/g,
    `form.location || 'Sin Especificar',`
);

// Fix the onDrop handler to actually pass files to handleFileUpload
content = content.replace(
    /onDrop=\{\(e\) => \{ e\.preventDefault\(\); setIsDragging\(false\); \}\}/g,
    `onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFileUpload(null, e.dataTransfer.files); } }}`
);

fs.writeFileSync(file, content);
