import os

modal_path = r'C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform\components\ActaGeneratorModal.tsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('a.download = \Acta_SCSST_\_\.docx\;', 'a.download = Acta_SCSST__.docx;')
content = content.replace('alert(\Error: \\\);', 'alert(Error: );')
content = content.replace('alert(\Error de IA: \\);', 'alert(Error de IA: );')

# Wait, the alert was: alert(\Error de IA: \\); wait no, I used \$ in powershell.
# Let's just fix it manually.
