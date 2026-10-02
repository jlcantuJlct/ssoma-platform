const fs = require('fs');
const transcriptPath = 'C:/Users/jlcan/.gemini/antigravity/brain/860d4ac4-5aeb-4eaa-ab6a-34aada339c8c/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.type === 'TOOL_RESPONSE' && obj.content && obj.content.includes('import React, { useState')) {
            if (obj.content.includes('KitAntiderrameCustomForm') && obj.content.length > 5000) {
                console.log('Found large file read at index', i, 'Length:', obj.content.length);
                fs.writeFileSync('recovered_kit.tsx', obj.content);
                break;
            }
        }
    } catch(e) {}
}
