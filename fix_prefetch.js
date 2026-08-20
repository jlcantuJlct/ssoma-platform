const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

// 1. Rename state and fetch on mount
content = content.replace(
    'const [referenceMap, setReferenceMap] = useState<Record<string, string>>({});',
    `const [allReferences, setAllReferences] = useState<Record<string, Record<string, string>>>({});

    // Cargar mapa estático en background al entrar a la página (Carga ultra veloz)
    React.useEffect(() => {
        fetch('/references_map.json')
            .then(r => r.json())
            .then(data => setAllReferences(data))
            .catch(() => {});
    }, []);`
);

// 2. Remove loadReferences function entirely
const loadRefsRegex = /\s*const loadReferences = useCallback\(async \(docType: string\) => \{.*?\}, \[\]\);\s*/s;
content = content.replace(loadRefsRegex, '\n    ');

// 3. Remove loadReferences calls from the 4 load functions
content = content.replace(/loadReferences\('.*?'\);\n\s*/g, '');

// 4. Remove loadReferences from dependency arrays
content = content.replace(/, loadReferences/g, '');

// 5. Update the prop passed to ImageDropZone
content = content.replace(
    /refSrc=\{referenceMap\[tag\.name\.toLowerCase\(\)\]\}/g,
    `refSrc={allReferences[templateFile?.name || '']?.[tag.name.toLowerCase()]}`
);

fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Replaced correctly');
