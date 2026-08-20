import client from './lib/db';

async function run() {
    const records = await client.fetchAll("SELECT objective_id, data_json FROM annual_program");
    const dbData: any = {};
    records.forEach((r: any) => {
        dbData[r.objective_id] = r.data_json ? JSON.parse(r.data_json) : [];
    });
    console.log("obj1 count:", dbData['obj1']?.length);
    console.log("obj2 count:", dbData['obj2']?.length);
    console.log("obj3 count:", dbData['obj3']?.length);
}
run();
