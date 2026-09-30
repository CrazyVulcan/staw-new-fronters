param([Parameter(Mandatory=$true)][string]$Directory)

Add-Type -AssemblyName System.Drawing
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$quality = [System.Drawing.Imaging.EncoderParameters]::new(1)
$quality.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 88L)

foreach ($source in Get-ChildItem -LiteralPath $Directory -File -Filter '*.source.*') {
    $stem = $source.Name.Split('.source.')[0]
    $destination = Join-Path $Directory ($stem + '.jpg')
    $temporary = Join-Path $Directory ($stem + '.tmp.jpg')
    $image = [System.Drawing.Image]::FromFile($source.FullName)
    try {
        $scale = [Math]::Min(1.0, [Math]::Min(1000.0 / $image.Width, 1400.0 / $image.Height))
        $width = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
        $height = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))
        $bitmap = [System.Drawing.Bitmap]::new($width, $height)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.Clear([System.Drawing.Color]::Black)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.DrawImage($image, 0, 0, $width, $height)
            } finally { $graphics.Dispose() }
            $bitmap.Save($temporary, $jpegCodec, $quality)
        } finally { $bitmap.Dispose() }
    } finally { $image.Dispose() }
    Remove-Item -LiteralPath $source.FullName
    Move-Item -LiteralPath $temporary -Destination $destination -Force
}

$quality.Dispose()
