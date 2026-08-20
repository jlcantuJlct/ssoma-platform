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
    const blobs = JSON.parse(fs.readFileSync('recent_blobs2.json'));
    
    const matched = {};
    driveFiles.forEach(df => {
      const match = df.name.match(/foto_(\d+)/);
      if (match) {
        const key = 'foto_' + match[1];
        const dfTime = new Date(df.createdTime).getTime();
        
        // Find the blob with the closest uploadedAt
        let bestBlob = null;
        let minDiff = Infinity;
        blobs.forEach(b => {
          if (b.pathname.startsWith(key + '_')) {
            const bTime = new Date(b.uploadedAt).getTime();
            const diff = Math.abs(bTime - dfTime);
            if (diff < minDiff && diff < 600000) { // within 10 minutes
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
    
    console.log(`Matched ${Object.keys(matched).length} photos using Drive timestamps!`);
    fs.writeFileSync('chinchaysullo_julio_perfect.json', JSON.stringify(matched, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();
