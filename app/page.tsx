"use client";

import Link from "next/link";
import { 
    AlertTriangle, CheckSquare, BarChart2, FileText, ExternalLink, Users, 
    ClipboardCheck, Siren, Activity as ActivityIcon, TrendingUp, Shield, 
    ShieldCheck, Settings, Leaf, Clipboard, ArrowUpRight, BookOpen, Trash2, 
    Truck, GraduationCap, Search, ClipboardList, FileSignature, Stethoscope, 
    HardHat, Recycle, GitBranch, ShoppingCart, Scale, LifeBuoy, TrendingDown, 
    ClipboardSignature, Calendar, Archive
} from "lucide-react";

const tools = [
  {
    category: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: BarChart2, color: "text-sky-400" },
      { name: "Programa Anual", href: "/program", icon: Calendar, color: "text-emerald-400" },
    ]
  },
  {
    category: "Seguridad",
    items: [
      { name: "Control HHC", href: "/analytics", icon: GraduationCap, color: "text-yellow-500" },
      { name: "Portal Formación", href: "/formacion-virtual", icon: BookOpen, color: "text-indigo-400" },
      { name: "Control de Inspección", href: "/inspections", icon: Search, color: "text-cyan-500" },
      { name: "Control de ATS", href: "/ats", icon: ClipboardList, color: "text-amber-500" },
      { name: "Control de PETAR", href: "/petar", icon: FileSignature, color: "text-red-500" },
      { name: "Control de EPP", href: "/epp", icon: HardHat, color: "text-blue-500" },
      { name: "Control de Tarjeta TOP", href: "/reporte-ac", icon: AlertTriangle, color: "text-orange-500" },
      { name: "Control de Accidentes", href: "/accidentes", icon: Siren, color: "text-red-500" },
      { name: "Control de SCTR", href: "/sctr", icon: ShieldCheck, color: "text-emerald-500" },
      { name: "Control SCSST", href: "/scsst", icon: Users, color: "text-purple-500" },
      { name: "Control de RISSTMA", href: "/risstma", icon: BookOpen, color: "text-indigo-500" },
      { name: "Control Simulacro", href: "/simulacro", icon: Siren, color: "text-orange-400" },
      { name: "Control de Desvíos", href: "/desvio", icon: GitBranch, color: "text-fuchsia-500" },
    ]
  },
  {
    category: "Salud",
    items: [
      { name: "Control de EMO", href: "/evidence", icon: Stethoscope, color: "text-rose-500" },
      { name: "Monitoreo Ocupacional", href: "/monitoreos", icon: ActivityIcon, color: "text-rose-400" },
      { name: "Control de Brigadistas", href: "/brigadistas", icon: LifeBuoy, color: "text-sky-500" },
    ]
  },
  {
    category: "Medio Ambiente",
    items: [
      { name: "Control de Fotos PMA", href: "/pma", icon: Leaf, color: "text-emerald-500" },
      { name: "Pesaje de Residuos", href: "/residuos", icon: Scale, color: "text-teal-500" },
      { name: "Gestión de Residuos", href: "/gestion-residuos", icon: Archive, color: "text-emerald-500" },
      { name: "Control de Manifiestos", href: "/manifiesto", icon: Recycle, color: "text-lime-500" },
      { name: "Aut. Áreas Aux.", href: "/autorizaciones-auxiliares", icon: FileSignature, color: "text-cyan-500" },
    ]
  },
  {
    category: "Informes y Gestión",
    items: [
      { name: "Doc. Gestión SSTMA", href: "/sstma-docs", icon: ClipboardCheck, color: "text-emerald-500" },
      { name: "Compras Locales", href: "/compras-locales", icon: ShoppingCart, color: "text-fuchsia-500" },
      { name: "Control de Informes", href: "/informes", icon: FileText, color: "text-violet-500" },
      { name: "Control de Accidentabilidad", href: "/reports", icon: TrendingDown, color: "text-pink-500" },
      { name: "Control de Actas de Superv.", href: "/actas-supervision", icon: ClipboardSignature, color: "text-pink-500" },
      { name: "Certificados de Equipo", href: "/equipment-certs", icon: Truck, color: "text-blue-500" },
      { name: "Comunicación con Cliente", href: "/cliente", icon: ExternalLink, color: "text-cyan-500" },
      { name: "Generador Dinámico", href: "/generador-informes", icon: FileText, color: "text-violet-400" },
    ]
  }
];

export default function RootPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tighter mb-2">
            Panel de Herramientas
          </h1>
          <p className="text-slate-400">Seleccione una herramienta para comenzar</p>
        </header>

        <div className="space-y-10">
          {tools.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                {section.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.items.map((item, itemIdx) => (
                  <Link 
                    key={itemIdx} 
                    href={item.href}
                    className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all group shadow-sm text-center"
                  >
                    <div className={`p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform ${item.color}`}>
                      <item.icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-400 line-clamp-2">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
