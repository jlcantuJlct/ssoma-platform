"use client";

import React, { useState, useEffect } from 'react';
import { Mic, Loader2, Eraser } from 'lucide-react';

interface VoiceDictationProps {
  onResult: (text: string) => void;
  onClear?: () => void;
  className?: string;
}

export default function VoiceDictation({ onResult, onClear, className = "" }: VoiceDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [supportSpeech, setSupportSpeech] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupportSpeech(false);
      }
    }
  }, []);

  const toggleListen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!supportSpeech) {
      alert("Tu navegador no soporta dictado por voz.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = event.results[0][0].transcript.trim();
      const lower = transcript.toLowerCase();
      
      // Comandos de borrado por voz
      if (
        lower === 'eliminar texto' || 
        lower === 'borrar todo' || 
        lower === 'elimina el texto' ||
        lower === 'elimina el texto redactado' ||
        lower === 'borrar texto' ||
        lower === 'eliminar'
      ) {
          if (onClear) onClear();
          return;
      }
      
      // Auto-corrector de palabras específicas del proyecto
      transcript = transcript.replace(/\b(hawaii|hawai|jauy)\b/gi, 'Jahuay');
      
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Error de voz:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!supportSpeech) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={toggleListen}
        type="button"
        className={`p-2 rounded-full transition-all flex items-center justify-center ${
          isListening 
            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" 
            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
        }`}
        title={isListening ? "Escuchando..." : "Dictado por voz"}
      >
        {isListening ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      
      {onClear && (
        <button
          onClick={(e) => { e.preventDefault(); onClear(); }}
          type="button"
          className="p-2 rounded-full transition-all flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
          title="Borrar texto"
        >
          <Eraser className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
