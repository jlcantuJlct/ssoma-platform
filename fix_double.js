const fs = require('fs');
const path = 'app/digital-inspections/[module]/fill/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The bug is that `isCheckboxField(item.text)` was added to `isGeneralHeader`.
// Let's remove it from `isGeneralHeader` so it only renders in the dedicated checkbox block.

// We will find `const isGeneralHeader = ` and replace the end of it.
const startIdx = code.indexOf('const isGeneralHeader = item.type !== \'title\' &&');
if (startIdx !== -1) {
    const endIdx = code.indexOf(');', startIdx);
    let isGeneralLine = code.substring(startIdx, endIdx + 2);
    
    // Remove `|| isCheckboxField(item.text)`
    isGeneralLine = isGeneralLine.replace(/ \|\| isCheckboxField\(item\.text\)/g, '');
    
    code = code.substring(0, startIdx) + isGeneralLine + code.substring(endIdx + 2);
    fs.writeFileSync(path, code);
    console.log("isGeneralHeader fixed (removed duplicate checkboxes)!");
}
