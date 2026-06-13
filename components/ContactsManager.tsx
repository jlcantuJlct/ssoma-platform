'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, UserPlus, Shield, Building2 } from 'lucide-react';

type Contact = {
  id: number;
  name: string;
  email: string;
  area: string | null;
  is_permanent_cc: boolean;
};

export default function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newArea, setNewArea] = useState('');
  const [isCc, setIsCc] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          area: isCc ? null : newArea,
          is_permanent_cc: isCc
        })
      });

      if (res.ok) {
        setNewName('');
        setNewEmail('');
        setNewArea('');
        fetchContacts();
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const deleteContact = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
    
    try {
      const res = await fetch(`/api/contacts?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        
        {/* FORMULARIO */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-sm">
              <UserPlus size={16} /> Agregar Destinatario
            </h3>
            <form onSubmit={addContact} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Nombre Completo</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                  placeholder="Ej. Juan Pérez" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                  placeholder="juan@casacontratistas.com" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-900 sm:col-span-2">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-200 block">¿Es un CC Fijo?</label>
                  <p className="text-[10px] text-slate-500">Recibe copia de TODAS las alertas de inspecciones.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={isCc} 
                  onChange={e => setIsCc(e.target.checked)} 
                  className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-950 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
              </div>

              {!isCc && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Área a su cargo</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" 
                    placeholder="Ej. Almacén, Equipos, etc." 
                    value={newArea} 
                    onChange={e => setNewArea(e.target.value)} 
                    required={!isCc} 
                  />
                </div>
              )}

              <div className="sm:col-span-2 pt-2">
                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors">
                    Guardar Contacto
                  </button>
              </div>
            </form>
        </div>

        {/* LISTA */}
        <div>
            {loading ? (
              <div className="text-center py-4 text-slate-500 text-sm animate-pulse">Cargando directorio...</div>
            ) : (
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* CC FIJOS */}
                <div>
                  <h3 className="font-semibold text-orange-400 flex items-center space-x-2 mb-3 border-b border-slate-800 pb-2 text-sm">
                    <Shield size={16} />
                    <span>Copias Permanentes (CC Fijos)</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {contacts.filter(c => c.is_permanent_cc).map(contact => (
                      <div key={contact.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-lg group hover:border-orange-500/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-slate-200">{contact.name}</p>
                          <p className="text-xs text-slate-500">{contact.email}</p>
                        </div>
                        <button onClick={() => deleteContact(contact.id)} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RESPONSABLES POR AREA */}
                <div>
                  <h3 className="font-semibold text-blue-400 flex items-center space-x-2 mb-3 border-b border-slate-800 pb-2 mt-4 text-sm">
                    <Building2 size={16} />
                    <span>Responsables por Área</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {contacts.filter(c => !c.is_permanent_cc).map(contact => (
                      <div key={contact.id} className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800 rounded-lg group hover:border-blue-500/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm text-slate-200">{contact.name}</p>
                          <p className="text-[10px] text-blue-400 font-semibold uppercase">{contact.area}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{contact.email}</p>
                        </div>
                        <button onClick={() => deleteContact(contact.id)} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
        </div>

      </div>
    </div>
  );
}
