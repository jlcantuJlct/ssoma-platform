const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const syncHook = `
    // Polling background sync
    React.useEffect(() => {
        if (!templateFile || tags.length === 0) return;
        const interval = setInterval(() => {
            const docType = templateFile.name;
            fetch(\`/api/draft?docType=\${docType}\`).then(r => r.json()).then(data => {
                if (data.fields) {
                    setTags(prev => prev.map(t => {
                        if (data.fields[t.name]) {
                            if (t.type === 'image' && t.remoteUrl !== data.fields[t.name]) {
                                return { ...t, remoteUrl: data.fields[t.name], preview: data.fields[t.name] };
                            }
                            if (t.type === 'text' && t.value !== data.fields[t.name]) {
                                // Only overwrite text if the local field is empty to avoid overwriting typing
                                if (!t.value) {
                                    return { ...t, value: data.fields[t.name] };
                                }
                            }
                        }
                        return t;
                    }));
                }
            }).catch(() => {});
        }, 5000); // 5 seconds for snappy sync
        return () => clearInterval(interval);
    }, [templateFile, tags.length]);
`;

code = code.replace(
    'const templateInputRef = useRef<HTMLInputElement>(null);',
    syncHook + '\n\n    const templateInputRef = useRef<HTMLInputElement>(null);'
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
