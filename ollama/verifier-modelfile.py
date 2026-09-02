"""Verifie qu'un Modelfile Ollama ne contient pas d'erreurs de syntaxe courantes."""
import re, sys, pathlib

NUMERIQUES = {"temperature","top_p","top_k","repeat_penalty","repeat_last_n",
              "num_ctx","num_predict","seed","mirostat","mirostat_tau",
              "mirostat_eta","tfs_z","min_p","num_gpu","num_thread"}

def verifier(chemin):
    erreurs = []
    texte = pathlib.Path(chemin).read_text(encoding="utf-8")
    dans_bloc = False
    for n, ligne in enumerate(texte.splitlines(), 1):
        if ligne.count('"""') % 2 == 1:
            dans_bloc = not dans_bloc
            continue
        if dans_bloc or not ligne.strip() or ligne.lstrip().startswith("#"):
            continue
        m = re.match(r'^PARAMETER\s+(\S+)\s+(.*)$', ligne)
        if not m:
            continue
        cle, val = m.group(1), m.group(2).strip()
        if "#" in val:
            erreurs.append(f"ligne {n}: commentaire en fin de ligne PARAMETER -> "
                           f"Ollama lit la valeur comme [{val}]")
            continue
        if cle in NUMERIQUES:
            try:
                float(val)
            except ValueError:
                erreurs.append(f"ligne {n}: '{cle}' attend un nombre, recu [{val}]")
    if not re.search(r'^FROM\s+\S+', texte, re.M):
        erreurs.append("aucune ligne FROM valide")
    return erreurs

code = 0
for f in sys.argv[1:]:
    errs = verifier(f)
    if errs:
        code = 1
        print(f"{f} : {len(errs)} probleme(s)")
        for e in errs: print("  -", e)
    else:
        print(f"{f} : OK")
sys.exit(code)
