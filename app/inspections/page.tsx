import ClientPage from './ClientPage';
import { getInspections, getMonthlyProgram } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
    let inspections = [];
    let program = [];
    
    try {
        const [inspectionsRes, programRes] = await Promise.all([
            getInspections(),
            getMonthlyProgram()
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
