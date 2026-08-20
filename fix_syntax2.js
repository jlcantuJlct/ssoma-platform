const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

const targetStr = `                    if (data.fields[t.name]) {
                        if (t.type === 'text') newTag.value = data.fields[t.name];
                        if (t.type === 'image') {
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

const replaceStr = `                    if (data.fields[t.name]) {
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

// Convert to single format to handle CRLF issues
const normalize = str => str.replace(/\r\n/g, '\n');

if (normalize(content).includes(normalize(targetStr))) {
    content = normalize(content).replace(normalize(targetStr), replaceStr);
    fs.writeFileSync('app/generador-informes/page.tsx', content);
    console.log('Replaced correctly');
} else {
    console.log('Target string not found');
}
