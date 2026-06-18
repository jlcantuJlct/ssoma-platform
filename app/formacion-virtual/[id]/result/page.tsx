"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Printer, ChevronLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export default function QuizResultPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [result, setResult] = useState<any>(null);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const name = sessionStorage.getItem("vt_user_name");
        if (!name) {
            router.push("/formacion-virtual");
            return;
        }
        setUserName(name);

        const saved = sessionStorage.getItem(`vt_last_result_${params.id}`);
        if (saved) {
            setResult(JSON.parse(saved));
        } else {
            router.push(`/formacion-virtual/${params.id}/watch`);
        }
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    if (!result) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header (no imprimible) */}
            <header className="bg-white p-4 shadow-sm flex justify-between items-center print:hidden border-b border-slate-200">
                <button onClick={() => router.push("/formacion-virtual")} className="flex items-center text-slate-500 hover:text-slate-800 font-medium">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Volver al Inicio
                </button>
                <div className="flex gap-3">
                    {!result.passed && (
                        <button 
                            onClick={() => router.push(`/formacion-virtual/${params.id}/watch`)}
                            className="flex items-center bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Reintentar
                        </button>
                    )}
                    <button 
                        onClick={handlePrint}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Constancia
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 print:p-0 print:bg-white bg-slate-50">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full overflow-hidden">
                    
                    {/* Banner de Resultado */}
                    <div className={`p-8 text-center text-white ${result.passed ? 'bg-green-600' : 'bg-red-600'} print:bg-white print:text-black print:border-b-2 print:border-slate-800`}>
                        {result.passed ? (
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 print:text-green-600" />
                        ) : (
                            <XCircle className="w-16 h-16 mx-auto mb-4 print:text-red-600" />
                        )}
                        <h1 className="text-3xl font-black uppercase mb-2">
                            {result.passed ? 'Aprobado' : 'Desaprobado'}
                        </h1>
                        <p className="text-lg opacity-90 print:opacity-100">Evaluación de Capacitación SSOMA</p>
                    </div>

                    {/* Datos del Participante */}
                    <div className="p-8 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Participante</p>
                                <p className="text-xl font-bold text-slate-800">{userName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Nota Obtenida</p>
                                <p className="text-3xl font-black text-slate-800">
                                    {result.score} <span className="text-base text-slate-400 font-medium">/ 20</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</p>
                                <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('es-PE')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                                <p className={`text-lg font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.passed ? 'SATISFACTORIO' : 'NO SATISFACTORIO (REQUIERE REINTENTO)'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detalle de Respuestas */}
                    <div className="p-8 bg-slate-50 print:bg-white">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider border-b border-slate-200 pb-2">Detalle de Respuestas Marcadas</h2>
                        <div className="space-y-6">
                            {result.questions.map((q: any, i: number) => {
                                const selectedOptionId = result.answers[q.id];
                                const selectedOption = q.options.find((o: any) => o.id === selectedOptionId);
                                
                                return (
                                    <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 print:border-none print:p-0 print:mb-4 print:break-inside-avoid">
                                        <div className="font-bold text-slate-800 mb-3 flex items-start">
                                            <span className="mr-2 text-indigo-600">{i + 1}.</span>
                                            {q.question_text}
                                        </div>
                                        <div className="pl-6">
                                            <div className="flex items-start text-sm">
                                                <span className="font-bold text-slate-500 w-16 uppercase text-xs tracking-wider">Respuesta:</span>
                                                <span className="font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-md print:bg-transparent print:p-0">
                                                    {selectedOption ? selectedOption.option_text : "No respondida"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Firma (Solo visible en impresión) */}
                    <div className="hidden print:block mt-16 pt-12">
                        <div className="flex justify-around">
                            <div className="text-center">
                                <div className="border-t border-black w-48 mx-auto pt-2 font-bold text-sm">Firma del Participante</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-black w-48 mx-auto pt-2 font-bold text-sm">Firma del Supervisor SSOMA</div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
