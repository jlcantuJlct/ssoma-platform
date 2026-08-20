const fs = require('fs');

let file = 'C:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/app/inspections/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore state
if (!content.includes('const [showGoals, setShowGoals] = useState(true);')) {
  content = content.replace(
    'const [showQuotaSettings, setShowQuotaSettings] = useState(false);',
    'const [showGoals, setShowGoals] = useState(true);\n    const [showQuotaSettings, setShowQuotaSettings] = useState(false);'
  );
}

// 2. Restore toggle button
if (!content.includes('onClick={() => setShowGoals(!showGoals)}')) {
  // We need to replace the click handler of Metas Manuales too
  content = content.replace(
    /onClick=\{\(\) => \{ setShowQuotaSettings\(!showQuotaSettings\); \}\}/g,
    'onClick={() => { setShowQuotaSettings(!showQuotaSettings); setShowGoals(true); }}'
  );

  const toggleButton = `
                            <button
                                onClick={() => setShowGoals(!showGoals)}
                                className={\`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border \${showGoals ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}\`}
                            >
                                <ActivityIcon size={20} className={showGoals ? "text-emerald-500" : ""} />
                                {showGoals ? 'Ocultar' : 'Ver Avance'}
                            </button>
`;

  content = content.replace(
    '                                    Metas Manuales\n                                </button>\n                            )}',
    '                                    Metas Manuales\n                                </button>\n                            )}\n' + toggleButton
  );
}

fs.writeFileSync(file, content);
console.log('Restored showGoals state and toggle button!');
