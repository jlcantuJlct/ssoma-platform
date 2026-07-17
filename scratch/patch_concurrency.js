const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// 1. loadDraft
code = code.replace(
    /let uploaders = \{\};\s*try \{ if \(fields\['_uploaders_']\) uploaders = JSON\.parse\(fields\['_uploaders_']\); \} catch\(e\)\{\}\s*setTags\(prev => prev\.map\(t => \{\s*if \(fields\[t\.name\]\) \{\s*if \(t\.type === 'text'\) return \{ \.\.\.t, value: fields\[t\.name\] \};\s*if \(t\.type === 'image'\) return \{ \.\.\.t, remoteUrl: fields\[t\.name\], uploaderInitials: uploaders\[t\.name\]\?\.initials, uploaderName: uploaders\[t\.name\]\?\.name \};\s*\}\s*return t;\s*\}\)\);/g,
    `
                    setTags(prev => prev.map(t => {
                        if (fields[t.name] !== undefined) {
                            if (t.type === 'text') return { ...t, value: fields[t.name] };
                            if (t.type === 'image') return { 
                                ...t, 
                                remoteUrl: fields[t.name], 
                                uploaderInitials: fields[\`_uploaderInitials_\${t.name}\`], 
                                uploaderName: fields[\`_uploaderName_\${t.name}\`] 
                            };
                        }
                        return t;
                    }));
    `
);

// 2. clearTag
code = code.replace(
    "t.name === tagName ? { ...t, file: undefined, preview: undefined, value: '', remoteUrl: undefined, uploaderInitials: undefined, uploaderName: undefined } : t",
    "t.name === tagName ? { ...t, file: undefined, preview: undefined, value: '', remoteUrl: '', uploaderInitials: '', uploaderName: '' } : t"
);

// 3. saveDraftTimeout
code = code.replace(
    /const uploaders: Record<string, any> = \{\};\s*tags\.forEach\(t => \{\s*if \(t\.type === 'text'\) fields\[t\.name\] = t\.value \|\| '';\s*if \(t\.type === 'image'\) \{\s*fields\[t\.name\] = t\.remoteUrl \|\| '';\s*if \(t\.uploaderInitials\) uploaders\[t\.name\] = \{ initials: t\.uploaderInitials, name: t\.uploaderName \};\s*\}\s*\}\);\s*if \(Object\.keys\(uploaders\)\.length > 0\) fields\['_uploaders_'] = JSON\.stringify\(uploaders\);/g,
    `
              tags.forEach(t => {
                  if (t.type === 'text' && t.value !== undefined) fields[t.name] = t.value;
                  if (t.type === 'image' && t.remoteUrl !== undefined) {
                      fields[t.name] = t.remoteUrl;
                      fields[\`_uploaderInitials_\${t.name}\`] = t.uploaderInitials || '';
                      fields[\`_uploaderName_\${t.name}\`] = t.uploaderName || '';
                  }
              });
    `
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched concurrency issues and initials syncing");
