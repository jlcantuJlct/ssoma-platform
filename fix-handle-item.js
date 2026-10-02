const fs = require('fs');
let code = fs.readFileSync('components/inspections/KitAntiderrameCustomForm.tsx', 'utf8');

const newFunc = `const handleItemChange = (kitIdx: number, itemName: string, field: string, val: any) => {
        const copy = [...kits];
        
        copy[kitIdx].items[itemName][field] = val;
        
        const newStatus = copy[kitIdx].items[itemName].status;
        const newMissingQty = copy[kitIdx].items[itemName].missingQty || '';
        
        let obs = copy[kitIdx].observaciones || '';
        
        const safeItemName = itemName.replace(/[.*+?^\\$\\{\\}()|[\\]\\\\]/g, '\\\\$&');
        const searchRegex = new RegExp(\`\\\\[\${safeItemName}:.*?\\\\]\\\\s*\`, 'g');
        obs = obs.replace(searchRegex, '');
        
        if (newStatus === 'NC' || newStatus === 'F') {
            const labelStr = newStatus === 'NC' ? 'NO CONFORME' : 'FALTANTE';
            const qtyStr = newMissingQty ? \` - Cant: \${newMissingQty}\` : '';
            const prefix = \`[\${itemName}: \${labelStr}\${qtyStr}]\`;
            obs = \`\${prefix}\\n\${obs}\`.trim();
            obs = obs.replace(/\\]\\s+\\[/g, ']\\n[');
        }
        
        copy[kitIdx].observaciones = obs;
        setKits(copy);
    };`;

const regex = /const handleItemChange = \([\s\S]*?setKits\(copy\);\s*\n\s*\};/;
code = code.replace(regex, () => newFunc);

fs.writeFileSync('components/inspections/KitAntiderrameCustomForm.tsx', code);
console.log('Fixed handleItemChange cleanly.');
