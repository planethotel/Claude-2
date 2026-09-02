#Requires -Version 5.1
<#
.SYNOPSIS
    Lance LAIN : demarre Ollama si besoin, sert l'interface en local, ouvre le navigateur.
.DESCRIPTION
    L'interface est servie depuis http://127.0.0.1:<port> plutot qu'ouverte en file://
    parce qu'Ollama n'autorise par defaut que les origines localhost. Servir la page
    en localhost la fait donc accepter sans toucher a OLLAMA_ORIGINS -- ouvrir la
    porte a "toutes les origines" laisserait n'importe quel site web interroger ton
    modele local.
.EXAMPLE
    .\LAIN.ps1
    .\LAIN.ps1 -Port 9000
#>
param(
    [int]$Port = 8765,
    [switch]$PasDeNavigateur
)

$ErrorActionPreference = "Stop"
$Racine = Split-Path -Parent $MyInvocation.MyCommand.Path

function Info($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "OK  $m" -ForegroundColor Green }
function Fail($m) { Write-Host "ERREUR $m" -ForegroundColor Red; Read-Host "Entree pour fermer"; exit 1 }

if (-not (Test-Path (Join-Path $Racine "index.html"))) {
    Fail "index.html est introuvable a cote de ce script ($Racine)."
}

# --- 1. Ollama doit tourner ------------------------------------------------
function Test-Ollama {
    try { Invoke-RestMethod "http://127.0.0.1:11434/api/version" -TimeoutSec 3 | Out-Null; $true }
    catch { $false }
}

if (-not (Test-Ollama)) {
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Fail "Ollama n'est pas installe. Lance d'abord ..\ollama\install.ps1"
    }
    Info "Demarrage d'Ollama..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    foreach ($i in 1..30) { if (Test-Ollama) { break }; Start-Sleep -Seconds 1 }
    if (-not (Test-Ollama)) { Fail "Ollama n'a pas demarre sur 127.0.0.1:11434." }
}
Ok "Ollama repond"

# --- 2. Serveur local ------------------------------------------------------
# HttpListener sur 127.0.0.1 ne demande aucun droit administrateur.
$ecouteur = New-Object System.Net.HttpListener
$portRetenu = $null
foreach ($p in $Port..($Port + 12)) {
    try {
        $ecouteur.Prefixes.Clear()
        $ecouteur.Prefixes.Add("http://127.0.0.1:$p/")
        $ecouteur.Start()
        $portRetenu = $p
        break
    } catch {
        $ecouteur.Prefixes.Clear()   # port occupe : on essaie le suivant
    }
}
if (-not $portRetenu) { Fail "Aucun port libre entre $Port et $($Port + 12)." }

$url = "http://127.0.0.1:$portRetenu/"
Ok "LAIN sert sur $url"

if (-not $PasDeNavigateur) { Start-Process $url }

Write-Host ""
Write-Host "  LAIN est ouvert dans ton navigateur." -ForegroundColor Green
Write-Host "  Ferme cette fenetre (ou Ctrl+C) pour arreter LAIN." -ForegroundColor DarkGray
Write-Host ""

$types = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".ico"  = "image/x-icon"
}

try {
    while ($ecouteur.IsListening) {
        $ctx = $ecouteur.GetContext()
        $req = $ctx.Request
        $rep = $ctx.Response
        try {
            $chemin = $req.Url.LocalPath
            if ($chemin -eq "/" -or $chemin -eq "") { $chemin = "/index.html" }

            # On ne sert que des fichiers reellement sous $Racine : une requete
            # du type /../../Windows/... ne doit pas pouvoir remonter l'arborescence.
            $demande = Join-Path $Racine ($chemin.TrimStart("/") -replace "/", "\")
            $complet = [System.IO.Path]::GetFullPath($demande)
            $base = [System.IO.Path]::GetFullPath($Racine)

            if ((-not $complet.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) -or
                (-not (Test-Path -LiteralPath $complet -PathType Leaf))) {
                $rep.StatusCode = 404
                $octets = [Text.Encoding]::UTF8.GetBytes("404")
            } else {
                $ext = [System.IO.Path]::GetExtension($complet).ToLower()
                $rep.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
                $rep.StatusCode = 200
                $octets = [System.IO.File]::ReadAllBytes($complet)
            }
            $rep.ContentLength64 = $octets.Length
            $rep.OutputStream.Write($octets, 0, $octets.Length)
        } catch {
            # une requete cassee ne doit jamais tuer le serveur
        } finally {
            try { $rep.Close() } catch { }
        }
    }
} finally {
    if ($ecouteur.IsListening) { $ecouteur.Stop() }
    $ecouteur.Close()
}
