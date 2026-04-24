
'use client'
import { Activity, Progress } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useState } from "react";
import { uploadEvidence } from "@/app/actions";

export default function ActivityItem({ activity }: { activity: Activity }) {
    const data = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const rec = activity.progress_records?.find(r => r.month === month);
        return {
            name: new Date(2025, i, 1).toLocaleString('es-ES', { month: 'short' }),
            month,
            plan: rec?.plan_value || 0,
            exec: rec?.executed_value || 0,
            hasEvidence: false // TODO: Check if evidence exists (need to pass evidence data)
        };
    });

    const [uploadingMonth, setUploadingMonth] = useState<number | null>(null);

    async function handleUpload(formData: FormData) {
        if (!uploadingMonth) return;
        formData.append('activityId', activity.id);
        formData.append('month', uploadingMonth.toString());
        await uploadEvidence(formData);
        setUploadingMonth(null);
        // Toast or Refresh? Server action revalidates path, so router refresh might be automatic or explicit.
        // For prototype, simple alert or auto-update.
    }

    return (
        <div className="bg-card/50 border border-border rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div>
                    <h4 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-normal">#{activity.item_number}</span>
                        {activity.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Resp: <span className="text-foreground">{activity.responsible}</span> •
                        Freq: <span className="text-foreground">{activity.frequency}</span>
                    </p>
                </div>
                <div className="h-32 w-32 shrink-0 relative">
                    {(() => {
                        const totalPlan = data.reduce((a, b) => a + b.plan, 0);
                        const totalExec = data.reduce((a, b) => a + b.exec, 0);
                        const percent = totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : (totalExec > 0 ? 100 : 0);
                        const donutData = [
                            { name: 'Ejecutado', value: percent, fill: percent >= 100 ? '#10b981' : (percent > 0 ? '#3b82f6' : '#94a3b8') },
                            { name: 'Pendiente', value: 100 - percent, fill: '#f1f5f9' }
                        ];
                        return (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            innerRadius="70%"
                                            outerRadius="100%"
                                            paddingAngle={0}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {donutData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} stroke="none" />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-black text-slate-800 leading-none">{percent}%</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Total</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 Gap-2 md:gap-4">
                {data.map((item) => (
                    <div key={item.month} className="bg-background/40 p-3 rounded-lg border border-white/5 flex flex-col items-center text-center">
                        <span className="text-xs font-bold uppercase text-muted-foreground mb-2">{item.name}</span>
                        <div className="flex gap-2 text-xs w-full justify-between px-2 mb-2">
                            <div className="text-blue-400">P: {item.plan}</div>
                            <div className="text-green-400">E: {item.exec}</div>
                        </div>

                        <label className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground p-2 rounded-full transition-colors relative group">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setUploadingMonth(item.month);
                                        const fd = new FormData();
                                        fd.append('file', e.target.files[0]);
                                        // Need to call handleUpload but state inside loop is tricky.
                                        // Better: call direct function
                                        const fd2 = new FormData();
                                        fd2.append('file', e.target.files[0]);
                                        fd2.append('activityId', activity.id);
                                        fd2.append('month', item.month.toString());
                                        uploadEvidence(fd2).then(() => alert('Archivo subido'));
                                    }
                                }}
                            />
                            <Upload size={14} />
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                                Subir Evidencia
                            </span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
