import React, { useState } from 'react';
import { 
    FileText, 
    FileSpreadsheet, 
    Image as ImageIcon, 
    Download, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    FileEdit,
    Edit,
    X
} from 'lucide-react';
import { getDriveViewerUrl } from '@/lib/utils';

interface PreviewCarouselModalProps {
    urls: string[];
    onClose: () => void;
    onEdit?: () => void;
    canEdit?: boolean;
    filename?: string;
}

export default function PreviewCarouselModal({ 
    urls, 
    onClose, 
    onEdit, 
    canEdit = false,
    filename = "Documento adjunto"
}: PreviewCarouselModalProps) {
    const [previewIndex, setPreviewIndex] = useState(0);

    if (!urls || urls.length === 0) return null;

    const currentUrl = urls[previewIndex] || urls[0];
    
    const isImage = currentUrl.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/i);
    const isPdf = currentUrl.toLowerCase().match(/\.pdf$/i);
    const isWord = currentUrl.toLowerCase().match(/\.(doc|docx)$/i);
    const isExcel = currentUrl.toLowerCase().match(/\.(xls|xlsx)$/i);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                {isPdf ? <FileText size={20} className="text-red-400" /> : 
                                 isWord ? <FileEdit size={20} className="text-blue-400" /> :
                                 isExcel ? <FileSpreadsheet size={20} className="text-emerald-400" /> :
                                 <ImageIcon size={20} className="text-blue-400" />}
                                Vista Previa
                                {urls.length > 1 && <span className="text-slate-400 text-sm ml-2 font-normal">(Archivo {previewIndex + 1} de {urls.length})</span>}
                            </h3>
                            {canEdit && onEdit && (
                                <button 
                                    onClick={() => {
                                        onEdit();
                                        onClose();
                                    }}
                                    className="ml-4 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold uppercase transition-colors border border-amber-500/20 flex items-center gap-2"
                                >
                                    <Edit size={14} /> Cambiar Evidencia
                                </button>
                            )}
                        </div>
                        {filename && (
                            <div className="text-xs text-slate-400 ml-7 flex items-center gap-2">
                                <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {filename}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {urls.length > 1 && (
                            <div className="flex items-center gap-1 mr-4 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                <button 
                                    onClick={() => setPreviewIndex(prev => prev > 0 ? prev - 1 : urls.length - 1)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setPreviewIndex(prev => prev < urls.length - 1 ? prev + 1 : 0)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                        <a
                            href={currentUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                            title="Descargar este archivo"
                        >
                            <Download size={18} /> Descargar Individual
                        </a>
                        <button onClick={onClose} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors ml-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="w-full h-[75vh] flex items-center justify-center p-4 relative group">
                    {urls.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => prev > 0 ? prev - 1 : urls.length - 1); }}
                                className="absolute left-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setPreviewIndex(prev => prev < urls.length - 1 ? prev + 1 : 0); }}
                                className="absolute right-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 shadow-xl"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}
                    <iframe 
                        src={getDriveViewerUrl(currentUrl, false)} 
                        className="w-full h-full min-h-[60vh] rounded-lg border border-slate-800 shadow-2xl bg-slate-950" 
                        title="File Preview">
                    </iframe>
                </div>
            </div>
        </div>
    );
}
