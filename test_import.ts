import { POST as handleExportExcel } from '@/app/api/export-excel/route';

const mockReq = new Request('http://localhost:3000/api/export-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleName: 'test', template: [], answers: [], saveToDrive: false })
});
handleExportExcel(mockReq).then(async (res) => {
    console.log(await res.json());
}).catch(console.error);
