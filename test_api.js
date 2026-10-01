fetch("http://localhost:3000/api/export-excel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleName: "Campamento", isCampamentoMatrix: true, saveToDrive: true })
})
.then(res => res.text())
.then(text => console.log(text.substring(0, 100)))
.catch(err => console.error(err));
