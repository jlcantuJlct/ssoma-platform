Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "c:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
WshShell.Run "cmd /c ""npm run dev""", 0, False
