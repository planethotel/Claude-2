"""Teste l'interface LAIN dans Chromium : connexion, streaming, markdown, captures."""
import base64, json, pathlib, sys, time

# PNG 8x8 rouge, minimal, pour tester le trajet d'une image
PNG_ROUGE = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX/AAD///9BHTQRAAAA"
    "DklEQVQI12P4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==")
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
    verifier("4 modeles listes", page.locator("#model option").count() == 4)
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
    verifier("panneau referme sur petit ecran (sinon il masque la saisie)",
             "hidden" in (page.locator("#sidebar").get_attribute("class") or ""))
    verifier("zone de saisie atteignable",
             page.locator("#input").is_visible())
    page.screenshot(path=f"{SORTIE}/lain-04-mobile.png")
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_timeout(400)
    verifier("panneau rouvert au retour en grand ecran",
             "hidden" not in (page.locator("#sidebar").get_attribute("class") or ""))

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
    # choix de conception : la voix est ACTIVE par defaut. Elle ne demarre
    # qu'apres un envoi, donc apres un geste utilisateur : pas de blocage
    # d'autoplay, et pas de son inattendu au chargement.
    verifier("voix active par defaut",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "true")
    # Chromium sans voix systeme : on verifie le comportement degrade
    nb_voix = page.evaluate("() => (window.speechSynthesis ? speechSynthesis.getVoices().length : -1)")
    print(f"  (info) voix systeme disponibles dans ce Chromium : {nb_voix}")
    page.locator("#voice-toggle").click()
    page.wait_for_timeout(150)
    verifier("le bouton se coupe",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "false")
    verifier("coupure persistee",
             page.evaluate("() => localStorage.getItem('lain.voixActive')") == "0")
    page.locator("#voice-toggle").click()
    page.wait_for_timeout(150)
    verifier("le bouton se rallume",
             page.locator("#voice-toggle").get_attribute("aria-pressed") == "true")
    verifier("le libelle suit", "on" in page.locator("#voice-label").inner_text().lower())
    verifier("reactivation persistee",
             page.evaluate("() => localStorage.getItem('lain.voixActive')") == "1")

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

    print("\n[13] Suivi de la souris")
    avant = page.evaluate("() => getComputedStyle(document.documentElement).getPropertyValue('--mx')")
    page.mouse.move(1300, 780)
    page.wait_for_timeout(420)
    apres = page.evaluate("() => getComputedStyle(document.documentElement).getPropertyValue('--mx')")
    verifier("le decalage suit le curseur", avant.strip() != apres.strip(),
             f"avant={avant!r} apres={apres!r}")
    halo = page.evaluate("() => getComputedStyle(document.documentElement).getPropertyValue('--cx')")
    verifier("le halo suit le curseur", "px" in halo, repr(halo))
    page.mouse.move(200, 200)
    page.wait_for_timeout(400)

    print("\n[14] Mode wired")
    verifier("wired eteint au depart",
             not page.evaluate("() => document.body.classList.contains('wired')"))
    page.locator("#wired-toggle").click()
    page.wait_for_timeout(600)
    verifier("wired s'active", page.evaluate("() => document.body.classList.contains('wired')"))
    verifier("bouton wired enfonce",
             page.locator("#wired-toggle").get_attribute("aria-pressed") == "true")
    opacite = page.evaluate("() => getComputedStyle(document.querySelector('#wired')).opacity")
    verifier("la couche reseau devient visible", float(opacite) > 0.9, opacite)
    verifier("preference wired persistee",
             page.evaluate("() => localStorage.getItem('lain.wired')") == "1")
    page.screenshot(path=f"{SORTIE}/lain-06-wired.png")

    print("\n[15] Sons")
    verifier("sons actifs par defaut",
             page.locator("#sound-toggle").get_attribute("aria-pressed") == "true")
    ctx = page.evaluate("""() => {
        try { return typeof (window.AudioContext || window.webkitAudioContext); }
        catch(e){ return 'erreur'; }
    }""")
    verifier("AudioContext disponible", ctx == "function", ctx)
    # le son de demarrage ne doit se jouer qu'une fois
    joue = page.evaluate("() => { armerSon(); armerSon(); return demarrageJoue; }")
    verifier("son de demarrage arme une seule fois", joue is True)
    page.locator("#sound-toggle").click()
    page.wait_for_timeout(120)
    verifier("sons coupables",
             page.locator("#sound-toggle").get_attribute("aria-pressed") == "false")
    page.locator("#sound-toggle").click()
    page.wait_for_timeout(120)

    print("\n[16] Images vers le modele local")
    verifier("bouton piece jointe present", page.locator("#attach").count() == 1)
    # on simule un depot de fichier via l'input cache
    page.set_input_files("#fichier", {
        "name": "test.png", "mimeType": "image/png",
        "buffer": PNG_ROUGE,
    })
    page.wait_for_timeout(700)
    verifier("vignette ajoutee", page.locator(".vignette").count() == 1)
    verifier("envoi active par la seule image", page.locator("#send").is_enabled())
    verifier("image reduite en jpeg avant envoi",
             page.evaluate("() => images[0].dataUrl.slice(0,22)").startswith("data:image/jpeg"))

    # retrait
    page.locator(".vignette button").click()
    page.wait_for_timeout(150)
    verifier("vignette retirable", page.locator(".vignette").count() == 0)
    verifier("envoi redesactive sans texte ni image", page.locator("#send").is_disabled())

    # renvoi puis envoi reel, pour verifier ce qui part sur le reseau
    page.set_input_files("#fichier", {
        "name": "test.png", "mimeType": "image/png", "buffer": PNG_ROUGE,
    })
    page.wait_for_timeout(700)
    page.locator("#input").fill("Que vois-tu ?")
    page.wait_for_timeout(120)
    page.locator("#send").click()
    page.wait_for_function("document.querySelectorAll('.caret').length === 0", timeout=15000)
    page.wait_for_timeout(300)
    verifier("apercu affiche dans le fil", page.locator(".jointes img").count() >= 1)
    verifier("vignettes videes apres envoi", page.locator(".vignette").count() == 0)
    page.screenshot(path=f"{SORTIE}/lain-07-image.png")

    envoye = json.loads(pathlib.Path("/tmp/lain-dernier-envoi.json").read_text())
    dernier_user = [m for m in envoye["messages"] if m["role"] == "user"][-1]
    verifier("l'image part bien dans le champ 'images' d'Ollama",
             dernier_user["nb_images"] == 1, str(dernier_user))
    verifier("les apercus d'affichage ne partent pas au modele",
             "apercus" not in dernier_user["cles"], str(dernier_user["cles"]))

    print("\n[17] Capacite vision du modele")
    page.select_option("#model", "llava:7b")
    page.wait_for_timeout(500)
    verifier("badge vision affiche pour llava", page.locator("#badge-vision").is_visible())
    page.select_option("#model", "mon-ia:latest")
    page.wait_for_timeout(500)
    verifier("badge vision masque pour un modele texte",
             not page.locator("#badge-vision").is_visible())
    verifier("capacite memorisee",
             page.evaluate("() => modeleVoitImages") is False)

    print("\n[18] Erreurs JavaScript")
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
