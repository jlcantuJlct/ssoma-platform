const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function search() {
  try {
    const res = await drive.files.list({
      q: "name = 'Plantilla PAD CHINCHAYSULLO Julio 2026' and trashed=false",
      fields: 'files(id, name, mimeType)'
    });
    console.log("Folders found:", res.data.files);
    
    if (res.data.files.length > 0) {
      const folderId = res.data.files[0].id;
      const files = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, createdTime)',
        pageSize: 1000
      });
      console.log(`Found ${files.data.files.length} photos inside!`);
      files.data.files.slice(0, 5).forEach(f => console.log(f.name, f.createdTime));
    }
  } catch(e) {
    console.error(e);
  }
}
search();
