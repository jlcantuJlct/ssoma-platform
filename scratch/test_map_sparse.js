const arr = [ , "hello"];
const mapped = arr.map(x => String(x || ''));
console.log("Array length:", arr.length);
console.log("Mapped length:", mapped.length);
console.log("Index 0 in mapped:", mapped[0]);
console.log("Index 0 in arr exists:", 0 in arr);
console.log("Index 0 in mapped exists:", 0 in mapped);

const mapped2 = Array.from(arr).map(x => String(x || ''));
console.log("Mapped2 Index 0 exists:", 0 in mapped2);
