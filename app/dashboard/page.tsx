import Link from "next/link"; // Rebuild trigger - v2.4 Premium UI & HHC Fix
import fs from "fs";
import path from "path";
import { parseCSV } from "@/lib/csv-parser";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = 'force-dynamic';

// Function to read and parse CSV
import { getDashboardActivities, syncInitialData } from "@/app/actions";

// Function to read and parse CSV and SEED DB if empty
async function seedAndGetData() {
  // 1. Check if DB has data
  try {
    const dbRes = await getDashboardActivities();
    if (dbRes.success && dbRes.data.length > 0) {
      // DB is already populated.
      // We can return an empty structure or the CSV data just for SSR placeholder, 
      // but DashboardClient will fetch latest from DB anyway.
      // Let's return CSV data as a consistent initial state for hydration match if possible,
      // OR just return what we have to be safe.
    } else {
      console.log("[SERVER] DB Empty. Seeding from CSV...");
      const filePath = path.join(process.cwd(), "public", "data.csv");
      const csvContent = fs.readFileSync(filePath, "utf-8");
      const parsedData = parseCSV(csvContent);

      if (parsedData && parsedData.sections) {
        const flatActivities = parsedData.sections.flatMap((s: any) => s.activities.map((a: any) => ({
          ...a,
          managementArea: s.id === 'scsst' ? 'safety' : s.id // rough mapping matching Client logic
        })));

        await syncInitialData(flatActivities);
        console.log("[SERVER] DB Seeded Successfully.");
      }
      return parsedData;
    }
  } catch (e) {
    console.error("Error checking/seeding DB:", e);
  }

  // Fallback: Just return CSV data (DB might be populated now or failed, but we show CSV content)
  const filePath = path.join(process.cwd(), "public", "data.csv");
  try {
    const csvContent = fs.readFileSync(filePath, "utf-8");
    return parseCSV(csvContent);
  } catch (error) {
    console.error("Error reading CSV:", error);
    return { sections: [] };
  }
}

export default async function Home() {
  const dashboardData = await seedAndGetData();

  return (
    <div className="p-8 space-y-8 min-h-screen bg-transparent">
      {/* Header Removed - Integrated into DashboardClient */}
      <h1 className="text-center text-xs text-gray-500 font-bold text-emerald-500">v2026.5.05 - MULTI-FILE & PDF-JS READY</h1>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 mt-4 mx-auto max-w-4xl rounded shadow-sm text-center font-bold text-lg animate-pulse">
        🚨 ALERTA: Tienes hasta el 18 de Julio para cancelar el Plan Pro de Supabase 🚨
      </div>

      {/* Main Client Dashboard */}
      <DashboardClient initialData={dashboardData} />
    </div>
  );
}
