const fs = require('fs');
const file_path = "app/residuos/page.tsx";
let content = fs.readFileSync(file_path, "utf-8");

// Change grid back to 2 columns
content = content.replace(
    '<div className="grid grid-cols-1 gap-6">',
    '<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">'
);

// Reduce padding and text size in headers for the 12 month columns to fit
content = content.replace(/<th className="pb-4 text-center">/g, '<th className="pb-3 text-center px-0.5 text-[8px] sm:text-[9px]">');
content = content.replace(/<td className="py-3 text-center">/g, '<td className="py-2 text-center px-0.5">');

// Reduce left and right padding to save space
content = content.replace(/<th className="pb-4 pl-4/g, '<th className="pb-3 pl-2 text-[9px] min-w-[120px]');
content = content.replace(/<td className="py-3 pl-4/g, '<td className="py-2 pl-2');
content = content.replace(/<th className="pb-4 text-right pr-4/g, '<th className="pb-3 text-right pr-2 text-[9px]');
content = content.replace(/<td className="py-3 text-right pr-4/g, '<td className="py-2 text-right pr-2');

// Reduce padding inside the blocks
content = content.replace(/p-6 shadow-xl overflow-x-auto/g, 'p-4 shadow-xl overflow-x-auto');

fs.writeFileSync(file_path, content);
console.log("Done");
