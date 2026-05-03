const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

// Find all JSX components <Component ...
const jsxMatches = content.match(/<([A-Z][a-zA-Z0-9]*)/g) || [];
const componentsUsed = new Set(jsxMatches.map(m => m.substring(1)));

// Find all imports
const importMatches = content.match(/import\s+{[^}]+}\s+from/g) || [];
const importedNames = new Set();
importMatches.forEach(m => {
    const names = m.match(/{([^}]+)}/)[1].split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts[parts.length - 1];
    });
    names.forEach(n => importedNames.add(n));
});

// Also check default imports
const defaultImportMatches = content.match(/import\s+([A-Z][a-zA-Z0-9]*)\s+from/g) || [];
defaultImportMatches.forEach(m => {
    const name = m.match(/import\s+([A-Z][a-zA-Z0-9]*)/)[1];
    importedNames.add(name);
});

// Local definitions (e.g. interface, function, const)
const localMatches = content.match(/(const|function|interface|class|type)\s+([A-Z][a-zA-Z0-9]*)/g) || [];
localMatches.forEach(m => {
    const name = m.match(/(const|function|interface|class|type)\s+([A-Z][a-zA-Z0-9]*)/)[2];
    importedNames.add(name);
});

// Built-in React or standard ones to ignore
const ignore = new Set(['Fragment', 'Suspense', 'Portal', 'Profiler', 'StrictMode', 'Array', 'String', 'Number', 'Object', 'Date', 'Math', 'RegExp', 'Error', 'Promise', 'JSON', 'Intl', 'Set', 'Map', 'WeakSet', 'WeakMap', 'Symbol', 'Reflect', 'Proxy', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array', 'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Atomics', 'WebAssembly']);

const missing = [];
componentsUsed.forEach(c => {
    if (!importedNames.has(c) && !ignore.has(c)) {
        missing.push(c);
    }
});

console.log('Missing components in ' + filePath + ':');
console.log(missing);
