# Reproduce the artwork-only planner banner crop from the supplied Timeline reference.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'docs\design-references\AI-Assisted AMV Timeline Editor-4.png'
$destination = Join-Path $projectRoot 'frontend\src\assets\demo'
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
    $rectangle = New-Object System.Drawing.Rectangle(408, 68, 782, 378)
    $bitmap = $source.Clone($rectangle, $source.PixelFormat)
    try { $bitmap.Save((Join-Path $destination 'planner-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    finally { $bitmap.Dispose() }
} finally { $source.Dispose() }
Write-Output 'Extracted the artwork-only planner banner from the supplied local reference.'
