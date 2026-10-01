const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

const s1 = "const [checklist, setChecklist] = useState<Record<string, string>>({});";
const replacement = s1 + "\n\n    useEffect(() => {\n" +
"        const newChecklist: Record<string, string> = {};\n" +
"        generalSections.forEach(section => {\n" +
"            section.items.forEach(item => {\n" +
"                newChecklist[item] = 'OK';\n" +
"            });\n" +
"        });\n" +
"        const specific = specificSections[meta.tipoEquipo] || [];\n" +
"        specific.forEach(section => {\n" +
"            section.items.forEach(item => {\n" +
"                newChecklist[item] = 'OK';\n" +
"            });\n" +
"        });\n" +
"        setChecklist(newChecklist);\n" +
"    }, [meta.tipoEquipo]);\n";

if (c.indexOf(s1) !== -1) {
    c = c.replace(s1, replacement);
    fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
    console.log('Added auto-OK initialization');
} else {
    console.log('Could not find checklist state');
}
