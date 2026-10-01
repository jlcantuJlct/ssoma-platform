const fs = require('fs');
let c = fs.readFileSync('app/api/export-excel/route.ts', 'utf8');

const regex = /let driveUrl = "";\s*if \(driveRes\.ok\) \{\s*const text = await driveRes\.text\(\);\s*const driveData = JSON\.parse\(text\);\s*if \(driveData\.result === "success"\) \{\s*driveUrl = driveData\.url \|\| driveData\.viewLink \|\| "";\s*\}/m;

const replacement = `let driveUrl = "";
        if (driveRes.ok) {
          const text = await driveRes.text();
          try {
            const driveData = JSON.parse(text);
            if (driveData.result === "success") {
              driveUrl = driveData.url || driveData.viewLink || "";
            } else {
              require('fs').writeFileSync('drive_error.log', JSON.stringify(driveData));
            }
          } catch(e) {
            require('fs').writeFileSync('drive_error_text.log', text);
          }
        } else {
          require('fs').writeFileSync('drive_error_status.log', driveRes.statusText);
        }`;

c = c.replace(regex, replacement);

fs.writeFileSync('app/api/export-excel/route.ts', c);
console.log('Injected Drive error logging');
