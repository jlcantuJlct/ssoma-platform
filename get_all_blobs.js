require('dotenv').config({path: '.env.prod'});
const { list } = require('@vercel/blob');
const fs = require('fs');

async function getAllBlobs() {
  let allBlobs = [];
  let cursor;
  
  do {
    const res = await list({ limit: 1000, cursor });
    allBlobs = allBlobs.concat(res.blobs);
    cursor = res.cursor;
    console.log(`Fetched ${res.blobs.length} blobs, total so far: ${allBlobs.length}`);
  } while (cursor);
  
  fs.writeFileSync('all_blobs.json', JSON.stringify(allBlobs, null, 2));
  console.log(`Saved ${allBlobs.length} blobs total`);
}

getAllBlobs().catch(console.error);
