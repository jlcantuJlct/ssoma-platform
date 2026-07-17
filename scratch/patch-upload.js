const fs = require('fs');

let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const oldAssign = `    const assignImage = async (tagName: string, originalFile: File) => {
        const preview = URL.createObjectURL(originalFile);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file: originalFile, preview, loading: true } : t
        ));

        try {
            const file = await compressImage(originalFile) as File;
            const ext = file.name.split('.').pop();
            const res = await fetch(\`/api/draft/image?filename=\${tagName}_\${Date.now()}.\${ext}\`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const blob = await res.json();
                setTags(prev => prev.map(t =>
                    t.name === tagName ? { ...t, remoteUrl: blob.url, loading: false } : t
                ));
            } else {
                const errData = await res.json().catch(()=>({error: res.statusText}));
                alert(\`Error de subida. Vercel Blob puede no estar configurado. Detalles: \${errData.error}\`);
                setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
            }
        } catch (e: any) {
            alert('Error subiendo foto: ' + e.message);
            setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
        }
    };`;

const newAssign = `    const assignImage = async (tagName: string, originalFile: File) => {
        const preview = URL.createObjectURL(originalFile);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file: originalFile, preview, loading: true } : t
        ));

        try {
            // Compress the image to ensure it easily uploads
            const file = await compressImage(originalFile) as File;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folderName', 'Borradores_Informes');
            formData.append('fileName', \`\${tagName}_\${Date.now()}.jpg\`);

            // Use the same reliable upload method as PQR / Inspections
            const res = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setTags(prev => prev.map(t =>
                    t.name === tagName ? { ...t, remoteUrl: data.path, loading: false } : t
                ));
            } else {
                const errData = await res.json().catch(()=>({error: res.statusText}));
                alert(\`Error de subida al servidor: \${errData.error}\`);
                setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
            }
        } catch (e: any) {
            alert('Error subiendo foto: ' + e.message);
            setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
        }
    };`;

code = code.replace(oldAssign, newAssign);

// Adjust visual font size for preview box
code = code.replace(
    'className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none mix-blend-screen"',
    'className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity pointer-events-none mix-blend-screen"'
);
code = code.replace(
    '<p className="text-[11px] font-semibold tracking-wide"',
    '<p className="text-[9px] font-medium tracking-wider"'
);
code = code.replace(
    '<div className="relative z-10 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-all"',
    '<div className="relative z-10 flex items-center justify-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-md transition-all"'
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
