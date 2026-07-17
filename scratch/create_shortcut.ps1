$WshShell = New-Object -comObject WScript.Shell
$StartupPath = [System.Environment]::GetFolderPath('Startup')
$Shortcut = $WshShell.CreateShortcut("$StartupPath\EncenderPlataforma.lnk")
$Shortcut.TargetPath = "c:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform\ENCENDER_PLATAFORMA_LOCAL.bat"
$Shortcut.WorkingDirectory = "c:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma-platform"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
Write-Host "Shortcut created successfully at $StartupPath"
