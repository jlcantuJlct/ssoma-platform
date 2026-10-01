(async () => {
    try {
        const res = await fetch("http://localhost:3000/api/export-excel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moduleName: "Campamento", isCampamentoMatrix: true, saveToDrive: true })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text.substring(0, 200));
    } catch (e) {
        console.error(e);
    }
})();
