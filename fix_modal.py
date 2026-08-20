import os

path = r'C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform\components\ActaGeneratorModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { X, Upload, Plus, Trash2, FileText, Download, Calendar, MapPin, Users, Target, CheckCircle2, Wand2 } from 'lucide-react';",
    "import { X, Upload, Plus, Trash2, FileText, Download, Calendar, MapPin, Users, Target, CheckCircle2, Wand2, Image as ImageIcon } from 'lucide-react';"
)

content = content.replace(
    "const [attendees, setAttendees] = useState<{nombre: string, cargo: string, tipo: string}[]>([",
    "const [attendees, setAttendees] = useState<{nombre: string, cargo: string, tipo: string, firma?: string}[]>(["
)

content = content.replace(
    "    const [attendees, setAttendees] = useState<{nombre: string, cargo: string, tipo: string, firma?: string}[]>([\n        { nombre: '', cargo: '', tipo: 'empleador' }\n    ]);",
    "    const [attendees, setAttendees] = useState<{nombre: string, cargo: string, tipo: string, firma?: string}[]>([\n        { nombre: '', cargo: '', tipo: 'empleador', firma: '' }\n    ]);"
)

attendees_code = """
                                            <select value={a.tipo} onChange={e => { const n = [...attendees]; n[i].tipo = e.target.value; setAttendees(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none">
                                                <option value="empleador">Titular Empleador</option>
                                                <option value="trabajador">Titular Trabajador</option>
                                                <option value="invitado">Invitado</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                title="Cargar firma"
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const n = [...attendees];
                                                            n[i].firma = reader.result as string;
                                                            setAttendees(n);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                            />
                                            <button className={p-2 rounded-lg transition-colors }>
                                                <ImageIcon size={14} />
                                            </button>
                                        </div>
                                        <button onClick={() => setAttendees(attendees.filter((_, idx) => idx !== i))} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
"""

old_attendees_code = """
                                            <select value={a.tipo} onChange={e => { const n = [...attendees]; n[i].tipo = e.target.value; setAttendees(n); }} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none">
                                                <option value="empleador">Titular Empleador</option>
                                                <option value="trabajador">Titular Trabajador</option>
                                                <option value="invitado">Invitado</option>
                                            </select>
                                        </div>
                                        <button onClick={() => setAttendees(attendees.filter((_, idx) => idx !== i))} className="p-2 bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
"""

content = content.replace(old_attendees_code, attendees_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

