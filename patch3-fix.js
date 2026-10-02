const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

const targetStr = `const safeItemName = itemName.replace(/[.*+?^\\$\\{\\}()|[\\]\\\\]/g, '\\\\const handleItemChange = (kitIdx: number, itemName: string, field: string, val: any) => {
        const copy = [...kits];
        copy[kitIdx].items[itemName][field] = val;
        setKits(copy);
    };');`;

const fixStr = "const safeItemName = itemName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');";

if (code.includes(targetStr)) {
    code = code.replace(targetStr, fixStr);
    fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
    console.log('Fixed the corrupted handleItemChange regex');
} else {
    console.log('Target string not found');
}
