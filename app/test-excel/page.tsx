"use client";

import React, { useState, useRef, useEffect } from 'react';

// --- CONFIGURACIÓN DEL FORMULARIO ---
const generalSections = [
  { category: 'CHASIS', items: ['Sistema de suspensión'] },
  { category: 'NEUMÁTICOS', items: ['Llantas delanteras (*)', 'Sistema de dirección (*)', 'Llantas posteriores (*)', 'Espárragos y Tuercas'] },
  { category: 'CABINA OPERADOR', items: ['Estribos (Peldaños)', 'Pasamanos', 'Llave de contacto', 'Cinturón de seguridad (*)', 'Espejos Retrovisiores (*)', 'Luces de Cabina', 'Limpiaparabrizas', 'Freno de mano (*)', 'Timón de dirección (*)', 'Pedales (*)', 'Palanca de velocidades (*)', 'Palanca de Tracción 4x4', 'Claxón (*)', 'Panel de control', 'Asientos', 'Vidrios de ventana', 'Neblineros (**)', 'Tapa tanque combustible'] },
  { category: 'SEGURIDAD', items: ['Circulina (**)', 'Alarma de retroceso (*)', 'Sistema de frenos (*)', 'Botiquín', 'Extintor', 'Conos/Triángulos de seguridad', 'Luces (*)'] },
  { category: 'FUGAS DE FLUIDO', items: ['Aceite de Motor', 'Aceite Dirección', 'Aceite Transmisión', 'Aceite Diferenciales'] },
  { category: 'NIVELES DE FLUIDO', items: ['Aceite motor (*)', 'Refrigerente (*)', 'Aceite Dirección (*)', 'Plumilla'] }
];

const specificSections: Record<string, string[]> = {
  'Camionetas': ['Protección antivuelcos', 'Radio de Comunicación'],
  'Transporte Personal': ['Asientos', 'Seguro Capot (*)', 'Cinturones de seguridad (*)', 'Ventanas', 'Luces Interiores'],
  'Cisterna de Agua': ['Tanque de Agua', 'Tapa superior', 'Motobomba de Agua', 'Manguera de succión', 'Válvula Check succión', 'Manguera de descarga', 'Escaleras / barandas ascenso', 'Válvulas de corte de fluido', 'Sistema de aspersión'],
  'Cisterna de Combustible': ['Tanque de combustible', 'Señalización (rombos NFPA / Indecopi)', 'Válvula de purga', 'Tapa superior', 'Surtidor de combustible', 'Manguera surtidor', 'Contómetro', 'Bomba de despacho', 'Barandas'],
  'Camiones Baranda': ['Plataforma posterior', 'Barandas', 'Seguro de baranda', 'Ganchos de amarre', 'Cuerdas y Sogas'],
  'Camiones Volquetes': ['Palanca activación pistón', 'Pistón de Levante Tolva*', 'Motor Hidráulico', 'Pines y seguro de tolva', 'Tolva', 'Compuerta de Tolva'],
  'Tracto': ['Tornamesa'],
  'Camiones Lubricadores': ['Depósitos de lubricantes', 'Depósito de aceite usado', 'Bombas Neumáticas', 'Manómetros de bomba', 'Depósito de refrigerantes', 'Compresor', 'Motor de compresor', 'Válvulas de seguridad', 'Espacios para herramientas', 'Dispensadores lubricantes'],
  'Semiremolque': ['Acople a Tornamesa (*)', 'Acoples sistema de frenos (*)', 'Válvulas (*)']
};

// Componente simple de Canvas para firma
const SignaturePad = ({ onSave, title }: { onSave: (data: string) => void, title: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = 'black'; }
    }
  }, []);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const rect = canvasRef.current?.getBoundingClientRect();
    if (ctx && rect) {
      ctx.beginPath();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const rect = canvasRef.current?.getBoundingClientRect();
    if (ctx && rect) {
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-gray-50 p-2 text-center">
      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">{title}</p>
      <canvas
        ref={canvasRef} width={300} height={120} className="bg-white border rounded shadow-inner mx-auto touch-none cursor-crosshair"
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
      />
      <button type="button" onClick={clear} className="mt-2 text-xs text-red-500 font-bold">Borrar Firma</button>
    </div>
  );
};

const DictationField = ({ label, name, required = false, isTextarea = false, formData, setFormData, handleChange, listeningField, startDictation }: any) => {
  const isListening = listeningField === name;
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        {isTextarea ? (
           <textarea name={name} required={required} value={formData[name] || ''} onChange={handleChange} rows={3} className="w-full border-gray-300 rounded p-2 border bg-gray-50 resize-none focus:ring-blue-500 focus:border-blue-500" />
        ) : (
           <input name={name} required={required} value={formData[name] || ''} onChange={handleChange} className="w-full border-gray-300 rounded p-2 border bg-gray-50 focus:ring-blue-500 focus:border-blue-500" />
        )}
        <div className={`flex ${isTextarea ? 'flex-col' : ''} gap-1`}>
            <button type="button" onClick={() => setFormData((p: any) => ({ ...p, [name]: '' }))} className="p-2 bg-red-50 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-colors flex items-center justify-center min-w-[40px] border border-red-100" title="Borrar">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <button type="button" onClick={() => startDictation(name)} className={`p-2 rounded min-w-[40px] flex items-center justify-center transition-all border ${isListening ? 'bg-red-500 text-white animate-pulse shadow-inner border-red-600' : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100'}`} title="Dictar por voz">
              {isListening ? (
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg>
              ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default function MobileFormPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proyecto: 'Red Vial 6',
    equipo: 'Camionetas',
    chofer: '', 
    marca: '', 
    modelo: '', 
    placa: '', 
    turno: 'Día',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
    horometro_inicial: '',
    horometro_final: '',
    nombre_colaborador: '',
    nombre_capataz: '',
    firma_colaborador: '',
    firma_capataz: '',
    fotos: [] as string[]
  });

  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [listeningField, setListeningField] = useState<string | null>(null);
  const [fotosHallazgos, setFotosHallazgos] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheck = (item: string, value: string) => {
    setChecklist(prev => ({ ...prev, [item]: value }));
  };

  const startDictation = (field: string) => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Dictado por voz no soportado.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    
    recognition.onstart = () => setListeningField(field);
    recognition.onend = () => setListeningField(null);
    recognition.onerror = () => setListeningField(null);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, [field]: prev[field as keyof typeof prev] + " " + transcript }));
    };
    
    recognition.start();
  };

  const [draftReady, setDraftReady] = useState(false);
  const [savingCloud, setSavingCloud] = useState(false);

  const preparePayload = () => {
    const obsCompletas = [autoObsTexto, formData.observaciones].filter(Boolean).join('\n\n--- Observaciones adicionales ---\n');
    
    // Preparar fotos con sus etiquetas
    const fotosEstructuradas: { base64: string | null; label: string }[] = [];
    autoObservaciones.forEach(obs => {
      const labelText = `[${obs.val}] Hallazgo: ${obs.item} | Plazo: ${obs.horas === 0 ? 'INMEDIATO' : obs.horas + ' horas'}`;
      const fotos = fotosHallazgos[obs.item] || [];
      if (fotos.length > 0) {
        fotos.forEach(b64 => fotosEstructuradas.push({ base64: b64, label: labelText }));
      } else {
        fotosEstructuradas.push({ base64: null, label: labelText });
      }
    });
    (formData.fotos || []).forEach((b64, idx) => {
      fotosEstructuradas.push({ base64: b64, label: `Evidencia General ${idx + 1}` });
    });

    return { 
      ...formData, 
      fotosEstructuradas, 
      observaciones: obsCompletas, 
      checklist: Object.entries(checklist).map(([label, value]) => ({ label, value })) 
    };
  };

  const handleGenerateDraft = async () => {
    if(!formData.chofer || !formData.marca || !formData.modelo || !formData.placa) {
      alert("Por favor complete todos los campos obligatorios de la cabecera (Chofer, Marca, Modelo, Placa).");
      return;
    }

    setLoading(true);
    try {
      const payload = preparePayload();
      const response = await fetch('/api/fill-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Borrador_${formData.equipo}_${formData.placa}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setDraftReady(true);
      } else {
        alert("Error generando borrador.");
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSaveToCloud = async () => {
    setSavingCloud(true);
    try {
      const payload = preparePayload();
      const response = await fetch('/api/save-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ ¡Inspección guardada exitosamente en la plataforma y Google Drive!");
        window.location.href = '/vehicle-inspections'; // Redirigir al nuevo dashboard

      } else {
        alert("Error al subir: " + (result.error || 'Desconocido'));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar.");
    }
    setSavingCloud(false);
  };

  // Calcular observaciones automáticas basadas en checklist
  const PLAZOS: Record<string, { label: string; horas: number; color: string; bg: string; border: string }> = {
    'R': { label: 'Regular', horas: 72, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300' },
    'M': { label: 'Malo',    horas: 48, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
    'F': { label: 'Falta',   horas: 0,  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-300' },
    'RESUM': { label: 'Resume', horas: 72, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300' },
    'FUGA': { label: 'Fuga', horas: 0, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
  };

  const autoObservaciones = Object.entries(checklist)
    .filter(([, val]) => ['R', 'M', 'F', 'RESUM', 'FUGA'].includes(val))
    .map(([item, val]) => ({ item, val, ...PLAZOS[val] }));

  const autoObsTexto = autoObservaciones.length > 0
    ? autoObservaciones.map(o =>
        o.horas === 0
          ? `[F-INMEDIATO] ${o.item}: Requiere corrección inmediata.`
          : `[${o.val}-${o.horas}h] ${o.item}: Plazo de ${o.horas} horas para corrección.`
      ).join('\n')
    : '';

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-50 min-h-screen pb-24 font-sans">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Inspección Diaria</h1>
      <p className="text-gray-600 mb-6 text-sm">El formulario se adaptará al tipo de equipo que seleccione.</p>

      {/* CABECERA Y SELECTOR INTELIGENTE UNIFICADO */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">Datos Generales</h2>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Proyecto <span className="text-red-500">*</span></label>
          <select name="proyecto" value={formData.proyecto} onChange={handleChange} className="w-full border-gray-300 rounded p-2 border bg-gray-50 focus:border-blue-500 focus:ring-blue-500">
            <option value="Red Vial 6">Red Vial 6</option>
            <option value="Longitudinal Tramo 4">Longitudinal Tramo 4</option>
            <option value="Aeropuerto">Aeropuerto</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Equipo a Inspeccionar <span className="text-red-500">*</span></label>
          <select name="equipo" value={formData.equipo} onChange={handleChange} className="w-full border-blue-300 rounded p-3 border bg-blue-50 text-blue-900 font-bold focus:ring-blue-500 focus:border-blue-500">
            {Object.keys(specificSections).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <p className="text-xs text-blue-500 mt-1">El formulario se actualizará según el equipo seleccionado.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DictationField name="marca" label="Marca" required formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
          <DictationField name="modelo" label="Modelo" required formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DictationField name="placa" label="Placa / Serie" required formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
          <DictationField name="turno" label="Turno" required formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
        </div>

        <DictationField name="chofer" label="Chofer" required formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />

        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Fecha <span className="text-red-500">*</span></label>
          <input type="date" name="fecha" required value={formData.fecha} onChange={handleChange} className="w-full p-2 border rounded bg-gray-50" />
        </div>
      </div>

      {/* BLOQUE 1: VEHÍCULO EN GENERAL (SIEMPRE VISIBLE) */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2"><span className="bg-slate-800 text-white w-6 h-6 inline-flex items-center justify-center rounded-full text-sm">1</span> Vehículo en General</h2>
      {generalSections.map((section, idx) => (
        <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b pb-2 mb-4">{section.category}</h3>
          <div className="space-y-4">
            {section.items.map(item => (
              <div key={item} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                <span className="text-sm text-gray-800 font-medium mb-2 sm:mb-0 w-1/2">{item}</span>
                <div className="flex gap-1 w-1/2 justify-end">
                  {(section.category === 'FUGAS DE FLUIDO' ? ['N/A_FUGA', 'RESUM', 'FUGA'] : ['OK', 'R', 'M', 'F', 'N/A']).map(opt => {
                    const isSelected = checklist[item] === opt;
                    const displayOpt = opt === 'N/A_FUGA' ? 'N/A' : opt;
                    return (
                      <button type="button" key={opt} onClick={() => handleCheck(item, opt)}
                        className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded border transition-colors ${
                          isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}>
                        {displayOpt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* BLOQUE 2: ESPECÍFICO DEL VEHÍCULO (CONDICIONAL) */}
      <h2 className="text-xl font-bold text-blue-800 mb-4 mt-8 flex items-center gap-2"><span className="bg-blue-800 text-white w-6 h-6 inline-flex items-center justify-center rounded-full text-sm">2</span> Específico: {formData.equipo}</h2>
      <div className="bg-blue-50/50 p-5 rounded-xl shadow-sm border border-blue-200 mb-4">
        <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide border-b border-blue-200 pb-2 mb-4">Inspección de {formData.equipo}</h3>
        <div className="space-y-4">
          {specificSections[formData.equipo]?.map(item => (
            <div key={item} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
              <span className="text-sm text-gray-800 font-medium mb-2 sm:mb-0 w-1/2">{item}</span>
              <div className="flex gap-1 w-1/2 justify-end">
                {['OK', 'R', 'M', 'F', 'N/A'].map(opt => {
                  const isSelected = checklist[item] === opt;
                  return (
                    <button type="button" key={opt} onClick={() => handleCheck(item, opt)}
                      className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded border transition-colors ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                      }`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOQUE 3: OBSERVACIONES */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2">
        <span className="bg-slate-800 text-white w-6 h-6 inline-flex items-center justify-center rounded-full text-sm">3</span>
        Cierre y Observaciones
        {autoObservaciones.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {autoObservaciones.length} hallazgo{autoObservaciones.length > 1 ? 's' : ''}
          </span>
        )}
      </h2>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
        {autoObservaciones.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm font-semibold">
            ✅ Sin hallazgos detectados — todos los ítems marcados OK o N/A
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm font-semibold">
            ⚠️ Se detectaron {autoObservaciones.length} hallazgo{autoObservaciones.length > 1 ? 's' : ''}. Adjunta las fotos en la Sección 5 ↓
          </div>
        )}
        <DictationField name="observaciones" label="Observaciones adicionales (opcional)" isTextarea formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
      </div>

      {/* BLOQUE 4: FIRMAS */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2"><span className="bg-slate-800 text-white w-6 h-6 inline-flex items-center justify-center rounded-full text-sm">4</span> Firmas de Conformidad</h2>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-6">
        
        {/* Colaborador */}
        <div>
          <DictationField name="nombre_colaborador" label="Nombre del Colaborador" formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
          <div className="mt-2">
            <SignaturePad title="Firma Colaborador" onSave={(data) => setFormData(p => ({...p, firma_colaborador: data}))} />
          </div>
        </div>

        {/* Capataz / SSMA */}
        <div className="border-t pt-4">
          <DictationField name="nombre_capataz" label="Nombre del Capataz / SSMA" formData={formData} setFormData={setFormData} handleChange={handleChange} listeningField={listeningField} startDictation={startDictation} />
          <div className="mt-2">
            <SignaturePad title="Firma Capataz / SSMA" onSave={(data) => setFormData(p => ({...p, firma_capataz: data}))} />
          </div>
        </div>
      </div>

      {/* BLOQUE 5: EVIDENCIA FOTOGRÁFICA */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2">
        <span className="bg-slate-800 text-white w-6 h-6 inline-flex items-center justify-center rounded-full text-sm">5</span>
        Evidencia Fotográfica
        {autoObservaciones.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {autoObservaciones.length} hallazgo{autoObservaciones.length > 1 ? 's' : ''}
          </span>
        )}
      </h2>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-6">

        {/* Hallazgos con foto individual */}
        {autoObservaciones.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              ⚠️ Hallazgos detectados — requieren levantamiento (adjunta foto de evidencia por cada uno)
            </p>
            <div className="space-y-4">
              {autoObservaciones.map((o, i) => {
                const fotos = fotosHallazgos[o.item] || [];
                return (
                  <div key={i} className={`rounded-xl border p-4 ${o.bg} ${o.border}`}>
                    {/* Cabecera del hallazgo */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`font-black text-sm min-w-[32px] text-center py-0.5 rounded border ${o.border} ${o.color} bg-white`}>{o.val}</span>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${o.color}`}>{o.item}</p>
                        <p className={`text-xs mt-0.5 ${o.color}`}>
                          {o.horas === 0 ? '🚨 Corrección INMEDIATA requerida' : `⏱ Plazo: ${o.horas} horas para corrección`}
                        </p>
                      </div>
                    </div>
                    {/* Foto de evidencia del hallazgo */}
                    <div>
                      <label className={`text-xs font-semibold ${o.color} block mb-1`}>Foto de evidencia del hallazgo:</label>
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 800;
                              const scale = MAX_WIDTH / img.width;
                              canvas.width = MAX_WIDTH;
                              canvas.height = img.height * scale;
                              canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                              const b64 = canvas.toDataURL('image/jpeg', 0.7);
                              setFotosHallazgos(prev => ({ ...prev, [o.item]: [...(prev[o.item] || []), b64] }));
                            };
                            img.src = ev.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                          e.target.value = ''; // reset para permitir subir más de una
                        }}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white file:text-gray-700 hover:file:bg-gray-50 mb-2"
                      />
                      {fotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {fotos.map((f, fi) => (
                            <div key={fi} className="relative">
                              <img src={f} alt={`Evidencia ${fi+1}`} className="rounded border w-full h-auto" />
                              <button type="button" onClick={() => setFotosHallazgos(prev => ({ ...prev, [o.item]: prev[o.item].filter((_, idx) => idx !== fi) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fotos generales adicionales */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            {autoObservaciones.length > 0 ? 'Otras fotos generales (opcional)' : 'Adjuntar Fotos (Opcional)'}
          </label>
          <input
            type="file" multiple accept="image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(p => ({ ...p, fotos: [...(p.fotos || []), base64] }));
                  };
                  img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
              });
            }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
          />
          {formData.fotos && formData.fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {formData.fotos.map((foto, idx) => (
                <div key={idx} className="relative border rounded p-1">
                  <img src={foto} alt={`Evidencia ${idx}`} className="w-full h-auto rounded" />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, fotos: p.fotos.filter((_, i) => i !== idx) }))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold shadow">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex flex-col md:flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        {!draftReady ? (
          <button onClick={handleGenerateDraft} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 w-full md:w-auto text-lg flex justify-center items-center gap-2">
            {loading ? <span className="animate-pulse">Generando...</span> : <span>Paso 1: Generar Borrador 📥</span>}
          </button>
        ) : (
          <div className="w-full flex flex-col md:flex-row justify-end gap-3 items-center">
            <span className="text-sm font-bold text-gray-600 mr-auto">¿Revisó el archivo descargado?</span>
            <button onClick={() => setDraftReady(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded shadow hover:bg-gray-300 w-full md:w-auto">
              Corregir Datos
            </button>
            <button onClick={handleSaveToCloud} disabled={savingCloud} className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow hover:bg-emerald-700 w-full md:w-auto text-lg flex justify-center items-center gap-2">
              {savingCloud ? <span className="animate-pulse">Subiendo a la nube...</span> : <span>Paso 2: Confirmar y Guardar Oficialmente ☁️</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
