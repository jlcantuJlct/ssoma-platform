const fs = require('fs');
let code = fs.readFileSync('app/api/levantamiento/[token]/route.ts', 'utf8');

const regex = /body:\s*JSON\.stringify\(\{\s*moduleName:[\s\S]*?comentarioLevantamiento:\s*comentario\s*\}\),/;
const replacement = `body: JSON.stringify({ 
                    moduleName: row.module_name, 
                    template, 
                    answers, 
                    extinguishers: row.module_name === 'Extintores' ? template : undefined, 
                    meta: (row.module_name === 'Extintores' || row.module_name === 'Kit Antiderrame') ? answers : undefined, 
                    isExtinguisherMatrix: row.module_name === 'Extintores', 
                    kits: row.module_name === 'Kit Antiderrame' ? template : undefined,
                    isKitAntiderrameMatrix: row.module_name === 'Kit Antiderrame',
                    saveToDrive: true,
                    fotosDefectos: row.fotos_defectos_json ? JSON.parse(row.fotos_defectos_json) : null,
                    evidenciaLevantamiento: evidence,
                    comentarioLevantamiento: comentario
                }),`;

code = code.replace(regex, replacement);

// Also fix the numRequired logic!
const linesRegex = /const lines = \(row\.description \|\| ''\)\.split\('\\n'\)\.filter\(\(l: string\) => l\.trim\(\)\.length > 0\);/g;
const linesReplacement = `const isKit = row.module_name?.toLowerCase().includes('kit antiderrame');
        const lines = (row.description || '').split(isKit ? '\\n\\n' : '\\n').filter((l: string) => l.trim().length > 0);`;

code = code.replace(linesRegex, linesReplacement);

fs.writeFileSync('app/api/levantamiento/[token]/route.ts', code);
console.log("Patched API route.");
