const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// Change overlay alignment from center to top (start) and add padding
code = code.replace(
    'className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5"',
    'className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-start gap-1.5 pt-4 pb-2"'
);

// We want to remove the text inside the buttons to make them really tiny
// Ver button
code = code.replace(
    '<Eye size={14} className="text-white" /> <span className="text-white text-[10px] font-medium ml-1">Ver</span>',
    '<Eye size={14} className="text-white" />'
);

// Actualizar button
code = code.replace(
    '<Upload size={14} className="text-white" /> <span className="text-white text-[10px] font-medium ml-1">Actualizar</span>',
    '<Upload size={14} className="text-white" />'
);

// Eliminar button
code = code.replace(
    '<Trash2 size={14} className="text-white" /> <span className="text-white text-[10px] font-medium ml-1">Eliminar</span>',
    '<Trash2 size={14} className="text-white" />'
);

// Optional: make the button padding even smaller
code = code.replaceAll('px-2 py-1.5 rounded-lg', 'p-1.5 rounded-md');

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched buttons to top and icons only");
