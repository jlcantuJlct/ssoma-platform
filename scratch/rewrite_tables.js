const fs = require('fs');
const file_path = "app/residuos/page.tsx";
let content = fs.readFileSync(file_path, "utf-8");

const new_block = `                    {/* Accumulation Summary Matrix Split */}
                    <div className="grid grid-cols-1 gap-6">
                        
                        {/* Non-Hazardous Summary */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
                            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp size={18} /> Residuos Aprovechables (No Peligrosos) - {yearlyMatrix.year}
                            </h3>
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                        <th className="pb-4 pl-4 sticky left-0 bg-slate-900 z-10">Tipo de Residuo</th>
                                        <th className="pb-4 text-center">ENE</th>
                                        <th className="pb-4 text-center">FEB</th>
                                        <th className="pb-4 text-center">MAR</th>
                                        <th className="pb-4 text-center">ABR</th>
                                        <th className="pb-4 text-center">MAY</th>
                                        <th className="pb-4 text-center">JUN</th>
                                        <th className="pb-4 text-center">JUL</th>
                                        <th className="pb-4 text-center">AGO</th>
                                        <th className="pb-4 text-center">SET</th>
                                        <th className="pb-4 text-center">OCT</th>
                                        <th className="pb-4 text-center">NOV</th>
                                        <th className="pb-4 text-center">DIC</th>
                                        <th className="pb-4 text-right pr-4 text-emerald-400">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {yearlyMatrix.data.filter((d: any) => d.type === 'No Peligroso').map((row: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 pl-4 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: row.color }} />
                                                    <span className="font-bold text-white text-xs">{row.label}</span>
                                                </div>
                                            </td>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                <td key={m} className="py-3 text-center">
                                                    <span className={\`text-[10px] font-mono font-bold \${row[\`m\${m}\`] > 0 ? 'text-white' : 'text-slate-600'}\`}>
                                                        {row[\`m\${m}\`] > 0 ? row[\`m\${m}\`].toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="py-3 text-right pr-4 bg-emerald-500/5">
                                                <span className="text-sm font-black text-emerald-400">{row.total > 0 ? row.total.toFixed(1) : '0.0'} <span className="text-[10px] text-slate-500 font-normal">{row.unit}</span></span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-slate-800/50">
                                        <td className="py-3 pl-4 font-black text-white text-xs sticky left-0 bg-slate-800 z-10">TOTAL APROVECHABLES</td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                                            const colTotal = yearlyMatrix.data.filter((d: any) => d.type === 'No Peligroso').reduce((sum: number, r: any) => sum + r[\`m\${m}\`], 0);
                                            return (
                                                <td key={m} className="py-3 text-center">
                                                    <span className={\`text-[10px] font-mono font-black \${colTotal > 0 ? 'text-emerald-400' : 'text-slate-600'}\`}>
                                                        {colTotal > 0 ? colTotal.toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="py-3 text-right pr-4 font-black text-emerald-400 text-sm">
                                            {yearlyMatrix.data.filter((d: any) => d.type === 'No Peligroso').reduce((sum: number, r: any) => sum + r.total, 0).toFixed(1)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Hazardous Summary */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
                            <h3 className="text-red-400 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertTriangle size={18} /> Residuos Peligrosos y Especiales - {yearlyMatrix.year}
                            </h3>
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-500 uppercase border-b border-slate-800">
                                        <th className="pb-4 pl-4 sticky left-0 bg-slate-900 z-10">Tipo de Residuo</th>
                                        <th className="pb-4 text-center">ENE</th>
                                        <th className="pb-4 text-center">FEB</th>
                                        <th className="pb-4 text-center">MAR</th>
                                        <th className="pb-4 text-center">ABR</th>
                                        <th className="pb-4 text-center">MAY</th>
                                        <th className="pb-4 text-center">JUN</th>
                                        <th className="pb-4 text-center">JUL</th>
                                        <th className="pb-4 text-center">AGO</th>
                                        <th className="pb-4 text-center">SET</th>
                                        <th className="pb-4 text-center">OCT</th>
                                        <th className="pb-4 text-center">NOV</th>
                                        <th className="pb-4 text-center">DIC</th>
                                        <th className="pb-4 text-right pr-4 text-red-400">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {yearlyMatrix.data.filter((d: any) => d.type !== 'No Peligroso').map((row: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 pl-4 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: row.color }} />
                                                    <span className="font-bold text-white text-xs">{row.label}</span>
                                                </div>
                                            </td>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                                <td key={m} className="py-3 text-center">
                                                    <span className={\`text-[10px] font-mono font-bold \${row[\`m\${m}\`] > 0 ? 'text-white' : 'text-slate-600'}\`}>
                                                        {row[\`m\${m}\`] > 0 ? row[\`m\${m}\`].toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="py-3 text-right pr-4 bg-red-500/5">
                                                <span className="text-sm font-black text-red-400">{row.total > 0 ? row.total.toFixed(1) : '0.0'} <span className="text-[10px] text-slate-500 font-normal">{row.unit}</span></span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Total Row */}
                                    <tr className="bg-slate-800/50">
                                        <td className="py-3 pl-4 font-black text-white text-xs sticky left-0 bg-slate-800 z-10">TOTAL PELIGROSOS</td>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                                            const colTotal = yearlyMatrix.data.filter((d: any) => d.type !== 'No Peligroso').reduce((sum: number, r: any) => sum + r[\`m\${m}\`], 0);
                                            return (
                                                <td key={m} className="py-3 text-center">
                                                    <span className={\`text-[10px] font-mono font-black \${colTotal > 0 ? 'text-red-400' : 'text-slate-600'}\`}>
                                                        {colTotal > 0 ? colTotal.toFixed(1) : '-'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="py-3 text-right pr-4 font-black text-red-400 text-sm">
                                            {yearlyMatrix.data.filter((d: any) => d.type !== 'No Peligroso').reduce((sum: number, r: any) => sum + r.total, 0).toFixed(1)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
`;

const pattern = /\{\/\* Accumulation Summary Matrix Split \*\/\}[\s\S]*?(?=\{\/\* General Configuration Bar \*\/)/;
content = content.replace(pattern, new_block);

fs.writeFileSync(file_path, content);
console.log("Done");
