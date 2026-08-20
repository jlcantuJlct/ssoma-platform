const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

// The file is currently at HEAD (the commit that failed to build because of my previous fix).
// Wait, HEAD is commit 1ae077f which has the broken code!
// Let me just replace the entire broken block in handleRestoreArchive!

const blockRegex = /setTags\(prev => prev\.map\(t => \{.*?return newTag;\s*\}\);\s*const updates = \[\];\s*for \(const t of newTags\) \{.*?\}\s*if \(updates\.length > 0\) \{.*?\}\s*\}\);/s;

const fixedBlock = `setTags(prev => prev.map(t => {
                    let newTag = { ...t, file: undefined, preview: undefined, value: '', remoteUrl: undefined };
                    if (data.fields[t.name]) {
                        if (t.type === 'text') newTag.value = data.fields[t.name];
                        if (t.type === 'image') {
                            newTag.remoteUrl = data.fields[t.name];
                        }
                    }
                    return newTag;
                }));

                const updates = [];
                Object.keys(data.fields).forEach(key => {
                    const val = data.fields[key];
                    if (typeof val === 'string' && (val.startsWith('http') || val.includes('/'))) {
                        updates.push(getCachedImageURL(val).then(url => ({ name: key, url })));
                    }
                });

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

content = content.replace(blockRegex, fixedBlock);
fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Fixed successfully');
