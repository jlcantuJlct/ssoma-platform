"use client";

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, Save } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface TemplateUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TemplateUploadModal({ isOpen, onClose }: TemplateUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [existingTemplateUrl, setExistingTemplateUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchTemplate();
        }
    }, [isOpen]);

    const fetchTemplate = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/template-acta');
            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setExistingTemplateUrl(data.url);
                }
            }
        } catch (error) {
            console.error('Error fetching template:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/template-acta', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setExistingTemplateUrl(data.url);
                setFile(null);
                alert('Plantilla guardada correctamente.');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error: any) {
            console.error('Error uploading template:', error);
            alert(`Error al guardar: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Upload className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Formato de Acta</h2>
                            <p className="text-sm text-slate-400">Cargue la plantilla oficial (.docx)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center text-slate-400 text-sm">Cargando estado de la plantilla...</div>
                    ) : (
                        <>
                            {existingTemplateUrl && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <CheckCircle2 className="text-emerald-500" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-emerald-400">Plantilla Activa</h3>
                                        <p className="text-xs text-slate-400">El sistema ya cuenta con un formato guardado.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs">Subir / Actualizar Formato</h3>
                                <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group bg-slate-900/50">
                                    <input 
                                        type="file" 
                                        accept=".docx"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className={`p-4 rounded-full ${file ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-800 text-slate-400 group-hover:text-blue-400'}`}>
                                        <FileText size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-white">{file ? file.name : 'Arrastre su nuevo formato aquí'}</p>
                                        <p className="text-xs text-slate-500 mt-1">Solo se admiten documentos Word (.docx)</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isUploading || !file}
                        className="px-6 py-2.5 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        {isUploading ? 'Guardando...' : <><Save size={16} /> Guardar Formato Oficial</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
