const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function findFolder(name, parentId = null) {
  let q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  }
  const res = await drive.files.list({ q, fields: 'files(id, name)' });
  return res.data.files[0];
}

async function listFilesInFolder(folderId) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, webViewLink, createdTime)',
    pageSize: 1000
  });
  return res.data.files;
}

async function main() {
  try {
    // 1j6wEqCN3zU9IsGthKeRCo_a6X4UH6NU5 is the root folder (from verify_output.txt)
    const rootId = '1j6wEqCN3zU9IsGthKeRCo_a6X4UH6NU5';
    
    // Find Informes Word
    const informesWord = await findFolder('Informes Word', rootId);
    if (!informesWord) return console.log('Informes Word not found');
    
    const chinchaysullo = await findFolder('PAD_CHINCHAYSULLO_INTERNAL', informesWord.id);
    if (!chinchaysullo) return console.log('PAD_CHINCHAYSULLO_INTERNAL not found');
    
    const julio = await findFolder('Plantilla PAD CHINCHAYSULLO Julio 2026', chinchaysullo.id);
    if (!julio) {
      console.log('Julio folder not found. Listing all folders in PAD_CHINCHAYSULLO_INTERNAL:');
      const folders = await drive.files.list({q: `'${chinchaysullo.id}' in parents and trashed=false`, fields: 'files(name)'});
      console.log(folders.data.files.map(f => f.name));
      return;
    }
    
    const files = await listFilesInFolder(julio.id);
    console.log(`Found ${files.length} files in Julio folder`);
    fs.writeFileSync('drive_julio_files.json', JSON.stringify(files, null, 2));
  } catch(e) {
    console.error(e);
  }
}

main();
