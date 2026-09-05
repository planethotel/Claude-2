/* =========================================================================
   dessins.js — la planche de l'atelier.
   Chaque article est illustré par un dessin au trait, à la manière d'un
   catalogue de cordonnier. Tout est en SVG : rien à charger, et le trait
   prend la couleur du texte autour de lui.
   Un article qui reçoit une « photo » dans data.js remplace son dessin.
   ========================================================================= */

/* --- gabarit commun aux chaussures (repère 800 × 600) --- */
const TIGE = 'M176,268 C174,244 204,236 238,244 C296,256 332,296 388,316 ' +
             'C476,342 570,352 644,368 C662,372 666,388 652,394 L188,394 ' +
             'C176,394 172,384 174,368 Z';
const SEMELLE = 'M166,394 L660,394 C674,394 676,406 662,410 L216,414 ' +
                'L212,424 L170,424 C158,424 156,408 160,400 Z';
const TALON = 'M170,410 L214,412 L212,438 L172,438 C162,438 160,424 162,416 Z';

const svg = (vb, contenu, epaisseur = 3) => `
<svg viewBox="${vb}" class="trait" role="presentation" focusable="false">
  <g fill="none" stroke="currentColor" stroke-width="${epaisseur}"
     stroke-linecap="round" stroke-linejoin="round">${contenu}</g>
</svg>`;

const chaussure = (dedans = '', shaft = '', vb = '150 200 540 260') => svg(vb, `
    ${shaft}
    <path d="${TIGE}"/>
    <path d="${SEMELLE}"/>
    <path d="${TALON}"/>
    <path d="M168,394 L662,394" stroke-width="2.5" stroke-dasharray="9 9" opacity=".7"/>
    ${dedans}`, 4);

const LACETS = `
    <path d="M228,272 L286,288 M226,292 L288,308 M230,312 L292,326" stroke-width="3.5"/>
    <path d="M222,266 C244,258 268,262 292,274 L296,330 C270,320 244,312 224,316 Z"
          stroke-width="2.5" opacity=".8"/>`;
const BOUT = '<path d="M520,348 C532,366 538,380 540,394" stroke-width="3.5"/>';
const PERFOS = `
    <g stroke-width="0" fill="currentColor" opacity=".85">
      <circle cx="512" cy="352" r="4"/><circle cx="522" cy="364" r="4"/>
      <circle cx="530" cy="376" r="4"/><circle cx="536" cy="388" r="4"/>
      <circle cx="404" cy="322" r="4"/><circle cx="420" cy="328" r="4"/>
      <circle cx="436" cy="333" r="4"/>
    </g>`;
const SHAFT_CHELSEA = `
    <path d="M178,266 C176,232 177,190 179,166 C180,152 190,146 206,146 L272,146
             C288,146 296,154 296,168 C296,206 292,246 288,278" stroke-width="4"/>
    <path d="M244,152 L244,272 M280,158 L280,268" stroke-width="2.5" opacity=".7"/>
    <path d="M250,168 L274,178 M250,190 L274,200 M250,212 L274,222 M250,234 L274,244"
          stroke-width="2" opacity=".55"/>`;
const SHAFT_BOTTINE = `
    <path d="M178,266 C176,236 178,200 180,176 C181,162 191,156 207,156 L266,156
             C282,156 290,164 290,178 C290,214 286,250 282,280" stroke-width="4"/>
    <path d="M206,176 L266,190 M204,206 L268,220 M206,236 L268,250"
          stroke-width="3" opacity=".85"/>`;

/* --- objets (repère 240 × 160) --- */
const objet = (contenu) => svg('0 0 240 160', contenu);

export const DESSINS = {

  /* ---------------- chaussures ---------------- */
  richelieu: chaussure(LACETS + BOUT),
  brogue:    chaussure(LACETS + BOUT + PERFOS),
  derby:     chaussure(`
    <path d="M226,270 L292,286 M224,292 L294,310 M228,314 L296,330" stroke-width="3.5"/>
    <path d="M296,266 C280,300 288,340 300,336" stroke-width="2.5" opacity=".8"/>` + BOUT),
  chelsea:   chaussure(BOUT, SHAFT_CHELSEA, '150 130 540 330'),
  bottine:   chaussure(BOUT, SHAFT_BOTTINE, '150 140 540 320'),
  mocassin:  chaussure(`
    <path d="M232,276 C268,262 306,278 330,300" stroke-width="3.5"/>
    <path d="M262,272 C284,268 302,278 314,290 L300,306 C288,292 274,284 258,286 Z"
          stroke-width="3"/>
    <path d="M282,282 L296,288" stroke-width="2.5"/>`),

  /* escarpin : gabarit propre, talon fin */
  escarpin: svg('150 180 540 300', `
    <path d="M186,262 C184,238 214,232 246,242 C300,258 336,300 392,322
             C478,350 566,362 640,378 C658,382 662,398 648,404
             L214,404 C192,404 182,392 186,368 Z"/>
    <path d="M186,404 L648,404 C660,404 662,414 650,418 L226,422 L214,404"/>
    <path d="M214,418 C210,452 206,486 204,516 L246,516 C246,482 240,448 236,420"/>
    <path d="M196,516 L254,516" stroke-width="5"/>
    <path d="M248,258 C284,272 316,296 348,316" stroke-width="2.5" opacity=".7"/>`, 4),

  /* sac à main, pour la maroquinerie */
  sac: objet(`
    <path d="M46,66 L194,66 L182,144 L58,144 Z"/>
    <path d="M84,66 C84,36 96,24 120,24 C144,24 156,36 156,66" stroke-width="3.5"/>
    <path d="M46,66 L194,66" stroke-width="3.5"/>
    <path d="M112,88 L128,88" stroke-width="4"/>
    <path d="M62,84 L178,84" stroke-width="2" opacity=".5" stroke-dasharray="5 6"/>`),

  /* ---------------- entretien ---------------- */
  creme: objet(`
    <ellipse cx="120" cy="94" rx="54" ry="20"/>
    <path d="M66,94 L66,68 M174,94 L174,68"/>
    <ellipse cx="120" cy="68" rx="54" ry="20"/>
    <ellipse cx="120" cy="68" rx="34" ry="12" opacity=".55"/>
    <path d="M120,56 L120,80" opacity=".4" stroke-width="2"/>`),

  pate: objet(`
    <ellipse cx="120" cy="104" rx="58" ry="19"/>
    <path d="M62,104 L62,86 M178,104 L178,86"/>
    <ellipse cx="120" cy="86" rx="58" ry="19"/>
    <path d="M78,72 C94,58 146,58 162,72" stroke-width="2.5" opacity=".7"/>
    <ellipse cx="120" cy="86" rx="30" ry="9" opacity=".45" stroke-width="2"/>`),

  flacon: objet(`
    <path d="M104,34 L136,34 L136,56 C160,64 168,80 168,98 L168,126
             C168,136 160,142 148,142 L92,142 C80,142 72,136 72,126 L72,98
             C72,80 80,64 104,56 Z"/>
    <path d="M100,28 L140,28" stroke-width="4.5"/>
    <rect x="84" y="88" width="72" height="34" rx="3" opacity=".55" stroke-width="2"/>`),

  vaporisateur: objet(`
    <path d="M88,54 L152,54 C160,54 164,60 164,68 L164,128 C164,138 158,142 148,142
             L92,142 C82,142 76,138 76,128 L76,68 C76,60 80,54 88,54 Z"/>
    <path d="M104,54 L104,34 L136,34 L136,54"/>
    <path d="M136,40 L166,40 L166,28" stroke-width="2.5"/>
    <path d="M176,22 L186,16 M180,32 L192,30 M174,12 L180,4" stroke-width="2" opacity=".6"/>
    <rect x="88" y="82" width="64" height="36" rx="3" opacity=".5" stroke-width="2"/>`),

  savon: objet(`
    <path d="M56,72 C56,60 66,52 80,52 L160,52 C174,52 184,60 184,72 L184,110
             C184,124 174,132 160,132 L80,132 C66,132 56,124 56,110 Z"/>
    <path d="M70,66 C86,60 154,60 170,66" stroke-width="2" opacity=".5"/>
    <path d="M96,84 C104,76 136,76 144,84 C152,92 148,108 120,108 C92,108 88,92 96,84 Z"
          stroke-width="2.5" opacity=".8"/>
    <path d="M60,42 C72,32 86,36 94,30 M164,40 C154,30 142,34 134,28" stroke-width="2" opacity=".5"/>`),

  gomme: objet(`
    <path d="M62,66 L152,44 C162,42 170,48 172,58 L182,100 C184,110 178,118 168,120
             L78,142 C68,144 60,138 58,128 L48,86 C46,76 52,68 62,66 Z"/>
    <path d="M52,92 L176,60" stroke-width="2.5" opacity=".6"/>
    <path d="M120,52 L130,96 M92,60 L102,104" stroke-width="2" opacity=".4"/>`),

  /* ---------------- accessoires ---------------- */
  brosse: objet(`
    <path d="M46,58 C46,48 54,42 66,42 L174,42 C186,42 194,48 194,58 C194,68 186,74 174,74
             L66,74 C54,74 46,68 46,58 Z"/>
    <path d="M58,74 L54,116 M74,74 L71,118 M90,74 L88,120 M106,74 L105,120
             M122,74 L122,120 M138,74 L139,120 M154,74 L156,118 M170,74 L173,116"
          stroke-width="2.5" opacity=".85"/>
    <path d="M60,56 L180,56" stroke-width="2" opacity=".4"/>`),

  brosseNubuck: objet(`
    <path d="M52,52 L188,52 C194,52 198,56 198,62 L198,78 C198,84 194,88 188,88
             L52,88 C46,88 42,84 42,78 L42,62 C42,56 46,52 52,52 Z"/>
    <path d="M52,88 L52,116 C52,124 58,128 66,128 L174,128 C182,128 188,124 188,116 L188,88"
          stroke-width="2.5"/>
    <path d="M70,94 L70,122 M90,94 L90,122 M110,94 L110,122 M130,94 L130,122
             M150,94 L150,122 M170,94 L170,122" stroke-width="2" opacity=".55"/>
    <path d="M52,66 L188,66" stroke-width="2" opacity=".4"/>`),

  palot: objet(`
    <ellipse cx="88" cy="88" rx="42" ry="34"/>
    <path d="M50,74 C64,64 112,64 126,74" stroke-width="2" opacity=".5"/>
    <path d="M56,110 L50,124 M72,116 L68,132 M90,120 L90,136 M108,116 L112,132 M124,110 L130,124"
          stroke-width="2.5" opacity=".85"/>
    <path d="M128,80 L188,66 C196,64 200,70 198,78 C196,86 190,90 182,92 L130,98"
          stroke-width="3"/>`),

  tendeur: objet(`
    <path d="M64,26 L64,110 M148,26 L148,110" stroke-width="4"/>
    <path d="M56,22 L72,22 M140,22 L156,22" stroke-width="5"/>
    <path d="M64,110 C64,124 76,132 106,132 C136,132 148,124 148,110"/>
    <path d="M64,64 l14,-12 l14,24 l14,-24 l14,24 l14,-24 l14,12" stroke-width="2.5" opacity=".8"/>
    <path d="M172,46 C190,46 196,58 196,72 C196,86 190,98 172,98 C162,98 158,86 158,72
             C158,58 162,46 172,46 Z" stroke-width="2.5"/>`),

  decrottoir: objet(`
    <path d="M44,66 C44,54 54,46 68,46 L172,46 C186,46 196,54 196,66 C196,78 186,86 172,86
             L68,86 C54,86 44,78 44,66 Z"/>
    <path d="M56,86 L48,124 M76,86 L70,128 M96,86 L92,130 M116,86 L114,130
             M136,86 L138,130 M156,86 L160,128 M176,86 L184,124" stroke-width="3.5"/>
    <path d="M58,60 L182,60" stroke-width="2" opacity=".4"/>`),

  embauchoir: objet(`
    <path d="M34,104 C26,86 34,64 56,56 C82,46 114,50 132,64 C144,74 148,88 142,100
             C134,114 114,122 88,122 C60,122 42,116 34,104 Z"/>
    <path d="M56,70 C78,62 104,66 122,78" stroke-width="2" opacity=".5"/>
    <path d="M144,90 l9,-13 l9,26 l9,-26 l9,26 l7,-13" stroke-width="2.5"/>
    <path d="M187,66 C208,66 214,78 214,90 C214,102 208,114 187,114
             C178,114 175,104 175,90 C175,76 178,66 187,66 Z"/>`),

  premiere: objet(`
    <path d="M104,18 C130,18 148,32 150,54 C152,74 140,90 136,108 C132,128 124,140 106,140
             C88,140 76,128 74,108 C72,88 80,72 82,54 C84,32 82,18 104,18 Z"/>
    <path d="M82,56 C100,64 124,62 148,54" stroke-width="2" opacity=".5"/>
    <path d="M76,102 C96,108 120,108 138,102" stroke-width="2" opacity=".5"/>
    <path d="M156,40 C176,52 182,80 176,104 C172,120 164,130 156,136" stroke-width="2" opacity=".45"/>`),

  chaussette: objet(`
    <path d="M78,20 L134,20 C140,20 144,24 144,30 L144,84 L188,116
             C198,124 198,136 188,142 C180,146 170,144 162,138 L92,96
             C82,90 78,80 78,68 Z"/>
    <path d="M78,38 L144,38" stroke-width="2.5" opacity=".6"/>
    <path d="M78,50 L144,50" stroke-width="2" opacity=".4"/>
    <path d="M100,100 C112,112 130,126 148,136" stroke-width="2" opacity=".4"/>`)
};
