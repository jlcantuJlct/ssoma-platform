"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClipboardList, Plus, ArrowLeft } from 'lucide-react';

export default function DynamicModuleDashboard() {
    const params = useParams();
    const router = useRouter();
    const moduleName = decodeURIComponent(params.module as string);
    const [records, setRecords] = useState([]);

    return (
        <div className="p-4 md:p-8">
            <button 
                onClick={() => router.push('/inspections?openDigital=true')} 
                className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
                <ArrowLeft size={18} /> Volver al panel principal
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-blue-600" /> Inspección de {moduleName}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Panel de control y registro de inspecciones.</p>
                </div>
                <a href={`/digital-inspections/${params.module}/fill`} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
                    <Plus className="w-4 h-4" /> Nueva Inspección
                </a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                <p>Aún no hay inspecciones registradas para este módulo.</p>
                <p className="text-sm mt-2">Haz clic en "Nueva Inspección" para comenzar.</p>
            </div>
        </div>
    );
}
