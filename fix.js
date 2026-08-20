const fs = require('fs');
let content = fs.readFileSync('app/generador-informes/page.tsx', 'utf-8');

const docTypes = {
  'loadSanClemente': 'PAD_SAN_CLEMENTE_INTERNAL.docx',
  'loadChinchaysullo': 'PAD_CHINCHAYSULLO_INTERNAL.docx',
  'loadJahuay': 'PAD_JAHUAY_INTERNAL.docx',
  'loadBarandas': 'PAD_BARANDAS_INTERNAL.docx'
};

for (const [funcName, docName] of Object.entries(docTypes)) {
  const regex = new RegExp(`(const ${funcName} = useCallback.*?setTimeout\\(\\(\\) => \\{[\\s]*setTags\\(detected\\);)([\\s]*setStatus\\(\\{ stage: 'ready')`, 's');
  content = content.replace(regex, `$1\n            loadDraft('${docName}', detected);$2`);
  
  const regexDep = new RegExp(`(const ${funcName} = useCallback.*?setTimeout.*?\\}, 300\\);(?: //.*?)?\\r?\\n[\\s]*\\}, )\\[\\]\\);`, 's');
  content = content.replace(regexDep, `$1[loadDraft]);`);
}

fs.writeFileSync('app/generador-informes/page.tsx', content);
console.log('Replaced successfully');
