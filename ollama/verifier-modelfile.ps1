<#
.SYNOPSIS
    Verifie qu'un Modelfile Ollama ne contient pas d'erreurs de syntaxe courantes.
    Version PowerShell : aucune dependance, pas besoin de Python.
.EXAMPLE
    .\verifier-modelfile.ps1
    .\verifier-modelfile.ps1 -Chemin modelfiles\mon-ia.Modelfile
#>
param([string]$Chemin = "modelfiles\mon-ia.Modelfile")

if (-not (Test-Path -LiteralPath $Chemin)) {
    Write-Host "Fichier introuvable : $Chemin" -ForegroundColor Red
    exit 1
}

$Numeriques = @('temperature','top_p','top_k','repeat_penalty','repeat_last_n',
                'num_ctx','num_predict','seed','mirostat','mirostat_tau',
                'mirostat_eta','tfs_z','min_p','num_gpu','num_thread')

$Lignes  = @(Get-Content -LiteralPath $Chemin)
$Erreurs = [System.Collections.ArrayList]@()
$DansBloc = $false
$n = 0

foreach ($Ligne in $Lignes) {
    $n++

    # Un bloc SYSTEM """...""" : on ignore tout ce qu'il contient.
    if (([regex]::Matches($Ligne, '"""')).Count % 2 -eq 1) { $DansBloc = -not $DansBloc; continue }
    if ($DansBloc -or $Ligne.Trim() -eq '' -or $Ligne.TrimStart().StartsWith('#')) { continue }

    if ($Ligne -match '^PARAMETER\s+(\S+)\s+(.*)$') {
        $Cle = $Matches[1]
        $Val = $Matches[2].Trim()

        if ($Val.Contains('#')) {
            [void]$Erreurs.Add("ligne $n : commentaire en fin de ligne PARAMETER -> Ollama lit la valeur comme [$Val]")
            continue
        }
        if ($Numeriques -contains $Cle) {
            $Tmp = [double]0
            # InvariantCulture : sinon "0.8" est refuse sur un Windows francais,
            # ou le separateur decimal attendu est la virgule.
            $Ok = [double]::TryParse($Val, [Globalization.NumberStyles]::Float,
                                     [Globalization.CultureInfo]::InvariantCulture, [ref]$Tmp)
            if (-not $Ok) { [void]$Erreurs.Add("ligne $n : '$Cle' attend un nombre, recu [$Val]") }
        }
    }
}

if (-not ($Lignes | Where-Object { $_ -match '^FROM\s+\S+' })) {
    [void]$Erreurs.Add("aucune ligne FROM valide")
}

if ($Erreurs.Count -gt 0) {
    Write-Host "$Chemin : $($Erreurs.Count) probleme(s)" -ForegroundColor Red
    foreach ($e in $Erreurs) { Write-Host "  - $e" -ForegroundColor Yellow }
    exit 1
}

Write-Host "$Chemin : OK" -ForegroundColor Green
exit 0
