# Reproduce the artwork-only crop from the supplied Song Analysis reference.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'docs\design-references\Neon Memories AMV Song Analysis UI-2.png'
$destination = Join-Path $projectRoot 'frontend\src\assets\demo'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
    $rectangle = New-Object System.Drawing.Rectangle(270, 155, 426, 250)
    $bitmap = $source.Clone($rectangle, $source.PixelFormat)
    try { $bitmap.Save((Join-Path $destination 'song-preview.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    finally { $bitmap.Dispose() }
} finally { $source.Dispose() }
Write-Output 'Extracted song preview artwork from the supplied local reference.'
