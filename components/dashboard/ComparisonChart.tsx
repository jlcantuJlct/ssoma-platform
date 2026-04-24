import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, MONTHS } from "@/lib/types";

interface ComparisonChartProps {
    activity: Activity;
    selectedMonthIndex?: number;
}

export function ComparisonChart({ activity, selectedMonthIndex = -1 }: ComparisonChartProps) {
    const data = MONTHS.map((month, index) => {
        const plan = activity.data.plan[index] || 0;
        const exec = activity.data.executed[index] || 0;
        const percent = plan > 0 ? Math.round((exec / plan) * 100) : (exec > 0 ? 100 : 0);
        
        return {
            name: month,
            plan,
            exec,
            percent: percent > 100 ? 100 : percent,
            index: index
        };
    });

    const displayData = selectedMonthIndex === -1 ? data : [data[selectedMonthIndex]];

    return (
        <div className="w-full">
            <div className={`grid gap-4 ${selectedMonthIndex === -1 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12' : 'grid-cols-1'}`}>
                {displayData.map((item, idx) => {
                    const donutData = [
                        { name: 'Ejecutado', value: item.percent, fill: item.percent >= 100 ? '#10b981' : (item.percent > 0 ? '#3b82f6' : '#94a3b8') },
                        { name: 'Pendiente', value: 100 - item.percent, fill: '#f1f5f9' }
                    ];

                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-white/50 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">{item.name}</span>
                            
                            <div className="relative w-full aspect-square max-w-[80px]">
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
                                    <span className="text-[10px] font-black text-slate-800 leading-none">{item.percent}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-0.5 mt-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-bold text-slate-400">P:</span>
                                    <span className="text-[9px] font-black text-slate-700">{item.plan}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] font-bold text-emerald-500">E:</span>
                                    <span className="text-[9px] font-black text-emerald-600">{item.exec}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
