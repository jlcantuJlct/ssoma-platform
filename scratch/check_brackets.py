
with open('c:/Users/jlcan/Desktop/Seguimiento de plataforma de seguridad Antigravity/ssoma-platform/components/dashboard/DashboardCharts.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
    braces = 0
    parens = 0
    brackets = 0
    
    for i, char in enumerate(content):
        if char == '{': braces += 1
        elif char == '}': braces -= 1
        elif char == '(': parens += 1
        elif char == ')': parens -= 1
        elif char == '[': brackets += 1
        elif char == ']': brackets -= 1
        
        if braces < 0:
            print(f"Brace underflow at char {i}")
            # print surrounding text
            start = max(0, i - 50)
            end = min(len(content), i + 50)
            print(content[start:end])
            braces = 0
            
    print(f"Final counts: braces={braces}, parens={parens}, brackets={brackets}")
