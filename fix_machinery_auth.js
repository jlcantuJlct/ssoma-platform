const fs = require('fs');
let c = fs.readFileSync('components/inspections/MachineryCustomForm.tsx', 'utf8');

c = c.replace(
    "import { useRouter } from 'next/navigation';",
    "import { useRouter } from 'next/navigation';\nimport { useAuth } from '@/lib/auth';"
);

c = c.replace(
    "const [isSaving, setIsSaving] = useState(false);",
    "const { user } = useAuth();\n    const [isSaving, setIsSaving] = useState(false);"
);

c = c.replace(
    "capatazNombre: '',",
    "capatazNombre: '',"
);

const s1 = "const [firmas, setFirmas] = useState({";
const replacement = "useEffect(() => {\n" +
"        if (user && !firmas.capatazNombre) {\n" +
"            setFirmas(prev => ({ ...prev, capatazNombre: user.name || '' }));\n" +
"        }\n" +
"    }, [user]);\n\n    " + s1;

c = c.replace(s1, replacement);

fs.writeFileSync('components/inspections/MachineryCustomForm.tsx', c);
console.log('Added useAuth and capatazNombre initialization');
