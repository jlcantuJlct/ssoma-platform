import { Suspense } from "react";
import EvidenceCenter from "@/components/dashboard/EvidenceCenter";
import { DashboardData } from "@/lib/types";
import fs from "fs";
import path from "path";
import { parseCSV } from "@/lib/csv-parser";

async function getDashboardData() {
    const filePath = path.join(process.cwd(), "public", "data.csv");
    try {
        const csvContent = fs.readFileSync(filePath, "utf-8");
        return parseCSV(csvContent);
    } catch (error) {
        console.error("Error reading CSV for evidence:", error);
        return { sections: [] };
    }
}

export default async function EvidencePage() {
    const dashboardData = await getDashboardData();

    // ELIMINAR DUPLICADOS: Filtrar secciones por ID único
    const uniqueSections = dashboardData.sections.filter((section, index, self) =>
        index === self.findIndex((s) => s.id === section.id)
    );

    return (
        <Suspense fallback={<div className="p-20 text-center font-black animate-pulse text-slate-500 uppercase tracking-widest">Sincronizando Archivos SSOMA...</div>}>
            <EvidenceCenter data={{ ...dashboardData, sections: uniqueSections }} />
        </Suspense>
    );
}
