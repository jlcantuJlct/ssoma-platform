"use client";

import React from 'react';

interface GaugeProps {
    value: number;
    max?: number;
    title: string;
    width?: number;
    height?: number;
    color?: string;
}

export const ComplianceGauge = ({ value, max = 100, title, width = 300, height = 180, color: customColor }: GaugeProps) => {
    // 1. Calculations
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    // Angle Mapping: -90deg (Left) to +90deg (Right) = 180deg range
    const rotation = -90 + (percentage / 100) * 180;

    // Radius configuration
    const cx = 100;
    const cy = 100;
    const r = 80;
    const strokeWidth = 20; // Thicker modern look

    // Percentage of circle (180 degrees = 0.5 of 360)
    // We work with dasharray. Circumference = 2 * pi * r = ~502.
    // Semicircle = 251.
    const semiCircumference = Math.PI * r;

    // Zones (in percent of the semi-circle)
    // Red: 0-70%
    // Yellow: 70-90%
    // Green: 90-100%
    const redPct = 0.70;
    const yellowPct = 0.20; // 20% length (70 to 90)
    const greenPct = 0.10; // 10% length (90 to 100)

    const redStroke = semiCircumference * redPct;
    const yellowStroke = semiCircumference * yellowPct;
    const greenStroke = semiCircumference * greenPct;

    // For single color mode
    const currentStroke = semiCircumference * (percentage / 100);

    // Gaps in pixels (simulated by dash)
    const gap = 2; // px

    return (
        <div className="flex flex-col items-center justify-center w-full h-full relative">

            {/* Title & Badge */}
            <div className="relative z-10 text-center mb-2 flex flex-col items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate max-w-[120px]" title={title}>
                    {title}
                </h3>
                <div
                    className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block border backdrop-blur-md shadow-lg transform transition-all duration-500`}
                    style={{
                        borderColor: customColor ? customColor + '50' : (percentage >= 96 ? 'rgba(34, 197, 94, 0.5)' : percentage >= 81 ? 'rgba(249, 115, 22, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                        backgroundColor: customColor ? customColor + '10' : (percentage >= 96 ? 'rgba(34, 197, 94, 0.1)' : percentage >= 81 ? 'rgba(249, 115, 22, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                        color: customColor || (percentage >= 96 ? '#4ade80' : percentage >= 81 ? '#fb923c' : '#f87171'),
                        boxShadow: `0 4px 10px -2px ${customColor || (percentage >= 96 ? 'rgba(34, 197, 94, 0.3)' : percentage >= 81 ? 'rgba(249, 115, 22, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`
                    }}
                >
                    {percentage >= 96 ? 'OPTIMO' : percentage >= 81 ? 'ACEPTABLE' : 'CRITICO'}
                </div>
            </div>

            <div className="relative flex items-center justify-center" style={{ width: width, height: height }}>
                {/* SVG Gauge Implementation */}
                {/* Added deep 3D shadow behind the track */}
                <div className="absolute inset-0 rounded-full bg-black/40 blur-xl scale-90 translate-y-4 -z-10"></div>

                <svg width="100%" height="100%" viewBox="0 0 200 110" className="overflow-visible drop-shadow-2xl">
                    <defs>

                        {/* Executive Gradients */}
                        <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#7f1d1d" />
                        </linearGradient>
                        <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan */}
                            <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky Blue */}
                        </linearGradient>
                        {/* Metallic / Glass Gradients for Scale */}
                    </defs>

                    {/* 
                      We use dashes to create segments.
                      Path is arc from 180deg (left) to 0deg (right).
                      In SVG math: M 20 100 A 80 80 0 0 1 180 100
                    */}

                    {/* Track Background - Deep Dark with Inner Shadow simulation via stroke */}
                    <path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="drop-shadow-inner"
                    />

                    {/* Inner highlight for "groove" effect */}
                    <path
                        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                        fill="none"
                        stroke="#334155"
                        strokeWidth={2}
                        strokeLinecap="round"
                        transform="scale(0.92) translate(8,8)"
                        className="opacity-30"
                    />

                    {customColor ? (
                        /* SINGLE COLOR MODE */
                        <path
                            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                            fill="none"
                            stroke={customColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${currentStroke} ${semiCircumference}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                            filter="drop-shadow(0 0 8px rgba(0,0,0,0.5))"
                        />
                    ) : (
                        /* MULTI ZONE MODE */
                        <>
                            {/* RED ZONE (0-70%) */}
                            <path
                                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                fill="none"
                                stroke="url(#gradRed)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${redStroke - gap} ${semiCircumference}`}
                                strokeDashoffset={0}
                                strokeLinecap="round"
                                className="opacity-90"
                            />

                            {/* YELLOW ZONE (70-90%) */}
                            <path
                                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                fill="none"
                                stroke="url(#gradYellow)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${yellowStroke - gap} ${semiCircumference}`}
                                strokeDashoffset={-redStroke}
                                strokeLinecap="round"
                                className="opacity-90"
                            />

                            {/* GREEN ZONE (90-100%) */}
                            <path
                                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                                fill="none"
                                stroke="url(#gradGreen)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${greenStroke} ${semiCircumference}`}
                                strokeDashoffset={-(redStroke + yellowStroke)}
                                strokeLinecap="round"
                                className="opacity-90"
                            />
                        </>
                    )}

                    {/* Ticks for scale */}
                    {[0, 25, 50, 75, 100].map((t, i) => {
                        const ang = -180 + (t / 100) * 180; // Map 0-100 to -180...0 (mathematically)
                        // Actually our arc is -90 to +90 visual rotation
                        const rad = (-180 + (t / 100) * 180) * (Math.PI / 180);
                        // Pos calculation.. let's just stick to reliable visual cues or simple text
                        return null;
                    })}

                </svg>

                {/* DOM-based Needle */}
                <div className="absolute top-[90%] left-1/2 -translate-x-1/2 -translate-y-full w-full max-w-[200px] aspect-[2/1] pointer-events-none">
                    <div
                        className="absolute bottom-0 left-1/2 w-1.5 h-[95%] origin-bottom transition-transform duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {/* Needle Body - Enhanced 3D */}
                        <div
                            className={`w-full h-full rounded-t-full shadow-2xl transition-colors duration-500`}
                            style={{
                                background: `linear-gradient(to right, ${customColor || '#ef4444'}, #ffffff, ${customColor || '#ef4444'})`,
                                boxShadow: `0 0 15px ${customColor || (percentage >= 90 ? 'rgba(34,211,238,0.8)' : percentage >= 70 ? 'rgba(245,158,11,0.8)' : 'rgba(239,68,68,0.8)')}`
                            }}
                        ></div>
                    </div>
                    {/* Needle Pivot - Metallic look */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-slate-800 rounded-full border-[3px] border-slate-600 shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center z-20">
                        <div
                            className={`w-3 h-3 rounded-full animate-pulse transition-colors duration-500 border border-black/50`}
                            style={{
                                backgroundColor: customColor || (percentage >= 90 ? '#22d3ee' : percentage >= 70 ? '#f59e0b' : '#dc2626'),
                                boxShadow: `0 0 10px ${customColor || (percentage >= 90 ? 'rgba(34,211,238,1)' : percentage >= 70 ? 'rgba(245,158,11,1)' : 'rgba(220,38,38,1)')}`
                            }}
                        ></div>
                    </div>
                </div>

                {/* Value Readout */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%] text-center z-10 w-full pointer-events-none">
                    <span
                        className={`text-3xl font-black tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-500`}
                        style={{
                            color: 'white',
                            textShadow: `0 0 20px ${customColor || (percentage >= 90 ? 'rgba(34,211,238,0.6)' : 'rgba(239,68,68,0.6)')}`
                        }}
                    >
                        {isNaN(percentage) ? 'N/A' : (
                            <>
                                {Math.round(percentage)}
                                <span className="text-xs text-slate-400 ml-1 font-bold">%</span>
                            </>
                        )}
                    </span>
                </div>
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between w-[80%] text-[8px] font-black text-slate-600 px-4 mt-2">
                <span>0%</span>
                <span>100%</span>
            </div>
        </div>
    );
};
