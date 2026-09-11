"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  ClipboardList, Search, ExternalLink, CheckCircle, AlertCircle, Clock,
  Trash2, Camera, X, ChevronDown, ChevronUp, Plus
} from 'lucide-react';

type VehicleInspection = {
  id: number;
  correlativo: string;
  fecha: string;
  proyecto: string;
  equipo: string;
  marca: string;
  modelo: string;
  placa: string;
  chofer: string;
  turno: string;
  observaciones: string;
  nombre_colaborador: string;
  nombre_capataz: string;
  drive_url: string;
  status: 'Completado' | 'Con Observaciones' | 'Levantado';
  fotos_levantamiento: string;
  created_at: string;
};

const STATUS_CONFIG = {
  'Completado': { label: 'Completado', color: 'bg-green-100 text-green-700 border border-green-300', icon: <CheckCircle className="w-3 h-3" /> },
  'Con Observaciones': { label: 'Con Observaciones', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300', icon: <AlertCircle className="w-3 h-3" /> },
  'Levantado': { label: 'Levantado', color: 'bg-blue-100 text-blue-700 border border-blue-300', icon: <CheckCircle className="w-3 h-3" /> },
};

export default function VehicleInspectionsPage() {
  const { userInfo } = useAuth();
  const [records, setRecords] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [levantarModal, setLevantarModal] = useState<VehicleInspection | null>(null);
  const [fotosLevantamiento, setFotosLevantamiento] = useState<string[]>([]);
  const [savingLevantar, setSavingLevantar] = useState(false);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicle-inspections');
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
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
          setFotosLevantamiento(p => [...p, canvas.toDataURL('image/jpeg', 0.7)]);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLevantar = async () => {
    if (!levantarModal) return;
    setSavingLevantar(true);
    try {
      const res = await fetch('/api/vehicle-inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'levantar', id: levantarModal.id, data: { fotos: fotosLevantamiento } })
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Observaciones levantadas exitosamente.');
        setLevantarModal(null);
        setFotosLevantamiento([]);
        fetchRecords();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (e) { alert('Error de conexión.'); }
    setSavingLevantar(false);
  };

  const handleDelete = async (id: number, correlativo: string) => {
    if (!confirm(`¿Eliminar la inspección ${correlativo}? Esta acción es irreversible.`)) return;
    await fetch('/api/vehicle-inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    fetchRecords();
  };

  const filtered = records.filter(r => {
    const matchSearch = !search || [r.correlativo, r.placa, r.chofer, r.equipo, r.proyecto]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'Todos' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: records.length,
    conObs: records.filter(r => r.status === 'Con Observaciones').length,
    levantado: records.filter(r => r.status === 'Levantado').length,
    completado: records.filter(r => r.status === 'Completado').length,
  };

  return (
    <div className="p-4 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-600" /> Inspecciones de Vehículos y Equipos
            </h1>
            <p className="text-gray-500 text-sm mt-1">Panel de control, seguimiento y levantamiento de observaciones.</p>
          </div>
          <a href="/test-excel" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" /> Nueva Inspección
          </a>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-white' },
            { label: 'Con Observaciones', value: stats.conObs, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Levantadas', value: stats.levantado, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Sin Obs.', value: stats.completado, color: 'text-green-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border p-4 shadow-sm`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, placa, equipo, chofer..." className="pl-9 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Todos', 'Con Observaciones', 'Levantado', 'Completado'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando inspecciones...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No se encontraron inspecciones</p>
            <a href="/test-excel" className="mt-3 inline-block text-blue-600 text-sm font-semibold hover:underline">Registrar primera inspección →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG['Completado'];
              const isExpanded = expandedId === r.id;
              let fotosLevan: string[] = [];
              try { fotosLevan = JSON.parse(r.fotos_levantamiento || '[]'); } catch(e) {}

              return (
                <div key={r.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Fila principal */}
                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{r.correlativo}</span>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                        <span>🚛 {r.equipo} · {r.marca} {r.modelo}</span>
                        <span>🔖 Placa: <strong>{r.placa}</strong></span>
                        <span>👷 {r.chofer}</span>
                        <span>📅 {r.fecha}</span>
                        <span>📍 {r.proyecto}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.drive_url && (
                        <a href={r.drive_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold border border-blue-200 px-2 py-1 rounded">
                          <ExternalLink className="w-3 h-3" /> Ver Excel
                        </a>
                      )}
                      {r.status === 'Con Observaciones' && (
                        <button onClick={e => { e.stopPropagation(); setLevantarModal(r); setFotosLevantamiento([]); }} className="flex items-center gap-1 text-xs text-white bg-yellow-500 hover:bg-yellow-600 font-semibold px-2 py-1 rounded">
                          <Camera className="w-3 h-3" /> Levantar
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDelete(r.id, r.correlativo); }} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Detalle expandible */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4 text-sm space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div><span className="font-bold text-gray-500 uppercase block">Turno</span>{r.turno}</div>
                        <div><span className="font-bold text-gray-500 uppercase block">Colaborador</span>{r.nombre_colaborador || '-'}</div>
                        <div><span className="font-bold text-gray-500 uppercase block">Capataz/SSMA</span>{r.nombre_capataz || '-'}</div>
                        <div><span className="font-bold text-gray-500 uppercase block">Registrado</span>{new Date(r.created_at).toLocaleDateString('es-PE')}</div>
                      </div>

                      {r.observaciones && (
                        <div>
                          <span className="text-xs font-bold text-red-500 uppercase block mb-1">⚠️ Observaciones</span>
                          <p className="text-gray-700 bg-red-50 border border-red-100 rounded p-2 text-xs">{r.observaciones}</p>
                        </div>
                      )}

                      {fotosLevan.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-green-600 uppercase block mb-2">✅ Fotos de Levantamiento ({fotosLevan.length})</span>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {fotosLevan.map((f, i) => <img key={i} src={f} alt={`Levantamiento ${i+1}`} className="rounded border w-full h-auto object-cover" />)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Modal Levantar Observaciones */}
      {levantarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Levantar Observaciones · {levantarModal.correlativo}</h2>
              <button onClick={() => setLevantarModal(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-5">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
                <strong>Observación original:</strong> {levantarModal.observaciones || 'Sin texto'}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Adjuntar fotos de evidencia de corrección:</label>
              <input type="file" multiple accept="image/*" onChange={handleAddPhoto} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3" />

              {fotosLevantamiento.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {fotosLevantamiento.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={f} alt={`Foto ${i+1}`} className="rounded border w-full h-auto" />
                      <button onClick={() => setFotosLevantamiento(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button onClick={() => setLevantarModal(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-semibold">Cancelar</button>
                <button onClick={handleLevantar} disabled={savingLevantar || fotosLevantamiento.length === 0} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                  {savingLevantar ? 'Guardando...' : '✅ Confirmar Levantamiento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
