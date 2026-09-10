"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Loader2 } from 'lucide-react';

// Tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceNavigator() {
  const [isListening, setIsListening] = useState(false);
  const [supportSpeech, setSupportSpeech] = useState(true);
  const [feedback, setFeedback] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupportSpeech(false);
      }
    }
  }, []);

  const handleVoiceCommand = useCallback((transcript: string) => {
    // Aplicamos el auto-corrector en el navegador global también
    let corrected = transcript.replace(/\b(hawaii|hawai|jauy)\b/gi, 'Jahuay');
    const lower = corrected.toLowerCase();
    let handled = false;
    
    // Mapeo inteligente de herramientas completas
    const toolsMap = [
      { keys: ['generador', 'dinámico'], route: '/generador-informes', name: 'Generador Dinámico' },
      { keys: ['inicio', 'dashboard', 'principal', 'herramientas'], route: '/', name: 'Inicio' },
      { keys: ['hhc'], route: '/analytics', name: 'Control HHC' },
      { keys: ['formación', 'formacion'], route: '/formacion-virtual', name: 'Portal Formación' },
      { keys: ['inspección', 'inspecciones', 'inspeccion'], route: '/inspections', name: 'Inspecciones' },
      { keys: ['ats'], route: '/ats', name: 'ATS' },
      { keys: ['petar'], route: '/petar', name: 'PETAR' },
      { keys: ['epp', 'protección', 'proteccion'], route: '/epp', name: 'EPP' },
      { keys: ['top', 'tarjeta'], route: '/reporte-ac', name: 'Tarjeta TOP' },
      { keys: ['accidente', 'accidentes'], route: '/accidentes', name: 'Accidentes' },
      { keys: ['sctr'], route: '/sctr', name: 'SCTR' },
      { keys: ['scsst'], route: '/scsst', name: 'SCSST' },
      { keys: ['risstma'], route: '/risstma', name: 'RISSTMA' },
      { keys: ['simulacro', 'simulacros'], route: '/simulacro', name: 'Simulacros' },
      { keys: ['desvío', 'desvio', 'desvíos'], route: '/desvio', name: 'Desvíos' },
      { keys: ['emo', 'médico', 'medico'], route: '/evidence', name: 'Control de EMO' },
      { keys: ['monitoreo', 'ocupacional'], route: '/monitoreos', name: 'Monitoreo Ocupacional' },
      { keys: ['brigadista', 'brigadistas'], route: '/brigadistas', name: 'Brigadistas' },
      { keys: ['pma'], route: '/pma', name: 'Fotos PMA' },
      { keys: ['pesaje'], route: '/residuos', name: 'Pesaje de Residuos' },
      { keys: ['gestión de residuos', 'gestion de residuos'], route: '/gestion-residuos', name: 'Gestión de Residuos' },
      { keys: ['manifiesto', 'manifiestos'], route: '/manifiesto', name: 'Manifiestos' },
      { keys: ['autorizaciones', 'auxiliares'], route: '/autorizaciones-auxiliares', name: 'Aut. Áreas Aux.' },
      { keys: ['gestión sstma', 'gestion sstma', 'sstma docs'], route: '/sstma-docs', name: 'Doc. Gestión SSTMA' },
      { keys: ['compras'], route: '/compras-locales', name: 'Compras Locales' },
      { keys: ['informes'], route: '/informes', name: 'Control de Informes' },
      { keys: ['accidentabilidad'], route: '/reports', name: 'Control de Accidentabilidad' },
      { keys: ['actas', 'supervisión', 'supervision'], route: '/actas-supervision', name: 'Actas de Superv.' },
      { keys: ['certificados', 'equipo', 'equipos'], route: '/equipment-certs', name: 'Certificados de Equipo' },
      { keys: ['cliente'], route: '/cliente', name: 'Comunicación con Cliente' },
      { keys: ['programa'], route: '/program', name: 'Programa Anual' },
    ];

    for (const tool of toolsMap) {
        if (tool.keys.some(key => lower.includes(key))) {
            setFeedback(`Navegando a ${tool.name}...`);
            router.push(tool.route);
            handled = true;
            break;
        }
    }

    if (!handled) {
      if (lower.includes('jahuay') || lower.includes('chinchaysullo') || lower.includes('san clemente') || lower.includes('barandas') || lower.includes('mp6')) {
        // Si menciona una plantilla pero NO estamos en el generador, lo enviamos allá y emitimos el evento con retraso
        if (window.location.pathname !== '/generador-informes') {
            setFeedback(`Navegando a Generador para cargar ${corrected}...`);
            router.push('/generador-informes');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('voice-command-context', { detail: { transcript: corrected, lower } }));
            }, 1500); // Dar tiempo a que cargue la página
            handled = true;
        }
      }
    }

    if (!handled) {
      // Si no es una ruta principal, despachamos un evento para que la página actual (contexto)
      // decida si este comando aplica a alguna de sus sub-herramientas (ej: "Peaje Jahuy")
      setFeedback(`Buscando contexto para: "${corrected}"...`);
      
      const event = new CustomEvent('voice-command-context', { 
        detail: { transcript: corrected, lower } 
      });
      window.dispatchEvent(event);
    }

    // Ocultar feedback flotante después de 4 segundos
    setTimeout(() => {
      setFeedback("");
    }, 4000);
  }, [router]);

  const toggleListen = () => {
    if (!supportSpeech) {
      alert("Tu navegador no soporta comandos de voz. Por favor usa Chrome, Edge o Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES'; // Configuramos el reconocimiento en Español
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback("Soma escuchando...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Error de voz:", event.error);
      setIsListening(false);
      setFeedback("Error al escuchar. Intenta hablar más claro.");
      setTimeout(() => setFeedback(""), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
      {feedback && (
        <div className="bg-slate-800 text-white text-sm py-2 px-4 rounded-lg shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-4 max-w-xs text-center">
          {feedback}
        </div>
      )}
      <button
        onClick={toggleListen}
        className={`p-4 rounded-full shadow-lg transition-all flex items-center justify-center ${
          isListening 
            ? "bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-red-500/50" 
            : "bg-emerald-600 hover:bg-emerald-500 shadow-black/50"
        }`}
        title="Navegación por Voz"
      >
        {isListening ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
