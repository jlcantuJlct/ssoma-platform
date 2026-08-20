const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('app');
let modifiedFiles = 0;
let addedNames = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let originalContent = content;

    // We will match tags: <input, <select, <textarea, <SearchableSelect
    // Then we look for value={something} to derive a name.
    
    const regex = /<(input|select|textarea|SearchableSelect)(\s+[^>]+?)>/g;
    
    content = content.replace(regex, (match, tag, attrs) => {
        // If it already has a name, skip
        if (attrs.match(/\sname=/)) {
            return match;
        }

        // Try to find value={something}
        const valueMatch = attrs.match(/value=\{([^}]+)\}/);
        let nameVal = '';
        if (valueMatch) {
            // e.g. form.date -> form_date, or filterResponsible -> filterResponsible
            let valExp = valueMatch[1].trim();
            // simple sanitization
            valExp = valExp.replace(/[^a-zA-Z0-9_]/g, '_');
            // remove multiple underscores
            valExp = valExp.replace(/_+/g, '_').replace(/^_|_$/g, '');
            if (valExp.length > 0) {
                nameVal = valExp;
            }
        }

        if (!nameVal) {
            // Try to find onChange={e => setSomething(e.target.value)}
            const onChangeMatch = attrs.match(/onChange=\{.*?set([A-Z][a-zA-Z0-9]*)/);
            if (onChangeMatch) {
                nameVal = onChangeMatch[1].toLowerCase();
            } else {
                // generate random or generic
                nameVal = tag + '_' + Math.floor(Math.random() * 100000);
            }
        }

        addedNames++;
        // insert name="nameVal" after the tag name
        return `<${tag} name="${nameVal}"${attrs}>`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(f, content, 'utf8');
        modifiedFiles++;
        console.log('Modified', f);
    }
});

console.log(`Added ${addedNames} names across ${modifiedFiles} files.`);
