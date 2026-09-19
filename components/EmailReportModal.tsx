import React, { useState, useEffect } from 'react';
import { X, Send, Plus, Trash2, Mail, Users, Check, Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', name: 'Javier Alvarado', email: 'jalvarado@casacontratistas.com' },
  { id: '2', name: 'Jose Parodi', email: 'jparodi@casacontratistas.com' },
  { id: '3', name: 'Rodolfo Guerra', email: 'rguerra@casacontratistas.com' },
  { id: '4', name: 'Marcus Escobar', email: 'mescobar@casacontratistas.com' },
  { id: '5', name: 'Roberto Cabezas', email: 'rcabezas@casacontratistas.com' },
  { id: '6', name: 'Adrian Suarez', email: 'adrian142005@hotmail.com' },
  { id: '7', name: 'Javier Uculmana', email: 'juculmana@casacontratistas.com' },
  { id: '8', name: 'Jorge Jhosimar Espinoza', email: 'jespinoza@casacontratistas.com' },
  { id: '9', name: 'Gladis Arostes', email: 'garoste@casacontratistas.com' },
];

const SENDERS = [
  { name: 'Plataforma SSMA RED VIAL 6', email: 'jcancino@casacontratistas.com' },
  { name: 'Adrian Suarez', email: 'adrian142005@hotmail.com' }
];

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to: string[], cc: string[], subject: string, message: string, fromEmail: string, fromName: string }) => Promise<void>;
  defaultSubject?: string;
  isSending?: boolean;
  initialObservations?: string;
}

export function EmailReportModal({ 
  isOpen, 
  onClose, 
  onSend, 
  defaultSubject = 'Reporte de Inspección', 
  isSending = false,
  initialObservations = '' 
}: EmailReportModalProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'contacts'>('compose');
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Form state
  const [selectedTo, setSelectedTo] = useState<string[]>([]);
  const [selectedCc, setSelectedCc] = useState<string[]>([]);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [selectedSender, setSelectedSender] = useState(SENDERS[0]);

  // Contact management state
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Generate default message when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('ssoma_contacts');
      if (stored) {
        setContacts(JSON.parse(stored));
      } else {
        setContacts(DEFAULT_CONTACTS);
        localStorage.setItem('ssoma_contacts', JSON.stringify(DEFAULT_CONTACTS));
      }

      // Auto-generate message
      const hour = new Date().getHours();
      let greeting = 'Buenos días';
      if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
      else if (hour >= 19) greeting = 'Buenas noches';

      const obsText = initialObservations.trim() 
        ? `\n\n${initialObservations}` 
        : '\n\nNo se reportaron observaciones adicionales.';

      const autoMsg = `${greeting},\n\nSegún la inspección realizada, se informa de las siguientes observaciones:${obsText}\n\n[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]\n\nAtentamente,\n${selectedSender.name}`;
      
      // Only set if user hasn't typed anything else or it's empty
      if (!message || message.startsWith('Buenos días') || message.startsWith('Buenas tardes') || message.startsWith('Buenas noches')) {
        setMessage(autoMsg);
      }
    }
  }, [isOpen, initialObservations, selectedSender.name]);

  if (!isOpen) return null;

  const handleSaveContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return;
    const updated = [...contacts, { id: Date.now().toString(), name: newContactName, email: newContactEmail }];
    setContacts(updated);
    localStorage.setItem('ssoma_contacts', JSON.stringify(updated));
    setNewContactName('');
    setNewContactEmail('');
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('ssoma_contacts', JSON.stringify(updated));
    const deletedEmail = contacts.find(c => c.id === id)?.email;
    if (deletedEmail) {
      setSelectedTo(prev => prev.filter(e => e !== deletedEmail));
      setSelectedCc(prev => prev.filter(e => e !== deletedEmail));
    }
  };

  const handleSend = () => {
    if (selectedTo.length === 0) {
      alert('Por favor selecciona al menos un destinatario en "Para".');
      return;
    }
    onSend({ 
      to: selectedTo, 
      cc: selectedCc, 
      subject, 
      message,
      fromEmail: selectedSender.email === 'otro' ? (selectedSender as any).customEmail || '' : selectedSender.email,
      fromName: selectedSender.name
    });
  };

  const toggleSelection = (email: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(email)) {
      setList(list.filter(e => e !== email));
    } else {
      setList([...list, email]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('compose')}
              className={`flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'compose' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Mail size={18} /> Redactar Correo
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'contacts' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Users size={18} /> Gestionar Contactos
            </button>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'compose' ? (
            <div className="space-y-5">
              {/* Para */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Para (Destinatarios):</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border rounded-xl max-h-32 overflow-y-auto">
                  {contacts.map(c => (
                    <button
                      key={`to-${c.id}`}
                      onClick={() => toggleSelection(c.email, selectedTo, setSelectedTo)}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border transition-all ${selectedTo.includes(c.email) ? 'bg-indigo-100 border-indigo-300 text-indigo-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {selectedTo.includes(c.email) && <Check size={14} />}
                      {c.name}
                    </button>
                  ))}
                  {contacts.length === 0 && <span className="text-slate-400 text-sm">No hay contactos guardados. Ve a "Gestionar Contactos".</span>}
                </div>
              </div>

              {/* CC */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">CC (Copias):</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border rounded-xl max-h-32 overflow-y-auto">
                  {contacts.map(c => (
                    <button
                      key={`cc-${c.id}`}
                      onClick={() => toggleSelection(c.email, selectedCc, setSelectedCc)}
                      className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border transition-all ${selectedCc.includes(c.email) ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {selectedCc.includes(c.email) && <Check size={14} />}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Asunto:</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  className="w-full border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mensaje del Correo:</label>
                <textarea 
                  rows={8}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escribe el mensaje del correo..."
                  className="w-full border-slate-300 rounded-xl p-3 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Add new contact */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Plus size={18} /> Agregar Nuevo Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="Nombre completo" value={newContactName} onChange={e => setNewContactName(e.target.value)}
                    className="border-slate-300 rounded-lg p-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="email" placeholder="Correo electrónico" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)}
                      className="border-slate-300 rounded-lg p-2 text-sm flex-1"
                    />
                    <button onClick={handleSaveContact} disabled={!newContactName || !newContactEmail} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-lg font-bold disabled:opacity-50">
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact List */}
              <div>
                <h3 className="font-bold text-slate-700 mb-3">Contactos Guardados ({contacts.length})</h3>
                <div className="space-y-2">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-slate-500 text-xs">{c.email}</p>
                      </div>
                      <button onClick={() => handleDeleteContact(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {contacts.length === 0 && <p className="text-slate-500 text-sm italic">No hay contactos en la libreta.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'compose' && (
          <div className="p-4 border-t bg-slate-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} disabled={isSending} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button 
              onClick={handleSend} 
              disabled={isSending || selectedTo.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isSending ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
