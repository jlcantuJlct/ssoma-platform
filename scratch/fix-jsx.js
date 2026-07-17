const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// 1. Add <> after `{isReadyToGenerate && tags.length > 0 && (`
code = code.replace(
    /\{isReadyToGenerate && tags\.length > 0 && \(\s*<button/g,
    '{isReadyToGenerate && tags.length > 0 && (\n                        <>\n                        <button'
);

// 2. Add </> before `)}` at the end of the block
code = code.replace(
    /Empezar Nuevo Mes \(Limpiar Todo\)\s*<\/button>\s*\)\}/g,
    'Empezar Nuevo Mes (Limpiar Todo)\n                        </button>\n                        </>\n                    )}'
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
