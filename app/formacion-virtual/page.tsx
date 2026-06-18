"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, UserCheck, ShieldAlert, ChevronRight, Loader2, IdCard, Briefcase } from "lucide-react";

export default function FormacionVirtualLogin() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [dni, setDni] = useState("");
    const [role, setRole] = useState("Movimiento de tierras");
    const [isValidated, setIsValidated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [trainings, setTrainings] = useState<any[]>([]);
    const [failedTrainings, setFailedTrainings] = useState<any[]>([]);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await fetch("/api/virtual-training/validate-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: name })
            });
            const data = await res.json();
            
            if (data.success && data.valid) {
                setIsValidated(true);
                sessionStorage.setItem("vt_user_name", name.toUpperCase());
                sessionStorage.setItem("vt_user_dni", dni);
                sessionStorage.setItem("vt_user_role", role);
                fetchTrainings(name.toUpperCase(), role);
            } else {
                setErrorMsg(data.error || "No autorizado");
            }
        } catch (err) {
            setErrorMsg("Ocurrió un error al validar.");
        }
        setLoading(false);
    };

    const fetchTrainings = async (validatedName: string, selectedRole: string) => {
        try {
            const res = await fetch("/api/virtual-training");
            const data = await res.json();
            
            // Traer resultados del usuario para revisar si debe retomar un curso
            const resResults = await fetch(`/api/virtual-training/results?userName=${validatedName}`);
            const dataResults = await resResults.json();
            
            if (data.success) {
                const activeTrainings = data.trainings.filter((t: any) => 
                    t.is_active && (!t.category || t.category === 'Todos' || t.category === selectedRole)
                );
                setTrainings(activeTrainings);
                
                if (dataResults.success && dataResults.results) {
                    const failedList: any[] = [];
                    activeTrainings.forEach((t: any) => {
                        // Buscar el último intento de este usuario en este curso
                        const userAttempts = dataResults.results.filter((r: any) => r.training_id === t.id);
                        if (userAttempts.length > 0) {
                            // El primer elemento es el más reciente porque la API ordena por id DESC
                            const lastAttempt = userAttempts[0];
                            if (!lastAttempt.passed) {
                                failedList.push(t);
                            }
                        }
                    });
                    setFailedTrainings(failedList);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!isValidated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-indigo-700 p-8 text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-white">SCHOOL SSOMA</h1>
                        <p className="text-indigo-100 text-sm mt-2">Plataforma de Capacitación</p>
                    </div>
                    
                    <div className="p-8">
                        <form onSubmit={handleValidate}>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Número de DNI</label>
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <IdCard className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    value={dni}
                                    onChange={e => setDni(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={8}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                                    placeholder="Ej: 72345678"
                                />
                            </div>

                            <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos y Nombres</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCheck className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none uppercase"
                                    placeholder="Ej: PEREZ GOMEZ JUAN"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 mb-4">Debe coincidir con la lista oficial (SCTR).</p>

                            <label className="block text-sm font-bold text-slate-700 mb-2">Seleccione su Puesto / Área</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-slate-400" />
                                </div>
                                <select 
                                    required
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none bg-white appearance-none"
                                >
                                    <option value="Movimiento de tierras">Movimiento de tierras</option>
                                    <option value="Obras civiles">Obras civiles</option>
                                    <option value="Equipos">Equipos</option>
                                    <option value="Trabajador administrativo">Trabajador administrativo</option>
                                    <option value="Planta de asfalto">Planta de asfalto</option>
                                    <option value="Agregados">Agregados</option>
                                    <option value="Concreto">Concreto</option>
                                </select>
                            </div>
                            
                            {errorMsg && (
                                <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-start text-sm">
                                    <ShieldAlert className="w-5 h-5 mr-2 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full mt-6 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar a Capacitación'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Cursos Disponibles</h1>
                        <p className="text-slate-500 mt-1">Bienvenido, {name.toUpperCase()}</p>
                    </div>
                    <button 
                        onClick={() => { setIsValidated(false); sessionStorage.removeItem("vt_user_name"); setFailedTrainings([]); }}
                        className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                {failedTrainings.length > 0 && (
                    <div className="mb-8 bg-red-600 text-white p-6 rounded-2xl shadow-lg border border-red-700 flex items-start animate-pulse">
                        <ShieldAlert className="w-10 h-10 mr-4 shrink-0" />
                        <div>
                            <h3 className="font-black text-xl mb-1">¡Atención! Rendimiento Bajo</h3>
                            <p className="text-red-100 font-medium">
                                Debes realizar la evaluación otra vez por bajo rendimiento en los siguientes cursos:
                            </p>
                            <ul className="list-disc ml-5 mt-2 text-white font-bold">
                                {failedTrainings.map(ft => (
                                    <li key={ft.id}>{ft.title}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.map(t => (
                        <div key={t.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-100 overflow-hidden flex flex-col">
                            <div className="h-32 bg-indigo-100 flex items-center justify-center p-4">
                                <BookOpen className="w-12 h-12 text-indigo-300" />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{t.title}</h2>
                                <p className="text-sm text-slate-500 mb-6 flex-1">Capacitación virtual obligatoria. Al finalizar el video, deberás rendir una evaluación.</p>
                                
                                <button 
                                    onClick={() => router.push(`/formacion-virtual/${t.id}/watch`)}
                                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 transition-colors flex justify-between items-center px-5"
                                >
                                    <span>Iniciar Curso</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {trainings.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                            No hay cursos activos en este momento.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
