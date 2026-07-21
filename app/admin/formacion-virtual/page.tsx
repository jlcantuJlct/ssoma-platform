"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Check, Video, List, X, Loader2, Edit } from "lucide-react";

export default function AdminFormacionVirtual() {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'questions' | 'results'>('list');
    const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [category, setCategory] = useState<string[]>(["Todos"]);
    
    // Questions State (20 by default)
    const [questions, setQuestions] = useState<any[]>([]);
    
    // Bulk Load State
    const [bulkText, setBulkText] = useState("");

    useEffect(() => {
        if (activeTab === 'list') {
            fetchTrainings();
        } else if (activeTab === 'results') {
            fetchResults();
        }
    }, [activeTab]);

    const fetchTrainings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/virtual-training");
            const data = await res.json();
            if (data.success) {
                setTrainings(data.trainings);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/virtual-training/results");
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const fetchQuestions = async (tId: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/virtual-training/questions?trainingId=${tId}`);
            const data = await res.json();
            if (data.success) {
                if (data.quiz && data.quiz.length > 0) {
                    setQuestions(data.quiz);
                } else {
                    // Inicializar 20 preguntas
                    const initialQuestions = Array.from({ length: 20 }, (_, i) => ({
                        question_text: "",
                        options: [
                            { option_text: "", is_correct: true }, // A (marcamos una correcta por defecto para evitar errores)
                            { option_text: "", is_correct: false }, // B
                            { option_text: "", is_correct: false }, // C
                            { option_text: "", is_correct: false }, // D
                        ]
                    }));
                    setQuestions(initialQuestions);
                }
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleCreateTraining = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = selectedTrainingId && activeTab === 'create' ? `/api/virtual-training/${selectedTrainingId}` : "/api/virtual-training";
            const method = selectedTrainingId && activeTab === 'create' ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, video_url: videoUrl, category: category.join(', ') }),
            });
            const data = await res.json();
            if (data.success) {
                alert(selectedTrainingId && activeTab === 'create' ? "Capacitación actualizada" : "Capacitación creada");
                setTitle("");
                setVideoUrl("");
                setCategory(["Todos"]);
                setSelectedTrainingId(null);
                setActiveTab('list');
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteTraining = async (id: number) => {
        if (!window.confirm("¿Estás seguro de eliminar esta capacitación y todas sus preguntas?")) return;
        
        try {
            const res = await fetch(`/api/virtual-training/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchTrainings();
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveQuestions = async () => {
        // Validación básica
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].question_text) {
                alert(`La pregunta ${i + 1} está vacía`);
                return;
            }
            const hasCorrect = questions[i].options.some((o: any) => o.is_correct);
            if (!hasCorrect) {
                alert(`La pregunta ${i + 1} no tiene una opción correcta seleccionada`);
                return;
            }
        }

        try {
            const res = await fetch("/api/virtual-training/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trainingId: selectedTrainingId, questions }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Preguntas guardadas correctamente");
                setActiveTab('list');
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        const newQ = [...questions];
        newQ[qIndex].options.forEach((o: any, idx: number) => {
            o.is_correct = idx === oIndex;
        });
        setQuestions(newQ);
    };

    const handleBulkLoad = () => {
        if (!bulkText.trim()) return;
        
        // Expresión regular mejorada para separar por "Pregunta 1:", "**Pregunta 1:**", "1.", "**1."
        const blocks = bulkText.split(/(?:\*\*Pregunta \d+:?\*\*|Pregunta \d+:?|\*\*\d+\.|\b\d+\.)/gi).filter(b => b.trim() !== "");
        const newQuestions = [...questions];
        
        let qIdx = 0;
        blocks.forEach(block => {
            if (qIdx >= 20) return;
            const lines = block.split('\n').map(l => l.trim()).filter(l => l !== "" && !l.includes("***"));
            if (lines.length >= 2) {
                // La primera linea suele ser la pregunta
                newQuestions[qIdx].question_text = lines[0].replace(/^\*\*|\*\*$/g, '').trim();
                
                // Extraer opciones (hasta 4)
                let oIdx = 0;
                for (let i = 1; i < lines.length && oIdx < 4; i++) {
                    let text = lines[i];
                    // Identificar si la linea parece una opcion: A) o A.
                    if (text.match(/^[-\s]*[A-D][\)\.]/i)) {
                        const isCorrect = text.toUpperCase().includes('(CORRECTA)');
                        text = text.replace(/^[-\s]*[A-D][\)\.]\s*/i, '').replace(/\s*\*\*?\(CORRECTA\)\*\*?/i, '').replace(/\s*\(CORRECTA\)/i, '').trim();
                        newQuestions[qIdx].options[oIdx].option_text = text;
                        newQuestions[qIdx].options[oIdx].is_correct = isCorrect;
                        oIdx++;
                    }
                }
                
                // Si no se encontró ninguna opción marcada como correcta y se cargaron opciones, marcar la primera
                if (oIdx > 0 && !newQuestions[qIdx].options.some((o:any) => o.is_correct)) {
                    newQuestions[qIdx].options[0].is_correct = true;
                }
                
                qIdx++;
            }
        });
        
        setQuestions(newQuestions);
        setBulkText("");
        alert(`Se cargaron ${qIdx} preguntas con éxito.`);
    };

    const [originUrl, setOriginUrl] = useState("");
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOriginUrl(window.location.origin + '/formacion-virtual');
        }
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Administración de SCHOOL SSOMA</h1>
                    <p className="text-slate-500 mt-1">Crea y gestiona las capacitaciones para el personal</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center">
                    {originUrl ? (
                        <>
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(originUrl)}`} 
                                alt="QR Portal" 
                                className="w-16 h-16 mr-3 border border-slate-100 rounded"
                            />
                            <div className="text-sm">
                                <p className="font-bold text-slate-800">QR de Acceso</p>
                                <p className="text-slate-500 text-xs mb-2">Para el personal</p>
                                <a 
                                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(originUrl)}`}
                                    target="_blank"
                                    download="QR_Formacion.png"
                                    className="text-indigo-600 font-bold hover:underline text-xs"
                                >
                                    Ampliar / Guardar
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="w-16 h-16 mr-3 bg-slate-100 rounded animate-pulse" />
                    )}
                </div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Lista de Capacitaciones
                </button>
                <button 
                    onClick={() => {
                        setTitle("");
                        setVideoUrl("");
                        setCategory(["Todos"]);
                        setSelectedTrainingId(null);
                        setActiveTab('create');
                    }}
                    className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <Plus className="inline w-4 h-4 mr-1" /> Nueva Capacitación
                </button>
                <button 
                    onClick={() => setActiveTab('results')}
                    className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Reporte de Resultados
                </button>
            </div>

            {loading && <div className="flex justify-center my-12"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>}

            {!loading && activeTab === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{t.title}</h3>
                                {t.category && (
                                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold ml-2 text-center leading-none">
                                        {t.category.split(', ').filter((c: string) => ["Todos", "Conductor operador", "Trabajador administrativo", "Trabajador de OC", "Trabajador de Planta de concreto", "Trabajador de planta de asfalto", "Trabajador de Planta agregados", "Sub comite", "Brigadistas"].includes(c)).join(', ') || 'Todos'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mb-4 flex-1">
                                {t.is_active ? 'Activa' : 'Inactiva'}
                            </p>
                            <a href={t.video_url} target="_blank" className="text-sm text-indigo-600 hover:underline flex items-center mb-4">
                                <Video className="w-4 h-4 mr-1" /> Ver Video Original
                            </a>
                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => {
                                        setSelectedTrainingId(t.id);
                                        setActiveTab('questions');
                                        fetchQuestions(t.id);
                                    }}
                                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2 rounded-lg text-sm font-semibold flex justify-center items-center"
                                >
                                    <List className="w-4 h-4 mr-1" /> Gestionar Examen
                                </button>
                                <button 
                                    onClick={() => {
                                        setSelectedTrainingId(t.id);
                                        setTitle(t.title);
                                        setVideoUrl(t.video_url);
                                        const validOptions = ["Todos", "Conductor operador", "Trabajador administrativo", "Trabajador de OC", "Trabajador de Planta de concreto", "Trabajador de planta de asfalto", "Trabajador de Planta agregados", "Sub comite", "Brigadistas"];
                                        const cleanCategories = t.category ? t.category.split(', ').filter((c: string) => validOptions.includes(c)) : ["Todos"];
                                        setCategory(cleanCategories.length > 0 ? cleanCategories : ["Todos"]);
                                        setActiveTab('create');
                                    }}
                                    className="bg-amber-50 text-amber-600 hover:bg-amber-100 py-2 px-3 rounded-lg flex justify-center items-center transition-colors"
                                    title="Editar Capacitación"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteTraining(t.id)}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 py-2 px-3 rounded-lg flex justify-center items-center transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {trainings.length === 0 && <p className="text-slate-500 col-span-full">No hay capacitaciones creadas.</p>}
                </div>
            )}

            {!loading && activeTab === 'create' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4">
                        {selectedTrainingId ? "Editar Capacitación" : "Crear Nueva Capacitación"}
                    </h2>
                    <form onSubmit={handleCreateTraining} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Capacitación</label>
                            <input name="title" 
                                type="text" 
                                required 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Ej: Inducción SSOMA 2026"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Enlace del Video (YouTube o Drive)</label>
                            <input name="videoUrl" 
                                type="url" 
                                required
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                                placeholder="Ej: https://www.youtube.com/watch?v=..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Puesto Dirigido (Puedes seleccionar varios)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                {["Todos", "Conductor operador", "Trabajador administrativo", "Trabajador de OC", "Trabajador de Planta de concreto", "Trabajador de planta de asfalto", "Trabajador de Planta agregados", "Sub comite", "Brigadistas"].map(op => (
                                    <label key={op} className="flex items-center space-x-3 cursor-pointer">
                                        <input name="input_63076" 
                                            type="checkbox"
                                            className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            checked={category.includes(op)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    // Si selecciona "Todos", limpiamos los demás
                                                    if (op === "Todos") setCategory(["Todos"]);
                                                    else setCategory(prev => [...prev.filter(c => c !== "Todos"), op]);
                                                } else {
                                                    setCategory(prev => prev.filter(c => c !== op));
                                                }
                                            }}
                                        />
                                        <span className="text-slate-700 text-sm font-medium">{op === "Todos" ? "Todos (General)" : op}</span>
                                    </label>
                                ))}
                            </div>
                            {category.length === 0 && <p className="text-xs text-red-500 mt-1">Debes seleccionar al menos un puesto.</p>}
                        </div>
                        <div className="flex gap-4 pt-4">
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                            Guardar y Continuar
                        </button>
                        </div>
                    </form>
                </div>
            )}

            {!loading && activeTab === 'questions' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Gestionar Examen (20 Preguntas)</h2>
                        <button onClick={() => setActiveTab('list')} className="text-slate-500 hover:text-slate-800"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <h3 className="font-bold text-indigo-800 mb-2">Carga Rápida (Masiva)</h3>
                        <p className="text-sm text-indigo-600 mb-3">
                            Pega aquí todo el texto de las preguntas y alternativas. El sistema intentará llenar los recuadros automáticamente. (Formato: Pregunta 1: ... A) ... B) ... (CORRECTA) )
                        </p>
                        <textarea name="bulkText" 
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            rows={4}
                            className="w-full p-3 border border-indigo-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Pega las 20 preguntas aquí..."
                        />
                        <button 
                            onClick={handleBulkLoad}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 text-sm"
                        >
                            Procesar y Llenar
                        </button>
                    </div>

                    <div className="space-y-8">
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <div className="font-bold text-slate-700 mb-2">Pregunta {qIndex + 1}</div>
                                <input name="q_question_text" 
                                    type="text" 
                                    placeholder="Escribe la pregunta aquí..."
                                    value={q.question_text}
                                    onChange={(e) => {
                                        const newQ = [...questions];
                                        newQ[qIndex].question_text = e.target.value;
                                        setQuestions(newQ);
                                    }}
                                    className="w-full border border-slate-300 rounded-lg p-2 mb-4 font-medium"
                                />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((opt: any, oIndex: number) => {
                                        const letters = ['A', 'B', 'C', 'D'];
                                        return (
                                            <div key={oIndex} className={`flex items-center p-2 rounded-lg border ${opt.is_correct ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'}`}>
                                                <div className="font-bold text-slate-500 w-6">{letters[oIndex]}</div>
                                                <input name="opt_option_text" 
                                                    type="text" 
                                                    placeholder={`Opción ${letters[oIndex]}`}
                                                    value={opt.option_text}
                                                    onChange={(e) => {
                                                        const newQ = [...questions];
                                                        newQ[qIndex].options[oIndex].option_text = e.target.value;
                                                        setQuestions(newQ);
                                                    }}
                                                    className="flex-1 bg-transparent outline-none ml-2 text-sm"
                                                />
                                                <button 
                                                    onClick={() => setCorrectOption(qIndex, oIndex)}
                                                    className={`ml-2 p-1.5 rounded-full ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                                                    title="Marcar como correcta"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={handleSaveQuestions}
                            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            Guardar Examen
                        </button>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'results' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold border-b border-slate-200">Fecha</th>
                                <th className="p-4 font-semibold border-b border-slate-200">Capacitación</th>
                                <th className="p-4 font-semibold border-b border-slate-200">Colaborador</th>
                                <th className="p-4 font-semibold border-b border-slate-200">Nota</th>
                                <th className="p-4 font-semibold border-b border-slate-200">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString('es-PE')}</td>
                                    <td className="p-4 text-sm font-medium text-slate-800">{r.training_title}</td>
                                    <td className="p-4 text-sm text-slate-600">{r.user_name}</td>
                                    <td className="p-4 text-sm font-bold">{r.score} / 20</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {r.passed ? 'APROBADO' : 'DESAPROBADO'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {results.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">No hay evaluaciones registradas aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
