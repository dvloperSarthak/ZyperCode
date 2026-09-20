Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Sarvadnya\Downloads\ZyperCode\terax-ai-main\src-tauri\icons\icon.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Save-Resized($w, $h, $dest) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($srcImg, 0, 0, $w, $h)
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

$iconsDir = "C:\Users\Sarvadnya\Downloads\ZyperCode\terax-ai-main\src-tauri\icons"
Save-Resized 32 32 (Join-Path $iconsDir "32x32.png")
Save-Resized 64 64 (Join-Path $iconsDir "64x64.png")
Save-Resized 128 128 (Join-Path $iconsDir "128x128.png")
Save-Resized 256 256 (Join-Path $iconsDir "128x128@2x.png")
Save-Resized 30 30 (Join-Path $iconsDir "Square30x30Logo.png")
Save-Resized 44 44 (Join-Path $iconsDir "Square44x44Logo.png")
Save-Resized 71 71 (Join-Path $iconsDir "Square71x71Logo.png")
Save-Resized 89 89 (Join-Path $iconsDir "Square89x89Logo.png")
Save-Resized 107 107 (Join-Path $iconsDir "Square107x107Logo.png")
Save-Resized 142 142 (Join-Path $iconsDir "Square142x142Logo.png")
Save-Resized 150 150 (Join-Path $iconsDir "Square150x150Logo.png")
Save-Resized 284 284 (Join-Path $iconsDir "Square284x284Logo.png")
Save-Resized 310 310 (Join-Path $iconsDir "Square310x310Logo.png")
Save-Resized 50 50 (Join-Path $iconsDir "StoreLogo.png")

$icoBmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($icoBmp)
$g.DrawImage($srcImg, 0, 0, 256, 256)
$hIcon = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream (Join-Path $iconsDir "icon.ico"), ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$g.Dispose()
$icoBmp.Dispose()
$srcImg.Dispose()
Write-Host "Icons generated successfully!"
