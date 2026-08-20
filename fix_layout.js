const fs = require('fs');

let file = 'C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/inspections/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    '<div className="grid grid-cols-1 xl:grid-cols-5 gap-6">',
    '<div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6">'
);

content = content.replace(
    'className="bg-slate-900 border-slate-800 xl:col-span-1 h-fit shadow-2xl"',
    'className="bg-slate-900 border-slate-800 lg:col-span-1 xl:col-span-1 h-fit shadow-2xl"'
);

// We find the flex flex-col min-h-0 line. I will use regex because of dynamic values.
content = content.replace(
    /className=\{\`col-span-1 \$\{user\?\.role !== 'manager' \? 'xl:col-span-4' : 'xl:col-span-5'\} flex flex-col min-h-0\`\}/g,
    "className={`col-span-1 ${user?.role !== 'manager' ? 'lg:col-span-3 xl:col-span-4' : 'lg:col-span-4 xl:col-span-5'} flex flex-col min-h-0`}"
);

fs.writeFileSync(file, content);
