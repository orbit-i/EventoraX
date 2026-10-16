Add-Type -AssemblyName System.Drawing

$files = @(
    "public\favicon.png",
    "public\logo.png",
    "public\images\eventorax-app-icon.png",
    "public\images\eventorax-logo-concept9.jpg",
    "public\images\logo-orbit.png",
    "public\images\avatar-1.jpg",
    "public\images\avatar-2.jpg",
    "public\images\avatar-3.jpg",
    "public\images\avatar-4.jpg",
    "public\images\avatar-5.jpg",
    "public\images\avatar-6.jpg"
)

function Get-JpegCodec {
    return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
}

function Get-PngCodec {
    return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/png' }
}

$jpegCodec = Get-JpegCodec

foreach ($file in $files) {
    if (Test-Path $file) {
        $origSize = (Get-Item $file).Length
        $origImg = [System.Drawing.Image]::FromFile((Resolve-Path $file).Path)
        $w = $origImg.Width
        $h = $origImg.Height
        Write-Host "File: $file (${origSize} bytes, ${w}x${h})"
        $origImg.Dispose()
    }
}
