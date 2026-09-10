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
    const lower = transcript.toLowerCase();
    let handled = false;
    
    // Mapeo inteligente de comandos de voz a rutas principales (orden de prioridad)
    if (lower.includes('generador') || lower.includes('dinámico')) {
      setFeedback("Navegando a Generador Dinámico...");
      router.push('/generador-informes');
      handled = true;
    } else if (lower.includes('inicio') || lower.includes('dashboard') || lower.includes('principal') || lower.includes('herramientas')) {
      setFeedback("Navegando a Inicio...");
      router.push('/');
      handled = true;
    } else if (lower.includes('ats')) {
      setFeedback("Navegando a ATS...");
      router.push('/ats');
      handled = true;
    } else if (lower.includes('petar')) {
      setFeedback("Navegando a PETAR...");
      router.push('/petar');
      handled = true;
    } else if (lower.includes('epp') || lower.includes('protección')) {
      setFeedback("Navegando a EPP...");
      router.push('/epp');
      handled = true;
    } else if (lower.includes('accidente')) {
      setFeedback("Navegando a Accidentes...");
      router.push('/accidentes');
      handled = true;
    } else if (lower.includes('top') || lower.includes('tarjeta')) {
      setFeedback("Navegando a Tarjeta TOP...");
      router.push('/reporte-ac');
      handled = true;
    } else if (lower.includes('simulacro')) {
      setFeedback("Navegando a Simulacros...");
      router.push('/simulacro');
      handled = true;
    } else if (lower.includes('inspección') || lower.includes('inspecciones')) {
      setFeedback("Navegando a Inspecciones...");
      router.push('/inspections');
      handled = true;
    } else if (lower.includes('emo') || lower.includes('médico')) {
      setFeedback("Navegando a Control de EMO...");
      router.push('/evidence');
      handled = true;
    } else if (lower.includes('ssoma') || lower.includes('programa')) {
      setFeedback("Navegando a Programa SSOMA...");
      router.push('/program');
      handled = true;
    }

    if (!handled) {
      // Si no es una ruta principal, despachamos un evento para que la página actual (contexto)
      // decida si este comando aplica a alguna de sus sub-herramientas (ej: "Peaje Jahuy")
      setFeedback(`Buscando contexto para: "${transcript}"...`);
      
      const event = new CustomEvent('voice-command-context', { 
        detail: { transcript, lower } 
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
