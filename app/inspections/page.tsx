import ClientPage from './ClientPage';
import { getInspections, getMonthlyProgram } from '@/app/actions';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Page() {
    let inspections = [];
    let program = [];
    
    try {
        const cookieStore = await cookies();
        const cookieWs = cookieStore.get('ssoma_workspace')?.value;
        const workspace = cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6';

        const [inspectionsRes, programRes] = await Promise.all([
            getInspections(workspace),
            getMonthlyProgram(workspace)
        ]);
        
        if (inspectionsRes && inspectionsRes.success) {
            inspections = inspectionsRes.data;
        }
        
        if (programRes && programRes.success) {
            program = programRes.data;
        }
    } catch (error) {
        console.error('Error fetching data for inspections page:', error);
    }

    return <ClientPage initialInspections={inspections} initialProgram={program} />;
}
