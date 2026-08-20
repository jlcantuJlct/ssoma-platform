const fs = require('fs');
const path = 'c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Modal Header
content = content.replace(
    '<div className="flex justify-between items-center">\n                                            <h3 className="text-xl font-black text-white">📅 Programa Mensual de Capacitaciones</h3>',
    '<div className="flex justify-between items-start md:items-center">\n                                            <h3 className="text-lg md:text-xl font-black text-white pr-4">📅 Programa Mensual de Capacitaciones</h3>'
);

// 2. Developer Form grid
content = content.replace(
    '<div className="grid grid-cols-2 gap-3">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'
);
content = content.replace(
    '<div className="grid grid-cols-2 gap-3 mt-3">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">'
);

// 3. Actividades Programadas Header & Filters
content = content.replace(
    '<div className="flex justify-between items-center mb-3">\n                                                <h4 className="text-sm font-bold text-blue-400">Actividades Programadas</h4>\n\n                                                {/* FILTER CONTROLS */}\n                                                <div className="flex items-center gap-2">',
    '<div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 mb-3">\n                                                <h4 className="text-sm font-bold text-blue-400">Actividades Programadas</h4>\n\n                                                {/* FILTER CONTROLS */}\n                                                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">'
);

// 4. Temario Divider & Layout
content = content.replace(
    '<div className="flex items-center ml-4 border-l border-slate-700 pl-4">',
    '<div className="flex flex-wrap items-center gap-2 md:ml-2 md:border-l border-slate-700 md:pl-2">'
);

// 5. Table wrapper (Ensure overflow-x-auto)
// We look for the table tag and ensure it is wrapped properly.
// The user's screenshot shows the table columns overlapping or cut off.
content = content.replace(
    /<table className="w-full text-\[10px\] text-left">/g,
    '<div className="overflow-x-auto w-full"><table className="w-full text-[10px] text-left min-w-[400px]">'
);
content = content.replace(
    /<\/table>/g,
    '</table></div>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Mobile responsiveness patched.');
