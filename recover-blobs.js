
const { list } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const { blobs } = await list({ limit: 1000 });
  console.log(JSON.stringify(blobs.slice(0, 5), null, 2));
  console.log('Total blobs:', blobs.length);
  const fs = require('fs');
  fs.writeFileSync('blobs_backup.json', JSON.stringify(blobs, null, 2));
})();
