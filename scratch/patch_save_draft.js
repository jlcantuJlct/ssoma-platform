const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

code = code.replace(
    /tags\.forEach\(t => \{\s*if \(t\.type === 'text' && t\.value\) fields\[t\.name\] = t\.value;\s*if \(t\.type === 'image' && t\.remoteUrl\) \{\s*fields\[t\.name\] = t\.remoteUrl;\s*if \(t\.uploaderInitials\) uploaders\[t\.name\] = \{ initials: t\.uploaderInitials, name: t\.uploaderName \};\s*\}\s*\}\);/g,
    `tags.forEach(t => {
                  if (t.type === 'text') fields[t.name] = t.value || '';
                  if (t.type === 'image') {
                      fields[t.name] = t.remoteUrl || '';
                      if (t.uploaderInitials) uploaders[t.name] = { initials: t.uploaderInitials, name: t.uploaderName };
                  }
              });`
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched saveDraftTimeout to send empty strings for deletions");
