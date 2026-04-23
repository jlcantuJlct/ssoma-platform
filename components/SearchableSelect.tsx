"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    icon,
    label,
    className = "",
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`flex flex-col gap-1 w-full relative ${className}`} ref={containerRef}>
            {label && <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>}
            
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-10 text-xs text-white cursor-pointer transition-all flex items-center justify-between
                    ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]' : 'border-slate-800 hover:border-slate-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <div className="absolute left-3 top-2.5 text-slate-500">
                    {icon || <Search size={16} />}
                </div>

                <span className={`truncate ${!value ? 'text-slate-500 italic' : 'font-medium'}`}>
                    {value || placeholder}
                </span>

                <div className="absolute right-3 top-2.5 text-slate-500">
                    {value && isOpen ? (
                        <X size={14} className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); onChange(""); }} />
                    ) : (
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 min-w-full md:min-w-[800px] max-w-[95vw] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] p-2 flex flex-col gap-2 backdrop-blur-xl bg-slate-900/95 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>

                    <div className="max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1 flex flex-col gap-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-8 text-center text-slate-500 text-xs italic">
                                No se encontraron resultados
                            </div>
                        ) : (
                            filteredOptions.map((option, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        w-full px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-between group
                                        ${value === option 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <span className="flex-1 leading-relaxed whitespace-normal break-words">{option}</span>
                                    {value === option && (
                                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Check size={10} className="text-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
