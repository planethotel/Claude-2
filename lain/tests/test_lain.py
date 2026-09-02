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
    verifier("portrait sur le message IA", page.locator(".msg.ai .portrait").count() == 1)
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

    print("\n[9] Portrait, avatar et animation")
    verifier("3 portraits presents (panneau, accueil, message)",
             page.locator(".portrait").count() == 3)
    verifier("repli geometrique quand aucun avatar",
             not page.evaluate("() => document.body.classList.contains('has-avatar')"))
    verifier("le repli est visible",
             page.locator("#portrait-sm .fallback").is_visible())
    # l'anneau doit etre un degrade : une box-shadow en % serait invisible
    anneau = page.evaluate("""() => getComputedStyle(
        document.querySelector('#portrait-lg .fallback'), '::after').backgroundImage""")
    verifier("anneau de l'oeil dessine (degrade, pas box-shadow)",
             "gradient" in anneau, anneau[:60])
    # l'etat "elle parle" est pilote par la fonction parle()
    page.evaluate("() => parle(true)")
    verifier("classe 'parle' posee sur les portraits",
             page.locator(".portrait.parle").count() == 3)
    verifier("classe 'parle' posee sur le body",
             page.evaluate("() => document.body.classList.contains('parle')"))
    page.screenshot(path=f"{SORTIE}/lain-05-parle.png")
    page.evaluate("() => parle(false)")
    verifier("etat 'parle' retirable", page.locator(".portrait.parle").count() == 0)

    print("\n[10] Avatar fourni par l'utilisateur")
    # 1x1 px transparent : suffit a prouver que la detection fonctionne
    page.evaluate("""() => {
        const px = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        document.documentElement.style.setProperty('--avatar', 'url("'+px+'")');
        document.body.classList.add('has-avatar');
    }""")
    page.wait_for_timeout(120)
    verifier("le repli disparait quand un avatar est present",
             not page.locator("#portrait-sm .fallback").is_visible())
    verifier("la couche image devient visible",
             page.locator("#portrait-sm .img").is_visible())
    page.evaluate("() => document.body.classList.remove('has-avatar')")

    print("\n[11] Voix")
    verifier("selecteur de voix present", page.locator("#voice").count() == 1)
    verifier("bouton voix coupe par defaut",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "false")
    # Chromium sans voix systeme : on verifie le comportement degrade
    nb_voix = page.evaluate("() => (window.speechSynthesis ? speechSynthesis.getVoices().length : -1)")
    print(f"  (info) voix systeme disponibles dans ce Chromium : {nb_voix}")
    page.locator("#voice-toggle").click()
    page.wait_for_timeout(150)
    verifier("le bouton bascule a actif",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "true")
    verifier("le libelle suit", "active" in page.locator("#voice-label").inner_text().lower())
    verifier("preference voix persistee",
             page.evaluate("() => localStorage.getItem('lain.voixActive')") == "1")
    page.locator("#voice-toggle").click()
    page.wait_for_timeout(100)
    verifier("le bouton se recoupe",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "false")

    print("\n[12] Decoupage en phrases pour la lecture")
    # creerDiseur ne doit parler qu'une fois la phrase terminee
    dit = page.evaluate("""() => {
        const sortie = [];
        const vrai = window.dire;
        window.dire = t => sortie.push(t);
        const d = creerDiseur();
        d.ajouter('Bonjour'); d.ajouter(' le mon');
        const avant = sortie.length;
        d.ajouter('de. Ca va'); d.ajouter(' bien ?');
        d.vider();
        window.dire = vrai;
        return {avant, phrases: sortie.map(s => s.trim())};
    }""")
    verifier("rien n'est lu tant que la phrase est incomplete", dit["avant"] == 0,
             str(dit))
    verifier("la phrase terminee est lue en entier",
             dit["phrases"] and dit["phrases"][0] == "Bonjour le monde.", str(dit["phrases"]))
    verifier("le reste est vide a la fin",
             "Ca va bien ?" in dit["phrases"], str(dit["phrases"]))

    print("\n[13] Erreurs JavaScript")
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
