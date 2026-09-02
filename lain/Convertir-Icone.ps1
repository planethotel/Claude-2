#Requires -Version 5.1
<#
.SYNOPSIS
    Transforme ton image (avatar.png/gif/jpg) en icone Windows lain.ico.
.DESCRIPTION
    A lancer apres avoir depose ton image dans ce dossier, puis relancer
    Installer-LAIN.ps1 pour que le raccourci prenne la nouvelle icone.
.EXAMPLE
    .\Convertir-Icone.ps1
    .\Convertir-Icone.ps1 -Source mon-image.png
#>
param(
    [string]$Source = "",
    [string]$Sortie = "lain.ico"
)

$ErrorActionPreference = "Stop"
$Racine = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Fail($m) { Write-Host "ERREUR $m" -ForegroundColor Red; exit 1 }

# --- Trouver l'image source ------------------------------------------------
if (-not $Source) {
    foreach ($n in @("avatar.gif","avatar.png","avatar.webp","avatar.jpg","avatar.jpeg")) {
        $essai = Join-Path $Racine $n
        if (Test-Path -LiteralPath $essai) { $Source = $essai; break }
    }
}
if (-not $Source) {
    Fail "Aucune image trouvee. Depose ton image ici sous le nom avatar.png (ou .gif/.jpg)."
}
if (-not [System.IO.Path]::IsPathRooted($Source)) { $Source = Join-Path $Racine $Source }
if (-not (Test-Path -LiteralPath $Source)) { Fail "Introuvable : $Source" }

Add-Type -AssemblyName System.Drawing

$cible = if ([System.IO.Path]::IsPathRooted($Sortie)) { $Sortie } else { Join-Path $Racine $Sortie }
$img = $null; $carre = $null; $g = $null; $flux = $null; $fichier = $null

try {
    $img = [System.Drawing.Image]::FromFile($Source)   # un GIF donne sa 1re image
    $cote = 256

    # Recadrage centre : on garde un carre au centre de l'image d'origine.
    $min = [Math]::Min($img.Width, $img.Height)
    $x = [int](($img.Width  - $min) / 2)
    $y = [int](($img.Height - $min) / 6)   # legerement haut : on vise le visage
    if ($y + $min -gt $img.Height) { $y = $img.Height - $min }
    if ($y -lt 0) { $y = 0 }

    $carre = New-Object System.Drawing.Bitmap($cote, $cote,
             [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($carre)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img,
        (New-Object System.Drawing.Rectangle(0, 0, $cote, $cote)),
        (New-Object System.Drawing.Rectangle($x, $y, $min, $min)),
        [System.Drawing.GraphicsUnit]::Pixel)

    # PNG en memoire, puis emballage dans un conteneur .ico.
    # Windows Vista et suivants acceptent une image PNG a l'interieur d'un .ico,
    # ce qui evite d'avoir a fabriquer un bitmap DIB a la main.
    $flux = New-Object System.IO.MemoryStream
    $carre.Save($flux, [System.Drawing.Imaging.ImageFormat]::Png)
    $png = $flux.ToArray()

    $fichier = [System.IO.File]::Create($cible)
    $bw = New-Object System.IO.BinaryWriter($fichier)
    # ICONDIR
    $bw.Write([UInt16]0)      # reserve
    $bw.Write([UInt16]1)      # type : 1 = icone
    $bw.Write([UInt16]1)      # nombre d'images
    # ICONDIRENTRY
    $bw.Write([Byte]0)        # largeur  : 0 signifie 256
    $bw.Write([Byte]0)        # hauteur  : 0 signifie 256
    $bw.Write([Byte]0)        # couleurs de palette
    $bw.Write([Byte]0)        # reserve
    $bw.Write([UInt16]1)      # plans
    $bw.Write([UInt16]32)     # bits par pixel
    $bw.Write([UInt32]$png.Length)
    $bw.Write([UInt32]22)     # offset des donnees (6 + 16)
    $bw.Write($png)
    $bw.Flush()
}
finally {
    if ($fichier) { $fichier.Dispose() }
    if ($flux)    { $flux.Dispose() }
    if ($g)       { $g.Dispose() }
    if ($carre)   { $carre.Dispose() }
    if ($img)     { $img.Dispose() }
}

Ok "Icone creee : $cible"
Write-Host ""
Write-Host "  Relance maintenant .\Installer-LAIN.ps1 pour appliquer la nouvelle icone." -ForegroundColor DarkGray
Write-Host "  (Windows garde les icones en cache : si elle ne change pas tout de suite," -ForegroundColor DarkGray
Write-Host "   deconnecte-toi et reconnecte-toi, ou redemarre l'explorateur.)" -ForegroundColor DarkGray
Write-Host ""
