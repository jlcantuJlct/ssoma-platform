"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, CheckCircle, HelpCircle } from "lucide-react";

export default function QuizPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const name = sessionStorage.getItem("vt_user_name");
        const dni = sessionStorage.getItem("vt_user_dni");
        if (!name || !dni) {
            router.push("/formacion-virtual");
            return;
        }
        setUserName(`${dni} - ${name}`);
        fetchQuestions();
    }, [params.id]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/virtual-training/questions?trainingId=${params.id}`);
            const data = await res.json();
            if (data.success && data.quiz) {
                // Barajar preguntas
                const shuffledQuestions = [...data.quiz].sort(() => Math.random() - 0.5);
                // Seleccionar solo 10 aleatorias
                const selectedQuestions = shuffledQuestions.slice(0, 10);
                // Barajar opciones
                selectedQuestions.forEach(q => {
                    q.options = [...q.options].sort(() => Math.random() - 0.5);
                });
                setQuestions(selectedQuestions);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleSelectOption = (questionId: string, optionId: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert(`Faltan ${questions.length - Object.keys(answers).length} preguntas por responder.`);
            return;
        }
        
        const confirmSubmit = window.confirm("¿Está seguro de enviar sus respuestas?");
        if (!confirmSubmit) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/virtual-training/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trainingId: params.id,
                    userName,
                    userDni: sessionStorage.getItem('vt_user_dni'),
                    userPosition: sessionStorage.getItem('vt_user_role'),
                    answers
                })
            });
            const data = await res.json();
            if (data.success) {
                // Guardar resultado localmente para mostrarlo en la siguiente pantalla (ya que no hay persistencia compleja de sesión para el resultado exacto, la DB ya lo guardó)
                sessionStorage.setItem(`vt_last_result_${params.id}`, JSON.stringify({
                    score: data.score,
                    passed: data.passed,
                    questions: questions,
                    answers: answers
                }));
                router.push(`/formacion-virtual/${params.id}/result`);
            } else {
                alert("Error: " + data.error);
                setSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10 border-b border-slate-200">
                <div className="flex items-center">
                    <button onClick={() => router.push(`/formacion-virtual/${params.id}/watch`)} className="text-slate-500 hover:text-slate-800 mr-4">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="font-black text-xl uppercase tracking-widest text-indigo-800">
                            SCHOOL SSOMA
                        </div>
                        <p className="text-xs text-slate-500">Evaluado: {userName}</p>
                    </div>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full font-bold text-sm border border-indigo-100">
                    {Object.keys(answers).length} / {questions.length} Respondidas
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-start">
                            <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 text-sm">
                                {qIndex + 1}
                            </span>
                            <span className="mt-1">{q.question_text}</span>
                        </h2>
                        
                        <div className="space-y-3">
                            {q.options.map((opt: any, oIndex: number) => {
                                const letters = ['A', 'B', 'C', 'D'];
                                const isSelected = answers[q.id] === opt.id;
                                return (
                                    <label 
                                        key={opt.id} 
                                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                            isSelected 
                                                ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                                                : 'border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm mr-4 shrink-0 transition-colors ${
                                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {letters[oIndex]}
                                        </div>
                                        <input 
                                            type="radio" 
                                            name={`question_${q.id}`} 
                                            className="hidden" 
                                            checked={isSelected}
                                            onChange={() => handleSelectOption(q.id, opt.id)}
                                        />
                                        <span className={`text-sm md:text-base ${isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'}`}>
                                            {opt.option_text}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <div className="pt-8 pb-12 flex justify-center">
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`font-bold py-4 px-12 rounded-xl text-lg transition-all shadow-lg flex items-center ${
                            submitting 
                                ? 'bg-slate-400 text-white cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'
                        }`}
                    >
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                        {submitting ? 'Evaluando...' : 'Finalizar Examen'}
                    </button>
                </div>
            </main>
        </div>
    );
}
