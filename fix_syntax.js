const fs = require('fs');
const path = 'app/api/export-excel/route.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `            }
        } 


        
        } else if (isInternas) {`;
        
const replacement = `            }
        } else if (isInternas) {`;
        
code = code.replace(target, replacement);

fs.writeFileSync(path, code);
console.log("Syntax fixed!");
