import { getInspections } from '@/app/actions';

export default async function TestPage() {
    const res = await getInspections();
    return (
        <div>
            <h1>Test Inspections</h1>
            <pre id="data">{JSON.stringify(res, null, 2)}</pre>
        </div>
    );
}
