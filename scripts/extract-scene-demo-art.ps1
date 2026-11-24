# Reproduce artwork-only crops from the supplied Scene Library reference.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'docs\design-references\Neon Anime Scene Library Interface-3.png'
$destination = Join-Path $projectRoot 'frontend\src\assets\demo'
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$crops = @(
    @{ Name = 'scene-crying.png'; X = 305; Y = 684; Width = 459; Height = 183 },
    @{ Name = 'scene-confrontation.png'; X = 624; Y = 125; Width = 290; Height = 132 },
    @{ Name = 'scene-sunset.png'; X = 934; Y = 125; Width = 288; Height = 132 },
    @{ Name = 'scene-reaching.png'; X = 304; Y = 411; Width = 342; Height = 119 },
    @{ Name = 'scene-reunion.png'; X = 667; Y = 411; Width = 340; Height = 119 }
)

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
try {
    foreach ($crop in $crops) {
        $rectangle = New-Object System.Drawing.Rectangle($crop.X, $crop.Y, $crop.Width, $crop.Height)
        $bitmap = $source.Clone($rectangle, $source.PixelFormat)
        try { $bitmap.Save((Join-Path $destination $crop.Name), [System.Drawing.Imaging.ImageFormat]::Png) }
        finally { $bitmap.Dispose() }
    }
} finally { $source.Dispose() }
Write-Output 'Extracted five artwork-only scene crops from the supplied local reference.'
