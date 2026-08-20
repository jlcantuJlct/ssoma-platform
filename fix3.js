const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

// 1. Replace loadDraft image batching
const loadDraftRegex = /\/\/ Cargar imágenes desde caché local asíncronamente\s*for \(const t of currentTags\) \{.*?\}\s*\}/s;
const loadDraftReplacement = `// Cargar imágenes desde caché local en BLOQUE para máxima velocidad
                    const updates = [];
                    for (const t of currentTags) {
                        if (t.type === 'image' && fields[t.name]) {
                            updates.push(getCachedImageURL(fields[t.name]).then(url => ({ name: t.name, url })));
                        }
                    }
                    if (updates.length > 0) {
                        Promise.all(updates).then(results => {
                            setTags(prev => {
                                const m = [...prev];
                                for (const res of results) {
                                    const idx = m.findIndex(pt => pt.name === res.name);
                                    if (idx !== -1) m[idx] = { ...m[idx], preview: res.url };
                                }
                                return m;
                            });
                        });
                    }`;
content = content.replace(loadDraftRegex, loadDraftReplacement);

// 2. Replace handleRestoreArchive image batching
const restoreArchiveRegex = /if \(t\.type === 'image'\) \{\s*newTag\.remoteUrl = data\.fields\[t\.name\];\s*\/\/ Cargar desde caché en vez de gastar datos\s*getCachedImageURL.*?\}\s*\}\s*return newTag;\s*\}\)\);/s;
const restoreArchiveReplacement = `if (t.type === 'image') {
                            newTag.remoteUrl = data.fields[t.name];
                        }
                    }
                    return newTag;
                });

                const updates = [];
                for (const t of newTags) {
                    if (t.type === 'image' && t.remoteUrl) {
                        updates.push(getCachedImageURL(t.remoteUrl).then(url => ({ name: t.name, url })));
                    }
                }
                if (updates.length > 0) {
                    Promise.all(updates).then(results => {
                        setTags(prev => {
                            const m = [...prev];
                            for (const res of results) {
                                const idx = m.findIndex(pt => pt.name === res.name);
                                if (idx !== -1) m[idx] = { ...m[idx], preview: res.url };
                            }
                            return m;
                        });
                    });
                }`;

content = content.replace(restoreArchiveRegex, restoreArchiveReplacement);

// 3. One more sync block to fix: the background polling
// "fetch(`/api/draft?docType=${docType}`).then(r => r.json()).then(data => {"
const pollRegex = /if \(t\.type === 'image' && t\.remoteUrl !== data\.fields\[t\.name\]\) \{\s*getCachedImageURL.*?return t; \/\/ El async se encarga de actualizar\s*\}/s;
const pollReplacement = `if (t.type === 'image' && t.remoteUrl !== data.fields[t.name]) {
                                getCachedImageURL(data.fields[t.name]).then(localUrl => {
                                    setTags(current => current.map(pt => pt.name === t.name ? { ...pt, remoteUrl: data.fields[t.name], preview: localUrl } : pt));
                                });
                                return t;
                            }`;
content = content.replace(pollRegex, pollReplacement);

fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Replaced successfully');
