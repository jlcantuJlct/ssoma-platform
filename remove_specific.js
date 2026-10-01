const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

// 1. Remove specificSections from useEffect
c = c.replace(
    /const specific = specificSections\[meta\.tipoEquipo as keyof typeof specificSections\] \|\| \[\];\s*specific\.forEach\(section => \{\s*section\.items\.forEach\(item => \{\s*if \(section\.type === 'fugas'\) \{\s*newChecklist\[item\] = 'N\/A';\s*\} else \{\s*newChecklist\[item\] = 'OK';\s*\}\s*\}\);\s*\}\);/,
    ""
);
c = c.replace(
    /const specific = specificSections\[meta\.tipoEquipo\] \|\| \[\];\s*specific\.forEach\(section => \{\s*section\.items\.forEach\(item => \{\s*if \(section\.type === 'fugas'\) \{\s*newChecklist\[item\] = 'N\/A';\s*\} else \{\s*newChecklist\[item\] = 'OK';\s*\}\s*\}\);\s*\}\);/,
    ""
);

// 2. Remove specificSections from sectionsToRender
c = c.replace(
    /const sectionsToRender = \[\.\.\.generalNonFugas, \.\.\.\(specificSections\[meta\.tipoEquipo\] \|\| \[\]\), \.\.\.fugas\];/,
    "const sectionsToRender = [...generalNonFugas, ...fugas];"
);
c = c.replace(
    /const sectionsToRender = \[\.\.\.generalNonFugas, \.\.\.\(specificSections\[meta\.tipoEquipo as keyof typeof specificSections\] \|\| \[\]\), \.\.\.fugas\];/,
    "const sectionsToRender = [...generalNonFugas, ...fugas];"
);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Removed specific sections from digital form');
