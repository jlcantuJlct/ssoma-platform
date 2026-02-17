
import { getObjectiveDetails } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ActivityItem from "@/components/ActivityItem";
import { notFound } from "next/navigation";

export default async function ObjectivePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const objective = await getObjectiveDetails(id);

    if (!objective) {
        return notFound();
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Volver al Dashboard
            </Link>

            <header className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    {objective.name}
                </h1>
                <p className="text-muted-foreground mt-4 max-w-3xl">
                    {objective.description}
                </p>
            </header>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Detalle de Actividades</h2>
                <div className="space-y-4">
                    {objective.activities?.map((act) => (
                        <ActivityItem key={act.id} activity={act} />
                    ))}
                    {(!objective.activities || objective.activities.length === 0) && (
                        <p className="text-muted-foreground italic">No hay actividades registradas.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
