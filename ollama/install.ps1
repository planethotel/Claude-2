#Requires -Version 5.1
<#
.SYNOPSIS
    Installe Ollama + un modele local sur Windows, et verifie qu'il repond.
.EXAMPLE
    .\install.ps1
    .\install.ps1 -Modele dolphin3:8b
#>
param([string]$Modele = "")

$ErrorActionPreference = "Stop"

function Info($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Avert($m){ Write-Host "!!  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "ERREUR $m" -ForegroundColor Red; exit 1 }

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [Environment]::GetEnvironmentVariable("Path", "User")
}

function Test-Serveur {
    try   { Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/version" -TimeoutSec 3 | Out-Null; return $true }
    catch { return $false }
}

# --- 1. Machine ------------------------------------------------------------
$RamGo = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$Gpu = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ", "
Info "Windows | RAM : $RamGo Go | GPU : $Gpu"

# --- 2. Installation d'Ollama ---------------------------------------------
Refresh-Path
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Ok "Ollama deja installe"
} else {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Fail "winget introuvable. Telecharge Ollama ici : https://ollama.com/download/windows"
    }
    Info "Installation d'Ollama via winget..."
    winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements
    Refresh-Path
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Fail "Ollama installe mais absent du PATH. Ferme et rouvre PowerShell, puis relance ce script."
    }
    Ok "Ollama installe"
}

# --- 3. Serveur ------------------------------------------------------------
if (-not (Test-Serveur)) {
    Info "Demarrage du serveur..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    foreach ($i in 1..30) { if (Test-Serveur) { break }; Start-Sleep -Seconds 1 }
}
if (-not (Test-Serveur)) { Fail "Le serveur ne repond pas sur 127.0.0.1:11434" }
Ok "Serveur actif sur http://127.0.0.1:11434 (100% local, rien ne sort de ta machine)"

# --- 4. Choix du modele ----------------------------------------------------
if (-not $Modele) {
    if     ($RamGo -ge 32) { $Modele = "dolphin-mixtral:8x7b" }  # ~26 Go
    elseif ($RamGo -ge 16) { $Modele = "dolphin3:8b" }           # ~4.9 Go
    elseif ($RamGo -ge 8)  { $Modele = "dolphin-mistral:7b" }    # ~4.1 Go
    else                   { $Modele = "qwen2.5:3b" }            # ~1.9 Go
}
Info "Modele retenu : $Modele"
if ($Gpu -notmatch "NVIDIA|AMD") { Avert "Pas de GPU dedie detecte : generation sur CPU (lent mais fonctionnel)." }

Info "Telechargement (plusieurs Go, sois patient)..."
ollama pull $Modele
if ($LASTEXITCODE -ne 0) { Fail "Echec du telechargement de $Modele" }
Ok "Modele telecharge"

# --- 5. Ton modele personnalise -------------------------------------------
$Source = Join-Path $PSScriptRoot "modelfiles\mon-ia.Modelfile"
$Nom = $Modele   # bascule sur "mon-ia" uniquement si sa creation reussit
if (Test-Path $Source) {
    Info "Construction de 'mon-ia'..."
    $Tmp = Join-Path $env:TEMP "mon-ia.Modelfile"
    (Get-Content $Source) -replace '^FROM .*', "FROM $Modele" | Set-Content $Tmp -Encoding UTF8
    ollama create mon-ia -f $Tmp
    $CodeCreate = $LASTEXITCODE
    Remove-Item $Tmp -ErrorAction SilentlyContinue
    if ($CodeCreate -eq 0) {
        $Nom = "mon-ia"
        Ok "Modele 'mon-ia' cree - edite $Source pour changer sa personnalite"
    } else {
        # On NE bascule PAS sur 'mon-ia' : il n'existe pas, et 'ollama run' irait
        # le chercher sur le registre au lieu d'echouer proprement.
        Avert "'ollama create' a echoue. Le modele de base '$Modele' reste utilisable."
    }
} else {
    Avert "modelfiles\mon-ia.Modelfile introuvable : seul '$Modele' est disponible."
}

# --- 6. Verification -------------------------------------------------------
# On interroge l'API plutot que 'ollama run' : pas de sortie stderr native, donc
# pas de NativeCommandError sous $ErrorActionPreference = 'Stop'.
Info "Test de generation sur '$Nom' (peut prendre une minute sur CPU)..."
try {
    $Corps = @{ model = $Nom; prompt = "Reponds exactement: PRET"; stream = $false } | ConvertTo-Json
    $Res = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post `
                             -Body $Corps -ContentType "application/json" -TimeoutSec 300
    if ($Res.response) { Ok "Le modele repond : $($Res.response.Trim())" }
    else               { Avert "Reponse vide. Essaie a la main : ollama run $Nom" }
} catch {
    Avert "Test impossible ($($_.Exception.Message)). Essaie a la main : ollama run $Nom"
}

Write-Host ""
Write-Host "=== C'est pret ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Discuter            ollama run $Nom"
Write-Host "  Lister les modeles  ollama list"
Write-Host "  Changer sa perso    modelfiles\mon-ia.Modelfile  puis  .\install.ps1"
Write-Host "  L'entrainer         finetune\README.md"
Write-Host ""
