import { useState } from "react";
import { Activity } from "@/lib/types";
import { ComparisonChart } from "./ComparisonChart";
import { Edit3, User, Calendar, Info } from "lucide-react";
import { UpdateActivityModal } from "./UpdateActivityModal";

interface ActivityTableProps {
    activities: Activity[];
    onUpdateActivity?: (activityId: string, monthIndex: number, value: number, file: File | null) => void;
    selectedMonthIndex?: number;
}

export function ActivityTable({ activities, onUpdateActivity, selectedMonthIndex = -1 }: ActivityTableProps) {
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

    return (
        <div className="space-y-10">
            {activities.map((activity) => (
                <div key={activity.id} className="group border border-slate-200 rounded-3xl p-8 shadow-sm bg-white hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 relative overflow-hidden">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-blue-100/50 transition-colors duration-500"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 relative z-10 gap-6">
                        <div className="space-y-3">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                                {activity.name}
                            </h3>
                            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                    <User size={12} className="text-slate-500" />
                                    {activity.responsible}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                    <Calendar size={12} className="text-slate-500" />
                                    {activity.frequency}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center self-end md:self-start">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Cumplimiento Global</span>
                                <div className="bg-slate-900 text-white text-sm font-black px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                                    {(() => {
                                        const totalPlan = activity.data.plan.reduce((a, b) => a + b, 0);
                                        const totalExec = activity.data.executed.reduce((a, b) => a + b, 0);
                                        const percent = totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : 0;
                                        return (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${percent >= 100 ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></div>
                                                {percent}%
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {onUpdateActivity && (
                                <button
                                    onClick={() => setEditingActivity(activity)}
                                    className="p-3 bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white rounded-2xl transition-all shadow-md group/edit"
                                    title="Actualizar Registro"
                                >
                                    <Edit3 size={20} fill="currentColor" className="group-hover/edit:rotate-12 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <ComparisonChart activity={activity} selectedMonthIndex={selectedMonthIndex} />
                    </div>

                    {/* Quick Audit Info */}
                    {activity.history && activity.history[0] && (
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">
                            <Info size={12} /> Última modificación por: {activity.history[0].user} el {activity.history[0].date} a las {activity.history[0].time}
                        </div>
                    )}
                </div>
            ))}

            {editingActivity && (
                <UpdateActivityModal
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                    onSave={(id, month, val, file) => {
                        onUpdateActivity?.(id, month, val, file);
                    }}
                />
            )}
        </div>
    );
}
