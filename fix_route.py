import os

path = r'C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform\app\api\generate-acta-scsst\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const chartUrl = https://quickchart.io/chart?c= + encodeURIComponent(JSON.stringify(chartConfig)) + &w=600&h=300&bkg=white;',
    'const chartUrl = https://quickchart.io/chart?c= + encodeURIComponent(JSON.stringify(chartConfig)) + &w=600&h=300&bkg=white;'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
