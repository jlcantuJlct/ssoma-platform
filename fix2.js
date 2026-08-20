const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

// 1. Add state
content = content.replace(
  "const [dragOverTag, setDragOverTag] = useState<string | null>(null);",
  "const [dragOverTag, setDragOverTag] = useState<string | null>(null);\n    const [referenceMap, setReferenceMap] = useState<Record<string, string>>({});"
);

// 2. Add loadReferences function after loadDraft
const loadRefsFunc = `
    const loadReferences = useCallback(async (docType: string) => {
        try {
            const res = await fetch(\`/api/references?docType=\${docType}\`);
            if (res.ok) {
                const data = await res.json();
                setReferenceMap(data.references || {});
            }
        } catch (e) {
            console.error('Error loading references', e);
        }
    }, []);
`;
content = content.replace(
  "// ─── Cargar plantilla San Clemente",
  loadRefsFunc + "\n    // ─── Cargar plantilla San Clemente"
);

// 3. Call loadReferences in loadX
content = content.replace(/loadDraft\('PAD_SAN_CLEMENTE_INTERNAL\.docx', detected\);/g, "loadDraft('PAD_SAN_CLEMENTE_INTERNAL.docx', detected);\n            loadReferences('PAD_SAN_CLEMENTE_INTERNAL.docx');");
content = content.replace(/loadDraft\('PAD_CHINCHAYSULLO_INTERNAL\.docx', detected\);/g, "loadDraft('PAD_CHINCHAYSULLO_INTERNAL.docx', detected);\n            loadReferences('PAD_CHINCHAYSULLO_INTERNAL.docx');");
content = content.replace(/loadDraft\('PAD_JAHUAY_INTERNAL\.docx', detected\);/g, "loadDraft('PAD_JAHUAY_INTERNAL.docx', detected);\n            loadReferences('PAD_JAHUAY_INTERNAL.docx');");
content = content.replace(/loadDraft\('PAD_BARANDAS_INTERNAL\.docx', detected\);/g, "loadDraft('PAD_BARANDAS_INTERNAL.docx', detected);\n            loadReferences('PAD_BARANDAS_INTERNAL.docx');");

// 4. Update loadX dependencies
content = content.replace(/}, \[loadDraft\]\);/g, "}, [loadDraft, loadReferences]);");

// 5. Update ImageDropZone component signature and remove useRefSrc call
content = content.replace(
  /function ImageDropZone\(\{ tag, onFileChange, onClear, isDragOver, onDragOver, onDragLeave, onDrop, docType \}: \{/s,
  "function ImageDropZone({ tag, onFileChange, onClear, isDragOver, onDragOver, onDragLeave, onDrop, docType, refSrc }: {"
);
content = content.replace(
  /docType: string;\n\}?\) \{/s,
  "docType: string;\n    refSrc?: string;\n}) {"
);
content = content.replace(
  /const refSrc = useRefSrc\(tag\.name, docType\);\s*/,
  ""
);

// 6. Update ImageDropZone instantiation
content = content.replace(
  /docType=\{\(templateFile\?.name \|\| ''\).*?\}/s,
  "docType={templateFile?.name || ''}\n                                                refSrc={referenceMap[tag.name.toLowerCase()]}"
);

// 7. Remove useRefSrc function entirely
const refSrcRegex = /\/\/ Hook: resuelve la primera URL estática que existe.*?(?=function ImageDropZone)/s;
content = content.replace(refSrcRegex, "");

fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Replaced successfully');
