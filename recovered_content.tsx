const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        const str = JSON.stringify(obj);
        if (str.includes('const KIT_ITEMS_MAPPING')) {
            console.log('Found KIT_ITEMS_MAPPING at index', i);
            fs.writeFileSync('recovered_log_' + i + '.json', lines[i]);
            break;
        }
    } catch(e) {}
}