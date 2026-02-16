import { Suspense } from 'react';
import { parseCSV } from "@/lib/csv-parser";
import fs from "fs";
import path from "path";
import AnalyticsClient from "@/components/dashboard/AnalyticsClient";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
    const filePath = path.join(process.cwd(), "public", "data.csv");

    try {
        const csvContent = fs.readFileSync(filePath, "utf-8");
        return parseCSV(csvContent);
    } catch (error) {
        console.error("Error reading CSV:", error);
        return { sections: [] };
    }
}

export default async function AnalyticsPage() {
    const dashboardData = await getDashboardData();
    const allActivities = dashboardData.sections.flatMap(s => s.activities);

    return (
        <div className="flex h-screen bg-transparent">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    <Suspense fallback={<div className="text-white">Cargando Analytics...</div>}>
                        <AnalyticsClient activities={allActivities} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
