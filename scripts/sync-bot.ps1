$ErrorActionPreference = 'Stop'

# ====================================================
# SCRIPT DE AUTOMATIZACIÓN - ANEXO 9 Y ESTADÍSTICAS
# Configurar Tarea Programada: Mensual, día 5
# ====================================================

# 1. Configuración de API
# Si pruebas en local cambia a: http://localhost:3000/api/bot-sync
$ApiUrl = "https://ssoma-platform.vercel.app/api/bot-sync"

$Location = "SAN CLEMENTE"
$ExcelPath = "C:\Users\jlcan\Desktop\CASA 2026\SGSST CASA 2026\Estadisticas 2026\F-SIG-011 Estadisticas de SST SC V05 15.07.21.xlsx"

Write-Host "INICIANDO BOT DE SINCRONIZACIÓN SSOMA" -ForegroundColor Cyan

if (-not (Test-Path $ExcelPath)) {
    Write-Host "Cuidado: No se encontró el archivo Excel en $ExcelPath" -ForegroundColor Red
    exit 1
}

# 2. Determinar Fecha de Cierre (Mes Anterior)
# Ya que este script corre los días 5, extraemos el mes *pasado* cerrado
$TargetDate = (Get-Date).AddMonths(-1)
$MonthToSync = $TargetDate.Month
$YearToSync = $TargetDate.Year

Write-Host "Obteniendo datos del Periodo: Mes $MonthToSync, Año $YearToSync" -ForegroundColor Yellow

# 3. Interacción con Microsoft Excel vía COM
$PdfPath = [System.IO.Path]::ChangeExtension($ExcelPath, ".pdf")
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    Write-Host "Aperturando Excel en segundo plano..." 
    $workbook = $excel.Workbooks.Open($ExcelPath)
    $sheet = $workbook.Sheets.Item(1)

    # 4. Convertir a PDF
    Write-Host "Convirtiendo Excel a PDF Temporal..."
    # 0 = xlTypePDF
    $sheet.ExportAsFixedFormat(0, $PdfPath)
    Write-Host "PDF Generado Exitósamente" -ForegroundColor Green

    # 5. Extraer Estadísticas (F-SIG-011)
    # En Excel, la columna de Enero = 4, Feb = 5... etc -> $MonthToSync + 3
    $ColIndex = $MonthToSync + 3

    function Get-CellValue ($row, $col) {
        $cellVal = $sheet.Cells.Item($row, $col).Value2
        if ($null -ne $cellVal) { return [double]$cellVal }
        return 0
    }

    $HHT = Get-CellValue 14 $ColIndex
    $TDP = Get-CellValue 24 $ColIndex
    $ATT = Get-CellValue 19 $ColIndex
    $APP = Get-CellValue 20 $ColIndex
    $ATP = Get-CellValue 21 $ColIndex
    $AM  = Get-CellValue 22 $ColIndex
    $EO  = Get-CellValue 10 $ColIndex
    $EP  = Get-CellValue 11 $ColIndex

    Write-Host "Estadísticas Extraidas:" -ForegroundColor Magenta
    Write-Host "HHT: $HHT | TDP: $TDP | ATT: $ATT"

    $statsObj = @{
        HHT = $HHT
        TDP = $TDP
        ATT = $ATT
        APP = $APP
        ATP = $ATP
        AM  = $AM
        EO  = $EO
        EP  = $EP
    }

} catch {
    Write-Host "Error interactuando con Excel: $_" -ForegroundColor Red
    if ($workbook) { $workbook.Close($false) }
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    exit 1
} finally {
    if ($workbook) { $workbook.Close($false) }
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}

# 6. Preparar Payload (Base64) y Enviar a Vercel
Write-Host "Preparando carga Base64..."
$byteArr = [System.IO.File]::ReadAllBytes($PdfPath)
$b64 = [System.Convert]::ToBase64String($byteArr)

$bodyObj = @{
    month = $MonthToSync
    year = $YearToSync
    location = $Location
    stats = $statsObj
    fileBase64 = $b64
    fileName = "Anexo09_SST_$Location`_$MonthToSync`_$YearToSync.pdf"
}

# Limpiar PDF temporal local
Remove-Item $PdfPath -Force -ErrorAction SilentlyContinue

$bodyJson = $bodyObj | ConvertTo-Json -Depth 5 -Compress

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Sincronizando con la Nube (Vercel)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $bodyJson -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "¡SINCRONIZACIÓN EXITOSA!" -ForegroundColor Green
        Write-Host "Nube Actualizada PDF -> " $response.pdfUrl
    } else {
        Write-Host "Error en la Nube:" $response.error -ForegroundColor Red
    }
} catch {
    Write-Host "Error en la conexión a Internet o a Vercel: $_" -ForegroundColor Red
}

Write-Host "Proceso Finalizado."
