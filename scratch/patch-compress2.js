const fs = require('fs');

let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

const compressFn = `
// ─── Utilidad para comprimir imágenes antes de subir ─────────────────────────
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target?.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                    } else reject(new Error('Canvas toBlob failed'));
                }, 'image/jpeg', 0.7);
            };
        };
        reader.onerror = error => reject(error);
    });
};
`;

code = code.replace('export default function GeneradorInformesPage() {', compressFn + '\nexport default function GeneradorInformesPage() {');

const oldAssign = `    const assignImage = async (tagName: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setTags(prev => prev.map(t =>
            t.name === tagName ? { ...t, file, preview, loading: true } : t
        ));

        try {
            const ext = file.name.split('.').pop();
            const formData = new FormData();
            formData.append('file', file);
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
                setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
            }
        } catch (e) {
            setTags(prev => prev.map(t => t.name === tagName ? { ...t, loading: false } : t));
        }
    };`;

const newAssign = `    const assignImage = async (tagName: string, originalFile: File) => {
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

code = code.replace(oldAssign, newAssign);

fs.writeFileSync('app/generador-informes/page.tsx', code);
