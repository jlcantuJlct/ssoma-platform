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

  // 1. Add uploadProgress state if not exists
  if (!content.includes('uploadProgress')) {
    content = content.replace(
      /const \[isUploading, setIsUploading\] = useState\(false\);/g,
      "const [isUploading, setIsUploading] = useState(false);\n    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });"
    );
  }

  // 2. Add progress initialization
  if (!content.includes('setUploadProgress({ current: 0')) {
    content = content.replace(
      /const uploadedUrls: string\[\] = \[\];\s*const filesArray = Array\.from\(inputFiles\);/g,
      "const uploadedUrls: string[] = [];\n            const filesArray = Array.from(inputFiles);\n            setUploadProgress({ current: 0, total: filesArray.length });"
    );
  }

  // 3. Add progress increment inside the loop
  if (!content.includes('prev.current + 1')) {
    // For `handleFileUpload` loops
    content = content.replace(
      /for \(const file of filesArray\) \{/g,
      "for (const file of filesArray) {\n                setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));"
    );
  }

  // 4. Update "SUBIENDO..." text in UI
  content = content.replace(
    /\{isUploading \? 'SUBIENDO\.\.\.' :/g,
    "{isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` :"
  );

  // 5. Clean up duplicate if statements
  content = content.replace(
    /if \(e\.target && e\.target\.type === 'file'\) if \(e\.target && e\.target\.type === 'file'\) e\.target\.value = '';/g,
    "if (e.target && e.target.type === 'file') e.target.value = '';"
  );
  
  // also fix some pages which might have `let file of filesArray` instead of `const file of filesArray`? 
  // We used `const file of filesArray` in the regex above, which matches standard loops in this app.

  // Also replace standard `e as any` cast in handleFileUpload
  content = content.replace(
    /const inputFiles = \(e\.target\?\.files \|\| e\.dataTransfer\?\.files\)/g,
    "const inputFiles = e.target?.files || e.dataTransfer?.files"
  );

  // Also catch specific upload errors without crashing
  // ... this might be too complex for regex. Let's just do progress for now.

  if (content !== originalContent) {
    fs.writeFileSync(f, content);
    console.log('Modified:', f);
    modifiedCount++;
  }
});

console.log('Total files modified for progress:', modifiedCount);
