"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    hint?: string;
    group?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    icon?: React.ReactNode;
    variant?: 'emerald' | 'blue'; // Unified with our design system colors
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    icon,
    variant = 'emerald'
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const normalizedOptions = (options || []).map(opt => {
        if (typeof opt === 'string') return { id: opt, label: opt };
        
        // If it's an object, ensure id and label are strings
        const sanitize = (val: any) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'string') return val;
            if (typeof val === 'object') return val.label || val.id || JSON.stringify(val);
            return String(val);
        };

        return {
            ...opt,
            id: sanitize(opt.id),
            label: sanitize(opt.label)
        };
    });

    // Filter logic
    const filteredOptions = normalizedOptions.filter(opt =>
        (opt.label || "").toString().toLowerCase().includes((searchTerm || "").toLowerCase()) ||
        (opt.group && opt.group.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Grouping logic (if groups exist)
    const hasGroups = normalizedOptions.some(opt => opt.group);
    const groups = hasGroups ? Array.from(new Set(normalizedOptions.map(opt => opt.group).filter(Boolean))) : [];

    const selectedOption = normalizedOptions.find(opt => opt.id === value);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-left focus:ring-2 ${variant === 'blue' ? 'focus:ring-blue-500/50' : 'focus:ring-emerald-500/50'} outline-none transition-all flex items-center justify-between group hover:border-slate-600 shadow-lg`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`${variant === 'blue' ? 'text-blue-500' : 'text-emerald-500'} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {icon}
                    </span>
                    <span className={`block truncate ${value ? 'text-slate-100' : 'text-slate-500'} text-xs font-medium`}>
                        {selectedOption ? selectedOption.label : (typeof value === 'object' ? placeholder : (value || placeholder))}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-3 bg-slate-900/50 border-b border-slate-700/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                className={`w-full bg-slate-950 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-xs text-white outline-none ${variant === 'blue' ? 'focus:border-blue-500' : 'focus:border-emerald-500'} transition-colors`}
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto custom-scrollbar bg-slate-900/50">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500 text-xs italic">
                                No se encontraron resultados
                            </div>
                        ) : hasGroups && searchTerm === "" ? (
                            // Show with groups if not searching
                            groups.map(group => (
                                <div key={group}>
                                        <div className={`px-4 py-2 text-[9px] font-black ${variant === 'blue' ? 'text-blue-400 bg-blue-500/10' : 'text-emerald-400 bg-emerald-500/10'} uppercase tracking-widest border-y border-slate-800/50`}>
                                            {group}
                                        </div>
                                        {options.filter(opt => opt.group === group).map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                className={`w-full px-4 py-3 text-left ${variant === 'blue' ? 'hover:bg-blue-500/10' : 'hover:bg-emerald-500/10'} transition-colors flex items-center justify-between border-b border-slate-800/30 last:border-0 ${value === opt.id ? (variant === 'blue' ? 'bg-blue-500/20' : 'bg-emerald-500/20') : ''}`}
                                                onClick={() => {
                                                    onChange(opt.id);
                                                    setIsOpen(false);
                                                    setSearchTerm("");
                                                }}
                                            >
                                                <div>
                                                    <div className={`text-xs font-semibold ${value === opt.id ? (variant === 'blue' ? 'text-blue-400' : 'text-emerald-400') : 'text-slate-100'}`}>
                                                        {typeof opt.label === 'object' ? JSON.stringify(opt.label) : opt.label}
                                                    </div>
                                                    {opt.hint && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.hint}</div>}
                                                </div>
                                                {value === opt.id && <Check className={`w-4 h-4 ${variant === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />}
                                            </button>
                                        ))}
                                </div>
                            ))
                        ) : (
                            // Flat list if searching or no groups
                            filteredOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    className={`w-full px-4 py-3 text-left ${variant === 'blue' ? 'hover:bg-blue-500/10' : 'hover:bg-emerald-500/10'} transition-colors flex items-center justify-between border-b border-slate-800/30 last:border-0 ${value === opt.id ? (variant === 'blue' ? 'bg-blue-500/20' : 'bg-emerald-500/20') : ''}`}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    <div>
                                        <div className={`text-xs font-semibold ${value === opt.id ? (variant === 'blue' ? 'text-blue-400' : 'text-emerald-400') : 'text-slate-100'}`}>
                                            {typeof opt.label === 'object' ? JSON.stringify(opt.label) : opt.label}
                                        </div>
                                        {opt.hint && <div className="text-[10px] text-slate-500 mt-0.5">{opt.hint}</div>}
                                    </div>
                                    {value === opt.id && <Check className={`w-4 h-4 ${variant === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
