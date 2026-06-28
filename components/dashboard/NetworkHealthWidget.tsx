"use client";

import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';

export default function NetworkHealthWidget() {
    const [estimatedGB, setEstimatedGB] = useState(0);
    const LIMIT_GB = 5; 

    useEffect(() => {
        const calculateEstimate = () => {
            try {
                let totalRecords = 0;
                
                const cachedEvidence = localStorage.getItem('evidence_center_records');
                if (cachedEvidence) {
                    const records = JSON.parse(cachedEvidence);
                    totalRecords += records.length;
                }

                const baseMonthlyUsageGB = 0.45; 
                const usagePerRecordGB = 0.0001; 
                
                const calculatedGB = baseMonthlyUsageGB + (totalRecords * usagePerRecordGB);
                setEstimatedGB(Number(calculatedGB.toFixed(2)));

            } catch (error) {
                console.error("Error calculating estimate:", error);
            }
        };

        calculateEstimate();
        const interval = setInterval(calculateEstimate, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <a 
            href="https://supabase.com/dashboard/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block border border-slate-800 bg-slate-900/50 rounded-lg p-2 hover:bg-slate-800 transition-colors cursor-pointer group"
        >
            <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                <Database size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Supabase (Red)</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Consumo Mes:</span>
                    <span className="font-mono text-emerald-400 font-bold">{estimatedGB} GB</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Límite Seguro:</span>
                    <span className="font-mono text-slate-300">{LIMIT_GB} GB</span>
                </div>
            </div>
        </a>
    );
}
