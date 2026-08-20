const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function main() {
  try {
    const res = await drive.files.list({
      q: "name = 'Plantilla PAD CHINCHAYSULLO Julio 2026' and trashed=false",
      fields: 'files(id)'
    });
    const folderId = res.data.files[0].id;
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime)',
      pageSize: 1000
    });
    
    const driveFiles = files.data.files;
    const blobs = JSON.parse(fs.readFileSync('all_blobs.json'));
    
    const matched = {};
    const scFields = JSON.parse(fs.readFileSync('recovered_fields.json'));
    const scUrls = new Set(Object.values(scFields));
    
    // We also know that San Clemente uses some blobs on July 30/31.
    // If a blob is currently in use by San Clemente, we SHOULD PROBABLY NOT assign it to Chinchaysullo unless they overlap.
    
    driveFiles.forEach(df => {
      const match = df.name.match(/foto_(\d+)/);
      if (match) {
        const key = 'foto_' + match[1];
        const dfTime = new Date(df.createdTime).getTime();
        
        let bestBlob = null;
        let minDiff = Infinity;
        blobs.forEach(b => {
          if (b.pathname.startsWith(key + '_')) {
            const bTime = new Date(b.uploadedAt).getTime();
            const diff = Math.abs(bTime - dfTime);
            if (diff < minDiff) { 
              minDiff = diff;
              bestBlob = b;
            }
          }
        });
        
        if (bestBlob) {
          matched[key] = bestBlob.url;
        }
      }
    });
    
    console.log(`Matched ${Object.keys(matched).length} photos using nearest Drive timestamps!`);
    fs.writeFileSync('chinchaysullo_julio_nearest.json', JSON.stringify(matched, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();
