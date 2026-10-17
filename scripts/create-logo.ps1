Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\orbit-iX\.gemini\antigravity-ide\brain\caa26aac-5787-42db-b202-1baf4cf51815\.user_uploaded\media_1792223168632.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# Bounding box calculation
$boxSize = 680
$srcRectX = [int](512 - ($boxSize / 2))
$srcRectY = [int](406 - ($boxSize / 2))
$srcRect = New-Object System.Drawing.Rectangle $srcRectX, $srcRectY, $boxSize, $boxSize

# 1. High quality 512x512 Dark Squircle / Icon
$outBmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($outBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$destRect = New-Object System.Drawing.Rectangle 0, 0, 512, 512
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Save dark/official icon assets
$outBmp.Save("public\images\eventrye-logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Save("public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Save("public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Save("public\images\eventorax-app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Favicon ico
$ico = New-Object System.Drawing.Bitmap $outBmp, 64, 64
$ico.Save("public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Icon)
$ico.Dispose()

# 2. Transparent background version
$transBmp = New-Object System.Drawing.Bitmap $outBmp
$transBmp.MakeTransparent([System.Drawing.Color]::FromArgb(0, 0, 0))
$transBmp.Save("public\images\eventrye-icon-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$transBmp.Dispose()

$outBmp.Dispose()
$bmp.Dispose()

Write-Output "Successfully generated Eventrye logos and favicons!"
