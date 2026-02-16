"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardData, Section, Activity, AuditLog, MONTHS } from "@/lib/types";
import { ActivityTable } from "./ActivityList";
import { TableView } from "./TableView";
import { DashboardCharts } from "./DashboardCharts";
import { uploadEvidence, getDashboardActivities, updateDashboardActivity, syncInitialData } from "@/app/actions";
import jsPDF from "jspdf";
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';
import { categorizeActivitiesByObjective, OBJECTIVES_CONFIG } from "@/lib/objective-categorization";
import { exportToPDF } from "@/lib/exportUtils";
import {
    LayoutDashboard,
    FileText,
    ClipboardCheck,
    Siren,
    Activity as ActivityIcon,
    Users,
    Filter,
    Grid,
    List,
    Target,
    Download,
    History,
    ShieldCheck,
    X,
    Upload,
    Save,
    Image as ImageIcon,
    TrendingUp
} from "lucide-react";

interface DashboardClientProps {
    initialData: DashboardData;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
    'scsst': <Users size={16} />,
    'training': <FileText size={16} />,
    'inspections': <ClipboardCheck size={16} />,
    'rac': <Siren size={16} />,
    'health': <ActivityIcon size={16} />,
    'environment': <TrendingUp size={16} />,
};

const MONTHS_FULL = ['Todos', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function DashboardClient({ initialData }: DashboardClientProps) {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-black animate-pulse">Cargando Sistema SSOMA...</div>}>
            <DashboardContent initialData={initialData} />
        </Suspense>
    );
}

function DashboardContent({ initialData }: DashboardClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // ELIMINAR DUPLICADOS: Filtrar secciones por ID único
    const uniqueSections = initialData.sections.filter((section, index, self) =>
        index === self.findIndex((s) => s.id === section.id)
    );

    const [data, setData] = useState<DashboardData>({ ...initialData, sections: uniqueSections });
    const [activeSectionId, setActiveSectionId] = useState<string>(uniqueSections[0]?.id || '');
    const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');

    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(-1);
    const [evidenceModal, setEvidenceModal] = useState<{ activity: Activity, month: number } | null>(null);

    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('todos');

    const [activeManagement, setActiveManagement] = useState<string>(searchParams.get('area') || 'todos');
    const [showAnalytics, setShowAnalytics] = useState(false);

    // PERSISTENCIA E HIDRATACIÓN DB
    useEffect(() => {
        // 1. Try to load from DB first (Source of Truth)
        getDashboardActivities().then(res => {
            if (res.success && res.data.length > 0) {
                // DB has data, use it (and ignore local storage mostly)
                console.log("Loaded data from DB");
                const dbActivities = res.data;

                // Reconstruct sections structure if needed, or just map DB activities to current sections
                // Since we have fixed sections (SCSST, etc), we map activities to them
                // For now, let's merge with initial data structure

                setData(prev => {
                    const newData = JSON.parse(JSON.stringify(prev));
                    // Clear previous activities from sections to avoid dups before refilling?
                    // Or better: Rebuild sections from DB activities

                    // Helper: Group by whatever logic or just mapping IDs
                    // Simpler approach for now: Use the DB activities to update values in current structure
                    // But if activities were added/removed, we need to reflect that.

                    // Let's rely on mapping by ID if possible, or just replacing the lists.
                    // DB "merged" result returns a flat list of activities with 'managementArea' and 'objectiveId'.
                    // We need to redistribute them to sections.

                    newData.sections.forEach((sec: Section) => {
                        // Find activities belonging to this section (by area or id match?)
                        // The original code grouped by 'scsst', 'health', etc. 
                        // Our DB 'area' maps to managementArea.
                        // But unique sections logic in frontend is slightly complex.

                        // FALLBACK: Load values into existing structure
                        sec.activities.forEach((act: Activity) => {
                            const dbAct = dbActivities.find((d: any) => d.id === act.id || d.name === act.name); // Name fallback
                            if (dbAct) {
                                act.data = dbAct.data;
                                act.evidence = dbAct.evidence;
                                // Update ID if needed to match DB UUID
                                if (dbAct.id !== act.id) act.id = dbAct.id;
                            }
                        });
                    });
                    return newData;
                });

            } else {
                // 2. DB is empty. Check LocalStorage
                const storedData = localStorage.getItem('dashboard_data_v1');
                if (storedData) {
                    try {
                        const parsed = JSON.parse(storedData);
                        if (parsed && parsed.sections) {
                            console.log("Loaded from LocalStorage (DB Empty). Syncing up...");
                            setData(parsed);

                            // 3. TRIGGER SYNC TO DB (Migration)
                            const flatActivities = parsed.sections.flatMap((s: any) => s.activities.map((a: any) => ({
                                ...a,
                                managementArea: s.id === 'scsst' ? 'safety' : s.id // rough mapping
                            })));

                            syncInitialData(flatActivities).then(r => {
                                if (r.success) console.log("Initial Sync to DB Complete");
                            });
                        }
                    } catch (e) { console.error(e); }
                } else {
                    // 4. LocalStorage is empty too (First run ever?) -> Use InitialData (CSV) and Sync
                    console.log("Using CSV Initial Data. Syncing up...");
                    const flatActivities = initialData.sections.flatMap((s: any) => s.activities.map((a: any) => ({
                        ...a,
                        managementArea: s.id === 'scsst' ? 'safety' : s.id
                    })));
                    syncInitialData(flatActivities);
                }
            }
        });
    }, []);

    // Save to LocalStorage as Backup (optional, kept for resilience)
    useEffect(() => {
        if (data.sections.length > 0) {
            localStorage.setItem('dashboard_data_v1', JSON.stringify(data));
        }
    }, [data]);

    // Sincronizar con URL params para Sidebar persistente
    useEffect(() => {
        const view = searchParams.get('view');
        const section = searchParams.get('section');
        const area = searchParams.get('area');

        if (view === 'grid') setViewMode('grid');
        else if (view === 'cards') setViewMode('cards');

        if (view === 'analytics' || view === 'control_hhc') {
            setShowAnalytics(true);
        } else {
            setShowAnalytics(false);
        }

        if (section && uniqueSections.some(s => s.id === section)) {
            setActiveSectionId(section);
        }

        if (area) {
            setActiveManagement(area);
        } else {
            setActiveManagement('todos');
            setActiveSectionId('todos');
            if (!view || view === 'analytics') {
                setShowAnalytics(true);
            }
        }
    }, [searchParams, uniqueSections]);

    const handleManagementChange = (management: string) => {
        setActiveManagement(management);
        const params = new URLSearchParams(searchParams.toString());

        if (management === 'todos') {
            params.delete('area');
            params.set('section', 'todos');
        } else {
            params.set('area', management);
            // Default sub-section for each area
            if (management === 'safety') params.set('section', 'scsst');
            if (management === 'health') params.set('section', 'health');
            if (management === 'environment') params.set('section', 'environment');
        }

        router.push(`?${params.toString()}`);
    };

    const handleSectionChange = (id: string, area?: string) => {
        setActiveSectionId(id);
        const params = new URLSearchParams(searchParams.toString());
        params.set('section', id);
        if (area) params.set('area', area);
        router.push(`?${params.toString()}`);
    };

    // Virtual 'TODOS' section logic
    const isAllSelected = activeSectionId === 'todos' || searchParams.get('section') === 'todos';

    const activeArea = searchParams.get('area') || 'safety';

    // Lógica de filtrado por área para entrenamiento e inspecciones
    const getFilteredActivities = (activities: Activity[], sectionId: string, area: string) => {
        if (sectionId === 'todos') return activities; // MOSTRAR TODO
        if (sectionId !== 'training' && sectionId !== 'inspections') return activities;

        const healthKeywords = ["salud", "ergonomía", "médico", "auxilios", "covid", "hipoacusia", "respiratorias", "mental", "sshh", "hidratación", "ambulancia", "emo", "mental", "psicosociales"];
        const envKeywords = ["ambiental", "residuos", "polvo", "agua", "medio ambiente", "matpel", "flora", "fauna", "cisterna", "kit", "segregación", "fauna", "riego"];

        if (area === 'health') {
            return activities.filter(a => healthKeywords.some(key => a.name.toLowerCase().includes(key)));
        } else if (area === 'environment') {
            return activities.filter(a => envKeywords.some(key => a.name.toLowerCase().includes(key)));
        } else {
            // Safety: El resto (que no sea salud ni ambiente)
            return activities.filter(a =>
                !healthKeywords.some(key => a.name.toLowerCase().includes(key)) &&
                !envKeywords.some(key => a.name.toLowerCase().includes(key))
            );
        }
    };

    // Aggregate activities if 'TODOS' is selected with area context
    const allActivities: Activity[] = data.sections.flatMap(s => {
        let area = 'safety';
        if (s.id === 'health') area = 'health';
        if (s.id === 'environment') area = 'environment';
        // For others, try to infer or default to safety if the section name suggests it
        // But here we want a clear categorization
        const contextArea = (s.id === 'health' || s.id === 'training' && activeArea === 'health' || s.id === 'inspections' && activeArea === 'health') ? 'health' :
            (s.id === 'environment' || s.id === 'training' && activeArea === 'environment' || s.id === 'inspections' && activeArea === 'environment') ? 'environment' : 'safety';

        return s.activities.map(a => ({ ...a, managementArea: contextArea }));
    });

    // Group activities for analytics and "todos" view
    const groupedActivities = [
        // Safety activities
        ...data.sections.find(s => s.id === 'scsst')?.activities.map(a => ({ ...a, managementArea: 'safety' })) || [],
        ...data.sections.find(s => s.id === 'rac')?.activities.map(a => ({ ...a, managementArea: 'safety' })) || [],
        ...data.sections.find(s => s.id === 'training')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const healthKeywords = ["salud", "ergonomía", "médico", "auxilios", "covid", "hipoacusia", "respiratorias", "mental", "sshh", "hidratación", "ambulancia", "emo", "psicosociales"];
                const envKeywords = ["ambiental", "residuos", "polvo", "agua", "medio ambiente", "matpel", "flora", "fauna", "cisterna", "kit", "segregación", "riego"];
                return !healthKeywords.some(k => name.includes(k)) && !envKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'safety' })) || [],
        ...data.sections.find(s => s.id === 'inspections')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const healthKeywords = ["salud", "ergonomía", "médico", "auxilios", "covid", "hipoacusia", "respiratorias", "mental", "sshh", "hidratación", "ambulancia", "emo", "psicosociales"];
                const envKeywords = ["ambiental", "residuos", "polvo", "agua", "medio ambiente", "matpel", "flora", "fauna", "cisterna", "kit", "segregación", "riego"];
                return !healthKeywords.some(k => name.includes(k)) && !envKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'safety' })) || [],

        // Health activities
        ...data.sections.find(s => s.id === 'health')?.activities.map(a => ({ ...a, managementArea: 'health' })) || [],
        ...data.sections.find(s => s.id === 'training')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const healthKeywords = ["salud", "ergonomía", "médico", "auxilios", "covid", "hipoacusia", "respiratorias", "mental", "sshh", "hidratación", "ambulancia", "emo", "psicosociales"];
                return healthKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'health' })) || [],
        ...data.sections.find(s => s.id === 'inspections')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const healthKeywords = ["salud", "ergonomía", "médico", "auxilios", "covid", "hipoacusia", "respiratorias", "mental", "sshh", "hidratación", "ambulancia", "emo", "psicosociales"];
                return healthKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'health' })) || [],

        // Environment activities
        ...data.sections.find(s => s.id === 'environment')?.activities.map(a => ({ ...a, managementArea: 'environment' })) || [],
        ...data.sections.find(s => s.id === 'training')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const envKeywords = ["ambiental", "residuos", "polvo", "agua", "medio ambiente", "matpel", "flora", "fauna", "cisterna", "kit", "segregación", "riego"];
                return envKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'environment' })) || [],
        ...data.sections.find(s => s.id === 'inspections')?.activities
            .filter(a => {
                const name = a.name.toLowerCase();
                const envKeywords = ["ambiental", "residuos", "polvo", "agua", "medio ambiente", "matpel", "flora", "fauna", "cisterna", "kit", "segregación", "riego"];
                return envKeywords.some(k => name.includes(k));
            })
            .map(a => ({ ...a, managementArea: 'environment' })) || []
    ];

    const activeSectionRaw = isAllSelected
        ? { id: 'todos', title: 'VISIÓN INTEGRAL SSOMA', activities: groupedActivities } as Section
        : (data.sections.find(s => s.id === activeSectionId) || data.sections[0]);


    const filteredActivities = getFilteredActivities(activeSectionRaw.activities, activeSectionRaw.id, activeArea);

    const areaLabels: Record<string, string> = {
        'safety': 'Seguridad',
        'health': 'Salud',
        'environment': 'Medio Ambiente'
    };

    const isYear2026 = selectedYear === 2026;

    const activeSection = {
        ...activeSectionRaw,
        activities: !isYear2026
            ? filteredActivities.map(a => ({ ...a, data: { plan: new Array(12).fill(0), executed: new Array(12).fill(0) } }))
            : filteredActivities,
        title: isAllSelected
            ? activeSectionRaw.title
            : (activeSectionRaw.id === 'training' || activeSectionRaw.id === 'inspections')
                ? `${activeSectionRaw.title} - Gestión de ${areaLabels[activeArea]}`
                : activeSectionRaw.title
    };

    const addAuditLog = (activity: Activity, action: string) => {
        const now = new Date();
        const newLog: AuditLog = {
            user: "usuario.google@ssoma-corp.com",
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            action: action
        };
        return [newLog, ...(activity.history || [])].slice(0, 15);
    };

    const handleUpdateActivityValue = (activityId: string, monthIndex: number, type: 'plan' | 'executed', value: number, isAdditive: boolean = false) => {
        const newData = JSON.parse(JSON.stringify(data));
        const sIdx = newData.sections.findIndex((s: any) => s.id === activeSectionId);
        const aIdx = newData.sections[sIdx].activities.findIndex((a: any) => a.id === activityId);
        const activity = newData.sections[sIdx].activities[aIdx];

        const currentValue = type === 'plan' ? activity.data.plan[monthIndex] : activity.data.executed[monthIndex];
        const newValue = isAdditive ? currentValue + value : value;

        if (type === 'plan') activity.data.plan[monthIndex] = newValue;
        else activity.data.executed[monthIndex] = newValue;

        activity.data.plan[monthIndex] = newValue; // Optimistic Update

        if (type === 'plan') activity.data.plan[monthIndex] = newValue;
        else activity.data.executed[monthIndex] = newValue;

        activity.history = addAuditLog(activity, `REGISTRO: ${type.toUpperCase()} [${MONTHS[monthIndex]}]: ${currentValue} -> ${newValue} (${isAdditive ? 'Adición' : 'Reemplazo'})`);

        setData(newData);

        // Server Sync
        updateDashboardActivity(activityId, monthIndex, type, newValue).then(res => {
            if (!res.success) {
                // Revert on failure? For now just alert or log
                console.error("Failed to sync update to server");
            }
        });
    };

    const handleUpdateActivityName = (activityId: string, newName: string) => {
        const newData = JSON.parse(JSON.stringify(data));
        const sIdx = newData.sections.findIndex((s: any) => s.id === activeSectionId);
        const aIdx = newData.sections[sIdx].activities.findIndex((a: any) => a.id === activityId);
        const activity = newData.sections[sIdx].activities[aIdx];
        activity.history = addAuditLog(activity, `RENOMBRADO: "${activity.name}" -> "${newName}"`);
        activity.name = newName;
        setData(newData);
    };

    const handleUploadEvidence = async (file: File | string, actId?: string, mIdx?: number) => {
        const targetActId = actId || evidenceModal?.activity.id;
        const targetMIdx = mIdx !== undefined ? mIdx : evidenceModal?.month;
        if (!targetActId || targetMIdx === undefined) return;

        let fileName = typeof file === 'string' ? file : file.name;
        let filePath = fileName;

        // Perform Server Upload if it's a File object
        if (file instanceof File) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('activityId', targetActId);
                formData.append('month', targetMIdx.toString());

                const result = await uploadEvidence(formData);
                if (result.success) {
                    filePath = result.path; // Use the server path
                    fileName = file.name;
                } else {
                    alert('Error al subir evidencia. Se usará nombre local.');
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert('Fallo la subida del archivo al servidor.');
            }
        }

        const newData = JSON.parse(JSON.stringify(data));

        // Find which section this activity belongs to
        let foundSIdx = -1;
        let foundAIdx = -1;

        newData.sections.forEach((s: any, sIdx: number) => {
            const aIdx = s.activities.findIndex((a: any) => a.id === targetActId);
            if (aIdx !== -1) {
                foundSIdx = sIdx;
                foundAIdx = aIdx;
            }
        });

        if (foundSIdx === -1) return;

        const activity = newData.sections[foundSIdx].activities[foundAIdx];

        if (!activity.evidence) activity.evidence = new Array(12).fill(null);
        // Store the persistent path (or name if upload failed/skipped)
        activity.evidence[targetMIdx] = filePath;
        activity.history = addAuditLog(activity, `EVIDENCIA: ${fileName}`);

        setData(newData);
        setEvidenceModal(null);
    };

    const handleAddActivity = () => {
        let targetSectionId = activeSectionId;

        // If in "TODOS" view, add to the first available section
        if (isAllSelected) {
            targetSectionId = data.sections[0]?.id || '';
            if (!targetSectionId) {
                alert("No hay secciones disponibles para añadir actividades.");
                return;
            }
        }

        const newData = JSON.parse(JSON.stringify(data));
        const sIdx = newData.sections.findIndex((s: any) => s.id === targetSectionId);
        if (sIdx === -1) return;

        const newId = `new-${Date.now()}`;
        const newActivity: Activity = {
            id: newId,
            name: "NUEVA ACTIVIDAD OPERATIVA",
            responsible: "Por asignar",
            target: "100%",
            frequency: "Mensual",
            progress: 0,
            data: {
                plan: new Array(12).fill(0),
                executed: new Array(12).fill(0)
            },
            history: []
        };

        newData.sections[sIdx].activities.push(newActivity);
        setData(newData);
    };

    const handleDeleteActivity = async (activityId: string) => {
        if (!confirm("¿Está seguro de eliminar esta actividad? Esta acción no se puede deshacer.")) return;

        try {
            // Call server action to delete from database
            const { deleteActivity } = await import('@/app/actions');
            const result = await deleteActivity(activityId);

            if (result.success && result.deleted) {
                // Update local state
                const newData = JSON.parse(JSON.stringify(data));
                newData.sections.forEach((s: any) => {
                    s.activities = s.activities.filter((a: any) => a.id !== activityId);
                });

                setData(newData);
                console.log(`Actividad ${activityId} eliminada exitosamente`);
            } else {
                alert("Error: No se pudo eliminar la actividad de la base de datos.");
            }
        } catch (error) {
            console.error('Error al eliminar actividad:', error);
            alert("Error: Ocurrió un problema al eliminar la actividad.");
        }
    };

    const handleMoveActivity = (activityId: string, direction: 'up' | 'down') => {
        // Encontrar la sección y la actividad
        const newData = JSON.parse(JSON.stringify(data));
        let found = false;

        for (const section of newData.sections) {
            const index = section.activities.findIndex((a: Activity) => a.id === activityId);
            if (index !== -1) {
                const swapIndex = direction === 'up' ? index - 1 : index + 1;

                // Mover solo si está dentro de los límites
                if (swapIndex >= 0 && swapIndex < section.activities.length) {
                    const temp = section.activities[index];
                    section.activities[index] = section.activities[swapIndex];
                    section.activities[swapIndex] = temp;
                    found = true;
                }
                break;
            }
        }

        if (found) {
            setData(newData);
            // Opcional: Llamar Server Action para persistir orden si se requiere
        }
    };

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const generatePDFReport = async () => {
        if (showAnalytics) {
            try {
                setIsGeneratingPDF(true);
                const element = document.getElementById('analytics-container');
                if (!element) return;

                // Wait for any charts animations to settle
                await new Promise(resolve => setTimeout(resolve, 800));

                // Get full dimensions
                const height = element.scrollHeight;
                const width = element.scrollWidth;

                const dataUrl = await toPng(element, {
                    quality: 0.95,
                    backgroundColor: '#0f172a',
                    cacheBust: true,
                    height: height,
                    width: width,
                    style: {
                        borderRadius: '0',
                        overflow: 'visible',
                        height: height + 'px'
                    },
                    filter: (node) => {
                        // Filter out any elements that might cause issues during capture
                        return true;
                    }
                });

                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                // Check if content exceeds one page height and split if necessary
                // For now, keeping it simple - using a long single page or fitting to one page
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Reporte_Analitico_Completo_${new Date().getTime()}.pdf`);
            } catch (error) {
                console.error("PDF Export failed:", error);
                alert("Hubo un problema al procesar el reporte completo. Por favor, intente nuevamente.");
            } finally {
                setIsGeneratingPDF(false);
            }
        } else {
            // Use the centralized and advanced export function
            if (activeSectionId === 'todos') {
                exportToPDF(groupedActivities);
            } else {
                exportToPDF(activeSection.activities);
            }
        }
    };

    return (
        <div className="space-y-4 px-2 xl:px-6 pb-10 w-full max-w-full overflow-x-auto">
            {/* INTEGRATED HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                        SSOMA DASHBOARD TOTAL
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">
                        Plataforma Integral de Seguridad, Salud Ocupacional y Medio Ambiente
                    </p>
                </div>
                <div className="flex gap-2 relative z-20">
                    <div className="px-6 py-2 bg-slate-900 rounded-full text-sm font-bold border border-slate-700 backdrop-blur-md shadow-lg flex items-center gap-2">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Año</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none text-emerald-400 font-black text-lg focus:ring-0 outline-none cursor-pointer appearance-none"
                        >
                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Header Area (Toolbar) */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-900/50 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl border-b border-emerald-500/30 ring-1 ring-slate-800">
                {!showAnalytics && (
                    <div className="flex items-center gap-4 border-r border-slate-700 pr-4 shrink-0">
                        <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg ring-2 ring-emerald-400/20">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="text-[14px] font-black text-white uppercase tracking-tighter block">PROGRAMA ANUAL DE SSOMA</span>
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest leading-none font-black opacity-80">PLANIFICACIÓN Y SEGUIMIENTO {selectedYear}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-4 items-end">
                    {/* Periodo Filter Removed from here as it is in title, or we can keep it for double access. Let's remove to clean UI */}
                    {/* <FilterControl label="Periodo" value={selectedYear} options={[2026, 2027, 2028]} onChange={setSelectedYear} /> */}

                    <FilterControl label="Filtro de Mes" value={selectedMonthIndex} options={MONTHS_FULL.map((m, i) => ({ l: m, v: i - 1 }))} onChange={setSelectedMonthIndex} />
                    <FilterControl
                        label="Gestión"
                        value={activeManagement}
                        options={[
                            { l: 'TODOS', v: 'todos' },
                            { l: 'Gestión de Seguridad', v: 'safety' },
                            { l: 'Gestión de la Salud', v: 'health' },
                            { l: 'Gestión de Medio Ambiente', v: 'environment' }
                        ]}
                        onChange={handleManagementChange}
                        icon={<Target size={12} className="text-emerald-500" />}
                    />

                    {/* Filtro de Objetivos */}
                    {!showAnalytics && (
                        <FilterControl
                            label="Objetivo Específico"
                            value={selectedObjectiveId}
                            options={[
                                { l: 'TODOS LOS OBJETIVOS', v: 'todos' },
                                ...OBJECTIVES_CONFIG
                                    .filter(obj => activeManagement === 'todos' || obj.area === activeManagement)
                                    .map(obj => ({ l: obj.title, v: obj.id }))
                            ]}
                            onChange={setSelectedObjectiveId}
                            icon={<Target size={12} className="text-blue-400" />}
                        />
                    )}
                </div>

                <div className="flex gap-2 items-center shrink-0">
                    <button
                        onClick={generatePDFReport}
                        disabled={isGeneratingPDF}
                        className={`${isGeneratingPDF ? 'bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 border border-emerald-400/20 active:scale-95`}
                    >
                        <Download size={14} /> <span>{isGeneratingPDF ? 'GENERANDO...' : 'PDF'}</span>
                    </button>
                    {!showAnalytics && <div className="h-8 w-px bg-slate-700 mx-1"></div>}
                    {!showAnalytics && (
                        <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                            <ViewToggle active={viewMode === 'cards'} onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('view', 'cards');
                                router.push(`?${params.toString()}`);
                            }} icon={<LayoutDashboard size={14} />} />
                            <ViewToggle active={viewMode === 'grid'} onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('view', 'grid');
                                router.push(`?${params.toString()}`);
                            }} icon={<Grid size={14} />} />
                        </div>
                    )}
                </div>

                {/* Analytics Button */}
                {!showAnalytics && (
                    <button
                        onClick={() => {
                            const newShow = !showAnalytics;
                            const params = new URLSearchParams(searchParams.toString());
                            if (newShow) {
                                params.set('view', 'analytics');
                            } else {
                                params.delete('view');
                                params.set('view', viewMode);
                            }
                            router.push(`?${params.toString()}`);
                            setShowAnalytics(newShow);
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${showAnalytics
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <LayoutDashboard size={16} />
                        {showAnalytics ? 'PROGRAMA DE ACTIVIDADES' : 'ANALÍTICA DE GESTIÓN'}
                    </button>
                )}
            </div>

            {/* Navigation Tabs Dinámicas */}
            {!showAnalytics && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {(() => {
                        const getTabs = () => {
                            if (activeManagement === 'safety') return [
                                { id: 'scsst', label: 'SCSST', area: 'safety' },
                                { id: 'training', label: 'CAPACITACIONES', area: 'safety' },
                                { id: 'inspections', label: 'INSPECCIONES', area: 'safety' },
                                { id: 'rac', label: 'ALERTA DE RAC', area: 'safety' }
                            ];
                            if (activeManagement === 'health') return [
                                { id: 'health', label: 'SALUD OCUPACIONAL', area: 'health' },
                                { id: 'training', label: 'CAPACITACIONES', area: 'health' },
                                { id: 'inspections', label: 'INSPECCIONES', area: 'health' }
                            ];
                            if (activeManagement === 'environment') return [
                                { id: 'environment', label: 'GESTIÓN AMBIENTAL', area: 'environment' },
                                { id: 'training', label: 'CAPACITACIONES', area: 'environment' },
                                { id: 'inspections', label: 'INSPECCIONES', area: 'environment' }
                            ];
                            // Default / TODOS
                            return data.sections.map(s => ({ id: s.id, label: s.id.toUpperCase(), area: undefined }));
                        };

                        return getTabs().map((tab) => (
                            <button
                                key={`${tab.id}-${tab.area}`}
                                onClick={() => handleSectionChange(tab.id, tab.area)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black transition-all whitespace-nowrap uppercase tracking-widest border relative group ${activeSectionId === tab.id && (tab.area === undefined || activeArea === tab.area)
                                    ? "bg-white border-emerald-600 text-emerald-700 shadow-lg shadow-emerald-100 scale-105 z-10"
                                    : "bg-white border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {activeSectionId === tab.id && (tab.area === undefined || activeArea === tab.area) && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>}
                                {SECTION_ICONS[tab.id] || <LayoutDashboard size={14} />}
                                {tab.label}
                            </button>
                        ));
                    })()}
                </div>
            )}

            {/* Content Area */}
            {showAnalytics ? (
                <div className="mt-6" id="analytics-container">
                    <DashboardCharts
                        activities={
                            (selectedObjectiveId === 'todos'
                                ? groupedActivities
                                : categorizeActivitiesByObjective(groupedActivities)
                                    .find(g => g.id === selectedObjectiveId)?.activities || [])
                                .filter(a => activeManagement === 'todos' || a.managementArea === activeManagement)
                        }
                        mode={searchParams.get('view') === 'control_hhc' ? 'hhc' : 'general'}
                        currentMonth={selectedMonthIndex}
                        currentYear={selectedYear}
                    />
                </div>
            ) : (
                activeSection && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white p-6 xl:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start mb-10">
                                <div className="space-y-3 max-w-4xl">
                                    <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                                        <Target size={12} /> {activeSection.id} ESTRATÉGICO
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{activeSection.title}</h2>
                                    <p className="text-slate-500 font-bold text-base border-l-4 border-emerald-600 pl-6 py-1 italic leading-snug">
                                        {activeSection.goal}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 bg-slate-900 px-8 py-5 rounded-2xl shadow-2xl ring-1 ring-white/10 shrink-0">
                                    <StatItem label="Meta" value="100%" color="text-blue-400" />
                                    <StatItem label="Logro" value={`${Math.round(activeSection.activities.reduce((a: number, b: any) => {
                                        const tp = b.data.plan.reduce((p: number, c: number) => p + c, 0);
                                        const te = b.data.executed.reduce((p: number, c: number) => p + c, 0);
                                        return a + (tp > 0 ? (te / tp) * 100 : 0);
                                    }, 0) / (activeSection.activities.length || 1))}%`} color="text-emerald-400" />
                                </div>
                            </div>

                            <div className="w-full space-y-8">
                                {activeSection.id === 'todos' ? (
                                    // Render grouped by Objective for "TODOS" view
                                    categorizeActivitiesByObjective(activeSection.activities)
                                        .filter(group => selectedObjectiveId === 'todos' || group.id === selectedObjectiveId)
                                        .map((group) => (
                                            <div key={group.id} className="space-y-4">
                                                <div className="flex items-center gap-3 border-b border-slate-200 pb-2 mb-4">
                                                    <div className={`p-2 rounded-lg ${group.area === 'health' ? 'bg-blue-100 text-blue-600' :
                                                        group.area === 'environment' ? 'bg-teal-100 text-teal-600' :
                                                            'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        <Target size={16} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{group.title}</h3>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{group.description}</p>
                                                    </div>
                                                </div>
                                                {viewMode === 'grid' ? (
                                                    <TableView
                                                        activities={group.activities}
                                                        onUpdateActivity={(id, m, t, v) => handleUpdateActivityValue(id, m, t, v, false)}
                                                        onUpdateName={handleUpdateActivityName}
                                                        onViewEvidence={(activity, month) => setEvidenceModal({ activity, month })}
                                                        isSCSST={group.id === 'obj-1'}
                                                        onAddActivity={handleAddActivity}
                                                        onDeleteActivity={handleDeleteActivity}
                                                        onMoveActivity={handleMoveActivity}
                                                    />
                                                ) : (
                                                    <ActivityTable
                                                        activities={group.activities}
                                                        onUpdateActivity={(id, m, v, f) => {
                                                            handleUpdateActivityValue(id, m, 'executed', v, true);
                                                            if (f) handleUploadEvidence(f, id, m);
                                                        }}
                                                        selectedMonthIndex={selectedMonthIndex}
                                                    />
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    // Original render for specific sections
                                    viewMode === 'grid' ? (
                                        <TableView
                                            activities={activeSection.activities}
                                            onUpdateActivity={(id, m, t, v) => handleUpdateActivityValue(id, m, t, v, false)}
                                            onUpdateName={handleUpdateActivityName}
                                            onViewEvidence={(activity, month) => setEvidenceModal({ activity, month })}
                                            isSCSST={activeSection.id === 'scsst'}
                                            onAddActivity={handleAddActivity}
                                            onDeleteActivity={handleDeleteActivity}
                                            onMoveActivity={handleMoveActivity}
                                        />
                                    ) : (
                                        <ActivityTable
                                            activities={activeSection.activities}
                                            onUpdateActivity={(id, m, v, f) => {
                                                handleUpdateActivityValue(id, m, 'executed', v, true);
                                                if (f) handleUploadEvidence(f, id, m);
                                            }}
                                            selectedMonthIndex={selectedMonthIndex}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Modal Evidence y Otros (Mismos de antes) */}
            {
                evidenceModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                            <div className="bg-slate-900 p-6 text-white text-center">
                                <h4 className="font-black text-xs uppercase tracking-widest line-clamp-1">{evidenceModal.activity.name}</h4>
                                <p className="text-[9px] text-blue-400 font-black mt-2 uppercase">Gestor de Archivos - {MONTHS[evidenceModal.month]}</p>
                            </div>
                            <div className="p-8 space-y-6">
                                {evidenceModal.activity.evidence && evidenceModal.activity.evidence[evidenceModal.month] ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[10px] font-black text-emerald-900 uppercase leading-none mb-1">Cargado</p>
                                            <p className="text-xs font-bold text-emerald-700 truncate">{evidenceModal.activity.evidence[evidenceModal.month]}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 group hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer relative">
                                        <Upload size={32} className="mx-auto text-slate-300 group-hover:text-blue-500 transition-all mb-2" />
                                        <p className="font-black text-slate-800 uppercase text-[10px]">Subir Evidencia</p>
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => e.target.files?.[0] && handleUploadEvidence(e.target.files[0])}
                                        />
                                    </div>
                                )}
                                <button onClick={() => setEvidenceModal(null)} className="w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition">Cerrar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function FilterControl({ label, value, options, onChange, icon }: any) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-1">{label}</span>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 ring-1 ring-slate-700 hover:ring-emerald-500 transition-all">
                {icon}
                <select
                    className="bg-transparent border-none text-white text-[10px] font-black py-2.5 focus:ring-0 outline-none min-w-[70px] uppercase appearance-none cursor-pointer leading-none"
                    value={value}
                    onChange={(e) => onChange(typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                >
                    {options.map((o: any) => (
                        <option key={typeof o === 'object' ? o.v : o} value={typeof o === 'object' ? o.v : o} className="bg-slate-800">
                            {typeof o === 'object' ? o.l : o}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function ViewToggle({ active, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`p-2.5 rounded-lg transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            {icon}
        </button>
    );
}

function StatItem({ label, value, color }: any) {
    return (
        <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">{label}</p>
            <p className={`text-4xl font-black ${color} leading-none tracking-tighter`}>{value}</p>
        </div>
    );
}
