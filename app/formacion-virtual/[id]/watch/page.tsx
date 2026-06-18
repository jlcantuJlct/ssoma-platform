"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, PlayCircle, Loader2 } from "lucide-react";

export default function WatchTrainingPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [training, setTraining] = useState<any>(null);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const name = sessionStorage.getItem("vt_user_name");
        if (!name) {
            router.push("/formacion-virtual");
            return;
        }
        setUserName(name);
        fetchTraining();
    }, [params.id]);

    const fetchTraining = async () => {
        try {
            const res = await fetch(`/api/virtual-training/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setTraining(data.training);
            } else {
                alert(data.error);
                router.push("/formacion-virtual");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Extraer ID de YouTube
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Extraer ID de Google Drive
    const getDriveId = (url: string) => {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    };

    if (!training) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;

    const ytId = getYouTubeId(training.video_url);
    const driveId = getDriveId(training.video_url);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <header className="bg-indigo-700 p-4 flex justify-between items-center text-white shadow-md">
                <button onClick={() => router.push("/formacion-virtual")} className="flex items-center text-indigo-200 hover:text-white transition-colors font-medium">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Volver
                </button>
                <div className="font-black text-xl uppercase tracking-widest text-white drop-shadow-md">
                    Formación Virtual
                </div>
                <div className="text-sm text-indigo-200 font-medium">
                    <span className="hidden md:inline">Usuario: </span>{userName}
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row">
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-4 md:p-8">
                    <h2 className="text-white text-2xl md:text-3xl font-bold mb-6 text-center text-slate-200">{training.title}</h2>
                    
                    {ytId ? (
                        <div className="w-full max-w-5xl flex flex-col items-center">
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative bg-black mb-4">
                                <iframe 
                                    className="w-full h-full absolute top-0 left-0"
                                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`} 
                                    title="Capacitación"
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="text-slate-400 text-sm text-center">
                                ¿El video te aparece bloqueado o con una carita triste? <br className="md:hidden" />
                                <a href={training.video_url} target="_blank" className="text-indigo-400 font-bold ml-2 hover:underline">
                                    Haz clic aquí para verlo en YouTube
                                </a>
                            </p>
                        </div>
                    ) : driveId ? (
                        <div className="w-full max-w-5xl flex flex-col items-center">
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative bg-black mb-4">
                                <iframe 
                                    className="w-full h-full absolute top-0 left-0"
                                    src={`https://drive.google.com/file/d/${driveId}/preview`} 
                                    title="Capacitación (Google Drive)"
                                    frameBorder="0" 
                                    allow="autoplay" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="text-slate-400 text-sm text-center">
                                ¿Tienes problemas para ver el video? <br className="md:hidden" />
                                <a href={training.video_url} target="_blank" className="text-indigo-400 font-bold ml-2 hover:underline">
                                    Haz clic aquí para abrirlo en Google Drive
                                </a>
                            </p>
                        </div>
                    ) : (
                        <div className="text-white bg-slate-800 p-8 rounded-xl text-center">
                            <PlayCircle className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                            <p>Video no compatible o enlace inválido.</p>
                            <a href={training.video_url} target="_blank" className="text-indigo-400 hover:underline mt-2 inline-block">Abrir en nueva pestaña</a>
                        </div>
                    )}

                    <div className="mt-12 text-slate-500 text-xs font-semibold tracking-widest uppercase opacity-60">
                        Creador: JLCANTU
                    </div>
                </div>

                <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col">
                    <div className="flex-1">
                        <h2 className="text-white font-bold text-xl mb-4">Instrucciones</h2>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li className="flex items-start">
                                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white mr-3 shrink-0">1</span>
                                Visualiza el video completo. Puedes retroceder o pausarlo si lo necesitas.
                            </li>
                            <li className="flex items-start">
                                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white mr-3 shrink-0">2</span>
                                Tienes intentos ilimitados para aprobar. Puedes volver a ver el video las veces que quieras.
                            </li>
                            <li className="flex items-start">
                                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white mr-3 shrink-0">3</span>
                                La evaluación consta de 10 preguntas aleatorias de un banco de preguntas (2 puntos cada una). Nota mínima aprobatoria: 16.
                            </li>
                        </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-800">
                        <button 
                            onClick={() => router.push(`/formacion-virtual/${params.id}/quiz`)}
                            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/50 flex justify-center items-center"
                        >
                            <FileText className="w-5 h-5 mr-2" />
                            Iniciar Evaluación
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
