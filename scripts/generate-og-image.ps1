Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$sourceLogo = Join-Path $baseDir "public\favicon.png"
$outputImage = Join-Path $baseDir "public\subhakary-og-image.png"

$width = 1200
$height = 630

function New-RoundedRectanglePath {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.RectangleF]$Rectangle,
    [Parameter(Mandatory = $true)][float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath

  $path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

try {
  $backgroundRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $backgroundRect,
    [System.Drawing.Color]::FromArgb(255, 36, 20, 14),
    [System.Drawing.Color]::FromArgb(255, 212, 168, 83),
    25
  )
  $graphics.FillRectangle($backgroundBrush, $backgroundRect)

  $overlayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 255, 255, 255))
  $graphics.FillEllipse($overlayBrush, 780, -120, 420, 420)
  $graphics.FillEllipse($overlayBrush, -120, 360, 340, 340)

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 255, 208, 120))
  $graphics.FillEllipse($glowBrush, 660, 180, 300, 300)

  $cardRect = New-Object System.Drawing.RectangleF 64, 84, 420, 462
  $cardPath = New-RoundedRectanglePath -Rectangle $cardRect -Radius 36
  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, 255, 250, 244))
  $graphics.FillPath($cardBrush, $cardPath)

  $cardBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(55, 255, 255, 255), 2)
  $graphics.DrawPath($cardBorderPen, $cardPath)

  $logo = [System.Drawing.Image]::FromFile($sourceLogo)
  try {
    $logoBounds = New-Object System.Drawing.Rectangle 104, 122, 340, 340
    $logoBackgroundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 0, 0, 0))
    $graphics.FillEllipse($logoBackgroundBrush, $logoBounds)
    $graphics.DrawImage($logo, $logoBounds)
  }
  finally {
    $logo.Dispose()
  }

  $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 26, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $websiteFont = New-Object System.Drawing.Font("Segoe UI Semibold", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $labelFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

  $textColor = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 248, 236))
  $mutedColor = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 228, 194))
  $darkText = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 29, 18))
  $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 212, 168, 83))

  $rightX = 540
  $titleRect = New-Object System.Drawing.RectangleF 540, 145, 580, 130
  $subtitleRect = New-Object System.Drawing.RectangleF 540, 274, 580, 86
  $websiteRect = New-Object System.Drawing.RectangleF 540, 394, 258, 58
  $finePrintRect = New-Object System.Drawing.RectangleF 540, 458, 560, 72

  $graphics.DrawString("Subhakary", $titleFont, $textColor, $titleRect)
  $graphics.DrawString("Wedding Planning & Verified Event Services", $subtitleFont, $mutedColor, $subtitleRect)

  $pillRect = New-Object System.Drawing.RectangleF 540, 394, 258, 58
  $pillPath = New-RoundedRectanglePath -Rectangle $pillRect -Radius 29
  $pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 233, 186))
  $graphics.FillPath($pillBrush, $pillPath)
  $graphics.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 214, 168, 83), 2)), $pillPath)
  $websiteFormat = New-Object System.Drawing.StringFormat
  $websiteFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $websiteFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString("subhakary.com", $websiteFont, $darkText, $websiteRect, $websiteFormat)

  $graphics.DrawString("Book photographers, poojaris, caterers, decorators, makeup artists, and function halls.", $labelFont, $textColor, $finePrintRect)
}
finally {
  $graphics.Dispose()
  $bitmap.Save($outputImage, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}
