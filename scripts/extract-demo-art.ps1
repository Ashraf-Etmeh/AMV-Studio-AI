# Reproduce the approved artwork-only crops. No image generation or remote assets.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot 'docs\design-references\Anime AMV Studio Dashboard-1.png'
$destination = Join-Path $projectRoot 'frontend\src\assets\demo'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
$crops = @(
    @{ Name = 'hero.png'; X = 1055; Y = 0; W = 617; H = 317 },
    @{ Name = 'sidebar.png'; X = 0; Y = 470; W = 305; H = 471 },
    @{ Name = 'workflow-song.png'; X = 338; Y = 343; W = 416; H = 161 },
    @{ Name = 'workflow-scenes.png'; X = 785; Y = 343; W = 416; H = 161 },
    @{ Name = 'workflow-generate.png'; X = 1231; Y = 343; W = 416; H = 161 },
    @{ Name = 'project-sky.png'; X = 629; Y = 724; W = 318; H = 82 },
    @{ Name = 'project-blossoms.png'; X = 979; Y = 724; W = 317; H = 82 },
    @{ Name = 'project-summer.png'; X = 1328; Y = 724; W = 317; H = 82 }
)
try {
    foreach ($crop in $crops) {
        $rectangle = New-Object System.Drawing.Rectangle($crop.X, $crop.Y, $crop.W, $crop.H)
        $bitmap = $source.Clone($rectangle, $source.PixelFormat)
        try {
            $bitmap.Save((Join-Path $destination $crop.Name), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $bitmap.Dispose() }
    }
} finally { $source.Dispose() }
Write-Output 'Extracted 8 local artwork crops from the Dashboard reference.'
