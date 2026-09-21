# Est-ce que je te plais ? — questionnaire

Un petit questionnaire ludique en une page, à envoyer à quelqu'un pour lui
demander ce qu'elle pense de vous. HTML / CSS / JavaScript natifs.
**Aucune dépendance, aucun build, aucun framework.**

---

## Contenu

```
index.html   La page complète (structure, style et logique)
```

## Comment ça marche

Le questionnaire compte 9 questions qui s'enchaînent sur un seul écran :

1. **Est-ce que je te plais ?** — si "Non", le questionnaire s'arrête sur une
   réponse assumée ; si "Oui", il continue.
2. **Type de relation voulu** — 7 choix, chacun déclenche une réplique différente.
3. **Ce qu'elle aime** — choix multiples, avec une réponse qui reprend sa liste.
4–7. **Notes sur 10** (prestation, soirée en boîte, attirance, chance de sortir
   ensemble) via des curseurs.
8. **L'homme idéal** — question ouverte, suivie d'une réplique.
9. **A-t-elle aimé le questionnaire ?**

L'écran final récapitule toutes les réponses et propose :
- un bouton qui ouvre un e-mail pré-rempli avec toutes les réponses ;
- un bouton pour copier les réponses dans le presse-papiers, en secours.

## Mettre en ligne

Le site est entièrement statique et se déploie automatiquement sur
**GitHub Pages** via `.github/workflows/deploy-pages.yml` à chaque push.
Il peut aussi être ouvert directement en local, ou déposé tel quel sur
n'importe quel hébergeur statique (Netlify, Vercel, OVH…).

Aucune configuration serveur n'est nécessaire, et aucun compte n'est requis
pour consulter la page une fois publiée.
