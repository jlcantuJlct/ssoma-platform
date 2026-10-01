const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(
    /generalSections\.forEach\(section => \{\s*section\.items\.forEach\(item => \{\s*newChecklist\[item\] = 'OK';\s*\}\);\s*\}\);/,
    `generalSections.forEach(section => {
              section.items.forEach(item => {
                  if (section.type === 'fugas') {
                      newChecklist[item] = 'N/A';
                  } else {
                      newChecklist[item] = 'OK';
                  }
              });
          });`
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Fixed generalSections N/A');
