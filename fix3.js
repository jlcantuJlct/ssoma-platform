const fs = require('fs');
let content = fs.readFileSync('app/inspections/page.tsx', 'utf8');
const searchStr = `<div className={\`space-y-6 \${user?.role === 'manager' ? 'xl:col-span-5' : 'xl:col-span-4'}\`}>`;
content = content.replace(searchStr, `<div className="max-w-5xl w-full space-y-6">`);
fs.writeFileSync('app/inspections/page.tsx', content);
console.log('Fixed width');
