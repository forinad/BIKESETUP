Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

$bg = New-RoundedPath 8 8 496 496 104
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 11, 13, 10))
$g.FillPath($bgBrush, $bg)

$lime = [System.Drawing.Color]::FromArgb(255, 201, 255, 61)
$pen = New-Object System.Drawing.Pen($lime, 20)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

# Колёса
$g.DrawEllipse($pen, 70, 274, 172, 172)
$g.DrawEllipse($pen, 270, 274, 172, 172)

# Рама
$rearHub = New-Object System.Drawing.PointF 156, 360
$seat = New-Object System.Drawing.PointF 258, 224
$head = New-Object System.Drawing.PointF 330, 224
$frontHub = New-Object System.Drawing.PointF 356, 360
$bb = New-Object System.Drawing.PointF 274, 356

$g.DrawLine($pen, $rearHub, $seat)
$g.DrawLine($pen, $seat, $head)
$g.DrawLine($pen, $head, $frontHub)
$g.DrawLine($pen, $seat, $bb)
$g.DrawLine($pen, $rearHub, $bb)

# Седло и руль
$seatPen = New-Object System.Drawing.Pen($lime, 16)
$seatPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$seatPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($seatPen, 238, 214, 286, 214)
$g.DrawLine($seatPen, 312, 214, 352, 214)

$dir = Join-Path $PSScriptRoot '..\build'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$bmp.Save((Join-Path $dir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$pen.Dispose()
$seatPen.Dispose()
$bgBrush.Dispose()
$g.Dispose()
$bmp.Dispose()
Write-Output (Get-Item (Join-Path $dir 'icon.png')).FullName
