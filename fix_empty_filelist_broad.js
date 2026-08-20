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

  // Broadly fix the empty FileList bug where e.target.files is empty FileList (truthy) blocking e.dataTransfer.files
  content = content.replace(
    /e\.target\?\.files \|\| e\.dataTransfer\?\.files/g,
    "(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) ? e.dataTransfer.files : e.target?.files"
  );

  if (content !== originalContent) {
    fs.writeFileSync(f, content);
    console.log('Fixed:', f);
    modifiedCount++;
  }
});

console.log('Total files fixed:', modifiedCount);
