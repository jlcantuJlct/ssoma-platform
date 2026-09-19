const fs = require('fs');
const payload = {
    moduleName: "Inspecciones Internas SSOMA",
    version: "1.0",
    template: [
        { text: 'Razon:', type: 'question' }, { text: 'Ruc:', type: 'question' }, { text: 'Domicilio:', type: 'question' }, { text: 'Actividad:', type: 'question' }, { text: 'Trabajadores:', type: 'question' },
        { text: 'Proyecto:', type: 'question' }, { text: 'Dirección:', type: 'question' },
        { text: 'Responsable Área:', type: 'question' }, { text: 'Área:', type: 'question' },
        { text: 'Tipo:', type: 'question' }, { text: 'Hora:', type: 'question' }, { text: 'Fecha:', type: 'question' },
        { text: 'Responsables:', type: 'question' }, { text: 'Hallazgos:', type: 'question' },
        { text: 'Conclusiones:', type: 'question' }, { text: 'RegNombre:', type: 'question' },
        { text: 'RegCargo:', type: 'question' }, { text: 'RegFecha:', type: 'question' }, { text: 'RegFirma:', type: 'question' }
    ],
    answers: [
        { text: "Mi Razon Social Test" }, { text: "123456789" }, { text: "Mi Casa" }, { text: "Dev" }, { text: "100" },
        { text: "Proy 1" }, { text: "Dir 1" }, { text: "Resp 1" }, { text: "Area 1" },
        { text: "Planeada" }, { text: "10:00" }, { text: "2023-01-01" }, { text: "[\"RespA\", \"RespB\"]" },
        { text: "[]" }, { text: "Todo ok" }, { text: "Juan" },
        { text: "Jefe" }, { text: "2023-01-01" }, { signature: "" }
    ]
};

fetch('http://localhost:3006/api/export-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(res => res.arrayBuffer())
.then(buffer => {
    fs.writeFileSync('test_output.xlsx', Buffer.from(buffer));
    console.log('Saved to test_output.xlsx');
})
.catch(err => console.error(err));
