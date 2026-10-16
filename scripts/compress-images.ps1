Add-Type -AssemblyName System.Drawing

function Compress-And-Resize {
    param(
        [string]$SourcePath,
        [string]$DestPath,
        [int]$MaxWidth,
        [int]$MaxHeight,
        [string]$Format, # "png" or "jpeg"
        [int]$Quality = 85
    )

    $fullSource = (Resolve-Path $SourcePath).Path
    $orig = [System.Drawing.Image]::FromFile($fullSource)
    
    # Calculate target dimensions keeping aspect ratio
    $ratioX = $MaxWidth / $orig.Width
    $ratioY = $MaxHeight / $orig.Height
    $ratio = [Math]::Min($ratioX, $ratioY)
    if ($ratio -gt 1.0) { $ratio = 1.0 } # Don't upscale

    $newWidth = [int][Math]::Round($orig.Width * $ratio)
    $newHeight = [int][Math]::Round($orig.Height * $ratio)

    $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $graphics.DrawImage($orig, 0, 0, $newWidth, $newHeight)
    $graphics.Dispose()
    $orig.Dispose()

    $tempDest = "$fullSource.tmp"

    if ($Format -eq "jpeg") {
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
        $bmp.Save($tempDest, $codec, $encoderParams)
    } else {
        $bmp.Save($tempDest, [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $bmp.Dispose()

    $oldLen = (Get-Item $fullSource).Length
    $newLen = (Get-Item $tempDest).Length

    Move-Item -Path $tempDest -Destination $fullSource -Force
    Write-Host "Compressed $SourcePath`: $oldLen -> $newLen bytes ($([Math]::Round(($oldLen - $newLen)/$oldLen * 100, 1))% saved)"
}

# Compress logo and brand images
Compress-And-Resize "public\images\logo-orbit.png" "public\images\logo-orbit.png" 600 400 "png"
Compress-And-Resize "public\images\eventorax-app-icon.png" "public\images\eventorax-app-icon.png" 256 256 "png"
Compress-And-Resize "public\favicon.png" "public\favicon.png" 256 256 "png"
Compress-And-Resize "public\logo.png" "public\logo.png" 256 256 "png"
Compress-And-Resize "public\images\eventorax-logo-concept9.jpg" "public\images\eventorax-logo-concept9.jpg" 800 800 "jpeg" 85

# Compress root copy if exists
if (Test-Path "eventorax-logo-concept9.jpg") {
    Compress-And-Resize "eventorax-logo-concept9.jpg" "eventorax-logo-concept9.jpg" 800 800 "jpeg" 85
}

# Compress Avatars
for ($i = 1; $i -le 6; $i++) {
    $av = "public\images\avatar-$i.jpg"
    if (Test-Path $av) {
        Compress-And-Resize $av $av 256 256 "jpeg" 85
    }
}

# Update favicon.ico with compressed favicon
Copy-Item "public\favicon.png" "public\favicon.ico" -Force
Write-Host "All images successfully compressed!"
