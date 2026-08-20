const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app');
let modifiedCount = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;
  
  // Signature type 1: (e: React.ChangeEvent<HTMLInputElement>)
  content = content.replace(/const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{\s*const inputFiles = e\.target\.files;\s*if \(!inputFiles\) return;/g, 
    `const handleFileUpload = async (e: any) => {\n        const inputFiles = e.target?.files || e.dataTransfer?.files;\n        if (!inputFiles || inputFiles.length === 0) return;`);
  
  // Signature type 2: (e: React.ChangeEvent<HTMLInputElement>, type: 'img' | 'pdf')
  content = content.replace(/const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>, type: 'img' \| 'pdf'\) => \{\s*const selectedFile = e\.target\.files\?\.\[0\];\s*if \(!selectedFile\) return;/g,
    `const handleFileUpload = async (e: any, type: 'img' | 'pdf') => {\n        const selectedFile = (e.target?.files || e.dataTransfer?.files)?.[0];\n        if (!selectedFile) return;`);
  
  // Reset targets
  content = content.replace(/e\.target\.value = '';/g, "if (e.target && e.target.type === 'file') e.target.value = '';");

  if (content !== originalContent) {
    fs.writeFileSync(f, content);
    console.log('Modified:', f);
    modifiedCount++;
  }
});
console.log('Total files modified:', modifiedCount);
