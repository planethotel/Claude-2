"""Faux Ollama sur 11434, avec un CORS strict imitant le vrai.

Le vrai Ollama n'autorise QUE les origines localhost et renvoie l'origine exacte,
jamais '*'. On reproduit ce comportement pour que le test soit representatif :
si la page servie sur :8765 n'arrive pas a parler a :11434 ici, elle n'y
arrivera pas non plus chez l'utilisateur.
"""
import json, time, http.server, socketserver, sys
from urllib.parse import urlparse

DERNIER_ENVOI = "/tmp/lain-dernier-envoi.json"

ORIGINES_OK = ("http://127.0.0.1", "http://localhost", "https://127.0.0.1", "https://localhost")

REPONSE = """Une **closure** est une fonction qui garde l'acces aux variables de sa portee de definition.

Voici un exemple :

```js
function compteur() {
  let n = 0;
  return () => ++n;
}
const suivant = compteur();
suivant(); // 1
```

Les points cles :

- La variable `n` survit a la fin de `compteur()`
- Chaque appel cree une portee independante
- C'est la base des modules et du state en JS

Tu veux que je detaille un cas precis ?"""


class H(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def _origine_autorisee(self):
        o = self.headers.get("Origin")
        if not o:
            return None
        p = urlparse(o)
        base = f"{p.scheme}://{p.hostname}"
        return o if base in ORIGINES_OK else None

    def _cors(self):
        o = self._origine_autorisee()
        if o:
            self.send_header("Access-Control-Allow-Origin", o)

    def do_OPTIONS(self):
        o = self._origine_autorisee()
        if not o:
            self.send_response(403)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", o)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/version":
            corps = json.dumps({"version": "0.5.0"}).encode()
        elif self.path == "/api/tags":
            corps = json.dumps({"models": [
                {"name": "mon-ia:latest"},
                {"name": "dolphin3:8b"},
                {"name": "qwen2.5:3b"},
                {"name": "llava:7b"},
            ]}).encode()
        else:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def do_POST(self):
        if self.path == "/api/show":
            brut = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            nom = json.loads(brut or b"{}").get("model", "")
            # llava/vision -> capacite vision, comme le vrai Ollama
            caps = ["completion"] + (["vision"] if "llava" in nom or "vl" in nom else [])
            corps = json.dumps({"capabilities": caps,
                                "details": {"families": ["llama"]}}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.send_header("Content-Length", str(len(corps)))
            self.end_headers()
            self.wfile.write(corps)
            return

        if self.path != "/api/chat":
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        brut = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        # On note ce que la page a reellement envoye, pour que le test puisse
        # verifier que les images partent bien dans le champ attendu.
        try:
            envoi = json.loads(brut or b"{}")
            with open(DERNIER_ENVOI, "w", encoding="utf-8") as f:
                json.dump({
                    "model": envoi.get("model"),
                    "messages": [
                        {"role": m.get("role"),
                         "content": m.get("content"),
                         "nb_images": len(m.get("images") or []),
                         "cles": sorted(m.keys())}
                        for m in envoi.get("messages", [])
                    ],
                }, f)
        except Exception:
            pass
        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self._cors()
        self.send_header("Transfer-Encoding", "chunked")
        self.end_headers()

        def morceau(data: bytes):
            self.wfile.write(f"{len(data):X}\r\n".encode() + data + b"\r\n")
            self.wfile.flush()

        try:
            for mot in REPONSE.split(" "):
                morceau((json.dumps({"message": {"role": "assistant", "content": mot + " "},
                                     "done": False}) + "\n").encode())
                time.sleep(0.004)
            morceau((json.dumps({"message": {"content": ""}, "done": True}) + "\n").encode())
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass


class Statique(http.server.SimpleHTTPRequestHandler):
    """Sert le dossier lain/ sur un AUTRE port, comme le fait LAIN.ps1."""
    def __init__(self, *a, **k):
        super().__init__(*a, directory="/home/user/Claude-2/lain", **k)

    def log_message(self, *a):
        pass


class Serveur(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    quoi = sys.argv[1]
    if quoi == "api":
        with Serveur(("127.0.0.1", 11434), H) as s:
            print("mock ollama 11434", flush=True); s.serve_forever()
    else:
        with Serveur(("127.0.0.1", 8765), Statique) as s:
            print("statique 8765", flush=True); s.serve_forever()
