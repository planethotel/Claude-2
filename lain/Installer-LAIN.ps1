#Requires -Version 5.1
<#
.SYNOPSIS
    Cree le raccourci LAIN sur le Bureau (et au menu Demarrer).
.DESCRIPTION
    Le raccourci lance LAIN.ps1 sans fenetre PowerShell visible, avec l'icone lain.ico.
    Aucun droit administrateur n'est necessaire.
.EXAMPLE
    .\Installer-LAIN.ps1
    .\Installer-LAIN.ps1 -Desinstaller
#>
param(
    [switch]$Desinstaller,
    [switch]$SansMenuDemarrer
)

$ErrorActionPreference = "Stop"
$Racine = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Fail($m) { Write-Host "ERREUR $m" -ForegroundColor Red; exit 1 }

$Bureau    = [Environment]::GetFolderPath("Desktop")
$Demarrer  = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$Raccourci = Join-Path $Bureau "LAIN.lnk"
$RaccMenu  = Join-Path $Demarrer "LAIN.lnk"
$Lanceur   = Join-Path $Racine "lain-lanceur.vbs"

# --- Desinstallation -------------------------------------------------------
if ($Desinstaller) {
    foreach ($f in @($Raccourci, $RaccMenu, $Lanceur)) {
        if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force; Ok "Supprime : $f" }
    }
    Write-Host "`nLAIN retire. Le dossier et tes conversations ne sont pas touches." -ForegroundColor Green
    exit 0
}

# --- Verifications ---------------------------------------------------------
$Script = Join-Path $Racine "LAIN.ps1"
$Icone  = Join-Path $Racine "lain.ico"
if (-not (Test-Path $Script)) { Fail "LAIN.ps1 introuvable dans $Racine" }
if (-not (Test-Path $Icone))  { Fail "lain.ico introuvable dans $Racine" }

# --- Lanceur silencieux ----------------------------------------------------
# wscript lance PowerShell en fenetre masquee : sans ca, une console noire
# clignote a chaque demarrage.
$vbs = @"
' Lanceur LAIN - demarre le serveur local sans fenetre visible
Dim shell, chemin
Set shell = CreateObject("WScript.Shell")
chemin = "$($Script -replace '"','""')"
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & chemin & """", 0, False
"@
Set-Content -LiteralPath $Lanceur -Value $vbs -Encoding ASCII
Ok "Lanceur silencieux cree"

# --- Raccourcis ------------------------------------------------------------
function Nouveau-Raccourci($cible) {
    $w = New-Object -ComObject WScript.Shell
    $r = $w.CreateShortcut($cible)
    $r.TargetPath       = "$env:SystemRoot\System32\wscript.exe"
    $r.Arguments        = """$Lanceur"""
    $r.WorkingDirectory = $Racine
    $r.IconLocation     = "$Icone,0"
    $r.Description      = "LAIN - ton IA locale"
    $r.Save()
}

Nouveau-Raccourci $Raccourci
Ok "Raccourci sur le Bureau : $Raccourci"

if (-not $SansMenuDemarrer) {
    if (-not (Test-Path $Demarrer)) { New-Item -ItemType Directory -Path $Demarrer -Force | Out-Null }
    Nouveau-Raccourci $RaccMenu
    Ok "Raccourci au menu Demarrer (tape 'LAIN' apres la touche Windows)"
}

Write-Host ""
Write-Host "=== LAIN est installe ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Double-clique sur l'icone LAIN de ton Bureau."
Write-Host "  Pour retirer les raccourcis : .\Installer-LAIN.ps1 -Desinstaller"
Write-Host ""
