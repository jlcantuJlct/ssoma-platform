const { google } = require('googleapis');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function searchGlobal(name) {
  const res = await drive.files.list({ q: `name contains '${name}' and trashed=false`, fields: 'files(id, name, mimeType, parents)' });
  return res.data.files;
}

async function main() {
  try {
    const files = await searchGlobal('CHINCHAYSULLO');
    console.log(files);
  } catch(e) {
    console.error(e);
  }
}

main();
