const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

code = code.replace(
    'const handleClearDraft = async () => {', 
    'const handleClearDraft = async () => {\n        const p = prompt("Clave para borrar:");\n        if (p !== "161976") { alert("Clave incorrecta"); return; }\n'
);

code = code.replace(
    '<Eye size={16} className="text-white" />', 
    '<Eye size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Ver</span>'
);

code = code.replace(
    '<Upload size={16} className="text-white" />', 
    '<Upload size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Actualizar</span>'
);

code = code.replace(
    '<Trash2 size={16} className="text-white" />', 
    '<Trash2 size={16} className="text-white" /> <span className="text-white text-xs font-medium ml-1">Eliminar</span>'
);

// We should also adjust the width of the buttons to look better with text.
code = code.replace(/className="p-2 rounded-lg/g, 'className="px-3 py-2 rounded-lg');

fs.writeFileSync('app/generador-informes/page.tsx', code);
