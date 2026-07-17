const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// Replace gap-3 with gap-1 in the overlay container
code = code.replace(
    'className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3"',
    'className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5"'
);

// Replace gap-2 with gap-1.5 in the buttons row
code = code.replace(
    '<div className="flex gap-2">',
    '<div className="flex gap-1.5">'
);

// Replace padding, text size, icon size on all 3 buttons
code = code.replaceAll('px-3 py-2 rounded-lg', 'px-2 py-1.5 rounded-lg');
code = code.replaceAll('size={16}', 'size={14}');
code = code.replaceAll('text-xs font-medium ml-1', 'text-[10px] font-medium ml-1');

// For the filename, let's also make it smaller
code = code.replace(
    'className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-md"',
    'className="text-white text-[9px] font-medium px-1.5 py-0.5 bg-black/50 rounded-md"'
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched buttons to be smaller");
