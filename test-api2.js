const data = {
    moduleName: 'Kit Antiderrame',
    isKitAntiderrameMatrix: true,
    meta: { proyecto: 'TEST' },
    kits: [{ codigo: 'K1', ubicacion: 'Loc1', items: {} }],
    saveToDrive: true
};
fetch('http://localhost:3000/api/export-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(r => r.json())
.then(d => {
    console.log('Success:', d.success);
    console.log('Drive URL:', d.driveUrl);
    console.log('Base64 length:', d.fileBase64 ? d.fileBase64.length : 'none');
})
.catch(console.error);
