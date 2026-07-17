const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// 1. Add useAuth import
if (!code.includes("import { useAuth }")) {
    code = code.replace(
        "import { compressImage } from '@/lib/uploadClient';",
        "import { compressImage } from '@/lib/uploadClient';\nimport { useAuth } from '@/lib/auth';"
    );
}

// 2. Add uploaderInitials to DetectedTag interface
if (!code.includes("uploaderInitials?: string;")) {
    code = code.replace(
        "loading?: boolean;",
        "loading?: boolean;\n    uploaderInitials?: string;\n    uploaderName?: string;"
    );
}

// 3. Call useAuth inside GeneradorInformesPage
if (!code.includes("const { user } = useAuth();")) {
    code = code.replace(
        "const [templateFile, setTemplateFile] = useState<File | null>(null);",
        "const { user } = useAuth();\n    const [templateFile, setTemplateFile] = useState<File | null>(null);"
    );
}

// 4. Update loadDraft to parse _uploaders_
if (!code.includes("const uploaders = fields['_uploaders_']")) {
    code = code.replace(
        "if (fields && Object.keys(fields).length > 0) {",
        "if (fields && Object.keys(fields).length > 0) {\n                    let uploaders = {};\n                    try { if (fields['_uploaders_']) uploaders = JSON.parse(fields['_uploaders_']); } catch(e){}"
    );
    
    code = code.replace(
        "if (t.type === 'image') return { ...t, remoteUrl: fields[t.name] };",
        "if (t.type === 'image') return { ...t, remoteUrl: fields[t.name], uploaderInitials: uploaders[t.name]?.initials, uploaderName: uploaders[t.name]?.name };"
    );
}

// 5. Update saveDraftTimeout to include _uploaders_
if (!code.includes("const uploaders: Record<string, any> = {};")) {
    code = code.replace(
        "const fields: Record<string, string> = {};",
        "const fields: Record<string, string> = {};\n            const uploaders: Record<string, any> = {};"
    );
    
    code = code.replace(
        "if (t.type === 'image' && t.remoteUrl) fields[t.name] = t.remoteUrl;",
        "if (t.type === 'image' && t.remoteUrl) {\n                    fields[t.name] = t.remoteUrl;\n                    if (t.uploaderInitials) uploaders[t.name] = { initials: t.uploaderInitials, name: t.uploaderName };\n                }"
    );
    
    code = code.replace(
        "if (Object.keys(fields).length > 0) {",
        "if (Object.keys(uploaders).length > 0) fields['_uploaders_'] = JSON.stringify(uploaders);\n            if (Object.keys(fields).length > 0) {"
    );
}

// 6. Update assignImage to capture user initials
if (!code.includes("uploaderInitials: userInitials")) {
    code = code.replace(
        "const assignImage = async (tagName: string, file: File) => {",
        "const assignImage = async (tagName: string, file: File) => {\n        const userInitials = user ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '';"
    );
    code = code.replace(
        "t.name === tagName ? { ...t, file, preview, loading: true } : t",
        "t.name === tagName ? { ...t, file, preview, loading: true, uploaderInitials: userInitials, uploaderName: user?.name } : t"
    );
    
    code = code.replace(
        "setTags(prev => prev.map(t => t.name === tagName ? { ...t, remoteUrl: publicUrl, loading: false } : t));",
        "setTags(prev => prev.map(t => t.name === tagName ? { ...t, remoteUrl: publicUrl, loading: false, uploaderInitials: userInitials, uploaderName: user?.name } : t));"
    );
}

// 7. Render initials on hover in ImageDropZone
if (!code.includes("tag.uploaderInitials")) {
    code = code.replace(
        "<!-- Badge ok -->",
        "{/* Uploader Initials Avatar on Hover */}\n                        {tag.uploaderInitials && (\n                            <div className=\"absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 z-20 group/avatar cursor-help transition-opacity opacity-0 group-hover:opacity-100\"\n                                style={{ background: 'linear-gradient(135deg, hsl(215,83%,45%), hsl(215,83%,35%))' }}\n                                title={`Subido por: ${tag.uploaderName || 'Usuario'}`}>\n                                <span className=\"text-white font-black text-[10px]\">{tag.uploaderInitials}</span>\n                            </div>\n                        )}\n                        {/* Badge ok */}"
    );
}

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patch completed");
