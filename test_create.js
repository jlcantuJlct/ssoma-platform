fetch("http://localhost:3000/api/levantamiento/create", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        moduleName: "Campamento",
        template: {"test": "NC"},
        answers: {},
        inspectionRecordId: 999,
        hallazgos: [{
            index: 0,
            descripcion: "Test NC",
            riesgo: "Medio",
            categoria: "Condición Subestándar",
            responsable: "Test",
            responsableEmail: "test@test.com",
            fecha: "2026-09-30",
            fotosDefectos: {}
        }]
    })
}).then(r => r.text()).then(console.log).catch(console.error);
