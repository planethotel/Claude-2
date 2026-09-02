"""Teste l'interface LAIN dans Chromium : connexion, streaming, markdown, captures."""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/index.html"
SORTIE = "/tmp/claude-0/-home-user-Claude-2/ba78725a-9f28-5436-b1dd-1e47b2106c65/scratchpad"

echecs = []


def verifier(nom, condition, detail=""):
    if condition:
        print(f"  OK   {nom}")
    else:
        print(f"  ECHEC {nom} {detail}")
        echecs.append(nom)


with sync_playwright() as p:
    nav = p.chromium.launch(args=["--no-sandbox"])
    page = nav.new_page(viewport={"width": 1440, "height": 900})

    erreurs_js, requetes_ko = [], []
    page.on("pageerror", lambda e: erreurs_js.append("pageerror: " + str(e)))
    page.on("console", lambda m: erreurs_js.append("console: " + m.text) if m.type == "error" else None)
    page.on("requestfailed", lambda r: requetes_ko.append(r.url))

    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(600)

    print("\n[1] Etat initial")
    verifier("titre = LAIN", page.title() == "LAIN")
    verifier("ecran d'accueil visible", page.locator("#welcome").is_visible())
    verifier("fil masque au depart", not page.locator("#thread").is_visible())
    verifier("connecte a Ollama", "Connect" in page.locator("#status-txt").inner_text())
    verifier("3 modeles listes", page.locator("#model option").count() == 3)
    verifier("mon-ia selectionne par defaut",
             page.locator("#model").input_value() == "mon-ia:latest")
    verifier("badge affiche le modele", "mon-ia" in page.locator("#badge").inner_text())
    verifier("bouton envoyer desactive", page.locator("#send").is_disabled())
    page.screenshot(path=f"{SORTIE}/lain-01-accueil.png")

    print("\n[2] Saisie")
    page.locator("#input").fill("Explique-moi les closures en JavaScript")
    page.wait_for_timeout(150)
    verifier("bouton envoyer active", page.locator("#send").is_enabled())

    print("\n[3] Streaming")
    page.locator("#send").click()
    page.wait_for_timeout(250)
    verifier("curseur de frappe pendant le stream", page.locator(".caret").count() > 0)
    verifier("bouton passe en stop", "stop" in (page.locator("#send").get_attribute("class") or ""))
    page.screenshot(path=f"{SORTIE}/lain-02-streaming.png")

    page.wait_for_function("document.querySelectorAll('.caret').length === 0", timeout=15000)
    page.wait_for_timeout(300)

    print("\n[4] Rendu de la reponse")
    verifier("2 messages affiches", page.locator(".msg").count() == 2)
    verifier("bloc de code rendu", page.locator(".content pre code").count() == 1)
    verifier("bouton copier present", page.locator(".copy").count() == 1)
    verifier("gras rendu", page.locator(".content strong").count() >= 1)
    verifier("liste a puces rendue", page.locator(".content ul li").count() == 3)
    verifier("code inline rendu", page.locator(".content code:not(pre code)").count() >= 1)
    verifier("conversation creee dans le panneau", page.locator(".conv").count() == 1)
    verifier("titre de conversation mis a jour",
             "closures" in page.locator("#head-title").inner_text())
    verifier("bouton envoyer redevenu envoyer",
             "stop" not in (page.locator("#send").get_attribute("class") or ""))
    page.screenshot(path=f"{SORTIE}/lain-03-reponse.png")

    print("\n[5] Securite : le HTML du modele ne doit pas s'executer")
    injection = page.evaluate("""() => {
        const d = document.createElement('div');
        d.innerHTML = md('<img src=x onerror="window.__pwn=1">');
        return d.querySelectorAll('img').length;
    }""")
    verifier("HTML du modele echappe", injection == 0, f"(imgs={injection})")

    print("\n[6] Persistance et nouvelle conversation")
    stocke = page.evaluate("() => JSON.parse(localStorage.getItem('lain.convos')||'[]').length")
    verifier("conversation persistee", stocke == 1)
    page.locator("#btn-new").click()
    page.wait_for_timeout(200)
    verifier("retour a l'ecran d'accueil", page.locator("#welcome").is_visible())
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)
    verifier("conversation rechargee apres refresh", page.locator(".conv").count() == 1)

    print("\n[7] Panneau lateral")
    page.locator("#btn-toggle").click()
    page.wait_for_timeout(350)
    verifier("panneau masquable",
             "hidden" in (page.locator("#sidebar").get_attribute("class") or ""))
    page.locator("#btn-toggle").click()
    page.wait_for_timeout(350)

    print("\n[8] Responsive 390px")
    page.set_viewport_size({"width": 390, "height": 780})
    page.wait_for_timeout(400)
    debord = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 1")
    verifier("pas de debordement horizontal", not debord)
    page.screenshot(path=f"{SORTIE}/lain-04-mobile.png")

    print("\n[9] Erreurs JavaScript")
    externes = [u for u in requetes_ko if "fonts.g" in u]
    internes = [u for u in requetes_ko if "fonts.g" not in u]
    pageerrors = [e for e in erreurs_js if e.startswith("pageerror")]
    verifier("aucune exception JS", len(pageerrors) == 0, str(pageerrors[:3]))
    verifier("aucune requete locale en echec", len(internes) == 0, str(internes[:3]))
    if externes:
        print(f"  (info) {len(externes)} requete(s) Google Fonts en echec : "
              f"normal, pas d'internet dans cet environnement")

    nav.close()

print("\n" + "=" * 46)
if echecs:
    print(f"{len(echecs)} ECHEC(S) : {echecs}")
    sys.exit(1)
print("TOUS LES TESTS PASSENT")
