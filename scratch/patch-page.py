import re

with open('app/generador-informes/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update DetectedTag interface
old_interface = """interface DetectedTag {
    name: string;
    type: 'text' | 'image';
    label: string;
    value?: string;
    file?: File;
    preview?: string;
}"""
new_interface = """interface DetectedTag {
    name: string;
    type: 'text' | 'image';
    label: string;
    value?: string;
    file?: File;
    preview?: string;
    remoteUrl?: string;
    loading?: boolean;
}"""
code = code.replace(old_interface, new_interface)

# 2. Update assignImage
old_assign = """    const assignImage = (tagName: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file, preview } : t
        ));
    };"""
new_assign = """    const assignImage = async (tagName: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file, preview, loading: true } : t
        ));

        try {
            const ext = file.name.split('.').pop();
            const res = await fetch(`/api/draft/image?filename=${tagName}_${Date.now()}.${ext}`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const { url } = await res.json();
                setTags(prev => prev.map(t =>
                    t.name === tagName ? { ...t, remoteUrl: url, loading: false } : t
                ));
            } else {
                setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
            }
        } catch (e) {
            setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
        }
    };"""
code = code.replace(old_assign, new_assign)

# 3. Update handleGenerate to use remoteUrl
old_generate = """            // Agregar imágenes
            tags.filter(t => t.type === 'image' && t.file).forEach(t => {
                formData.append(`img_${t.name}`, t.file!);
            });"""
new_generate = """            // Agregar imágenes
            tags.filter(t => t.type === 'image' && (t.file || t.remoteUrl)).forEach(t => {
                if (t.remoteUrl) {
                    formData.append(`img_${t.name}`, t.remoteUrl);
                } else if (t.file) {
                    formData.append(`img_${t.name}`, t.file!);
                }
            });"""
code = code.replace(old_generate, new_generate)

# 4. Add saveDraft and loadDraft
# We will inject these right after setDragOverTag declaration
hooks_injection = """
    // --- Autoguardado Colaborativo ---
    const loadDraft = useCallback(async (docType: string, currentTags: DetectedTag[]) => {
        try {
            const res = await fetch(`/api/draft?docType=${docType}`);
            if (res.ok) {
                const { fields } = await res.json();
                if (fields && Object.keys(fields).length > 0) {
                    setTags(prev => prev.map(t => {
                        if (fields[t.name]) {
                            if (t.type === 'text') return { ...t, value: fields[t.name] };
                            if (t.type === 'image') return { ...t, remoteUrl: fields[t.name], preview: fields[t.name] };
                        }
                        return t;
                    }));
                }
            }
        } catch (e) {
            console.error('Error loading draft', e);
        }
    }, []);

    const saveDraftTimeout = useRef<NodeJS.Timeout | null>(null);
    React.useEffect(() => {
        if (!templateFile || tags.length === 0) return;
        if (saveDraftTimeout.current) clearTimeout(saveDraftTimeout.current);
        
        saveDraftTimeout.current = setTimeout(async () => {
            const docType = templateFile.name;
            const fields: Record<string, string> = {};
            tags.forEach(t => {
                if (t.type === 'text' && t.value) fields[t.name] = t.value;
                if (t.type === 'image' && t.remoteUrl) fields[t.name] = t.remoteUrl;
            });
            
            if (Object.keys(fields).length > 0) {
                await fetch('/api/draft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docType, fields })
                });
            }
        }, 2000);
    }, [tags, templateFile]);
"""
code = code.replace('    const [dragOverTag, setDragOverTag] = useState<string | null>(null);', '    const [dragOverTag, setDragOverTag] = useState<string | null>(null);' + hooks_injection)

# 5. Call loadDraft inside setTimeout of loadXXX functions
code = code.replace('setTags(detected);', 'setTags(detected);\n            loadDraft(templateFile?.name || "PAD_SAN_CLEMENTE_INTERNAL.docx", detected);')
# Wait, templateFile state is asynchronous. Let's hardcode docTypes.
code = code.replace('loadDraft(templateFile?.name || "PAD_SAN_CLEMENTE_INTERNAL.docx", detected);', 'loadDraft("PAD_SAN_CLEMENTE_INTERNAL.docx", detected);')

with open('app/generador-informes/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
