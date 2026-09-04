/* =========================================================================
   dessins.js — planche de l'atelier.
   Chaque article de la boutique est illustré par un dessin au trait,
   à la manière d'un catalogue de cordonnier. Tout est en SVG, rien à charger.
   ========================================================================= */

/* --- gabarit commun à toutes les chaussures (repère 800 × 600) --- */
const TIGE = 'M176,268 C174,244 204,236 238,244 C296,256 332,296 388,316 ' +
             'C476,342 570,352 644,368 C662,372 666,388 652,394 L188,394 ' +
             'C176,394 172,384 174,368 Z';
const SEMELLE = 'M166,394 L660,394 C674,394 676,406 662,410 L216,414 ' +
                'L212,424 L170,424 C158,424 156,408 160,400 Z';
const TALON = 'M170,410 L214,412 L212,438 L172,438 C162,438 160,424 162,416 Z';

const chaussure = (dedans = '', shaft = '', vb = '150 200 540 260') => `
<svg viewBox="${vb}" class="trait" role="presentation" focusable="false">
  <g fill="none" stroke="currentColor" stroke-width="4"
     stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
    ${shaft}
    <path d="${TIGE}"/>
    <path d="${SEMELLE}"/>
    <path d="${TALON}"/>
    <path d="M168,394 L662,394" stroke-width="2.5" stroke-dasharray="9 9" opacity=".75"/>
    ${dedans}
  </g>
</svg>`;

const LACETS_OXFORD = `
    <path d="M228,272 L286,288 M226,292 L288,308 M230,312 L292,326" stroke-width="3.5"/>
    <path d="M222,266 C244,258 268,262 292,274 L296,330 C270,320 244,312 224,316 Z"
          stroke-width="2.5" opacity=".8"/>`;
const BOUT_DROIT = `
    <path d="M520,348 C532,366 538,380 540,394" stroke-width="3.5"/>`;
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

/* --- accessoires (repère 240 × 160) --- */
const objet = (contenu) => `
<svg viewBox="0 0 240 160" class="trait" role="presentation" focusable="false">
  <g fill="none" stroke="currentColor" stroke-width="3"
     stroke-linecap="round" stroke-linejoin="round">${contenu}</g>
</svg>`;

export const DESSINS = {
  /* ---- chaussures ---- */
  richelieu: chaussure(LACETS_OXFORD + BOUT_DROIT),
  brogue:    chaussure(LACETS_OXFORD + BOUT_DROIT + PERFOS),
  derby:     chaussure(`
    <path d="M226,270 L292,286 M224,292 L294,310 M228,314 L296,330" stroke-width="3.5"/>
    <path d="M296,266 C280,300 288,340 300,336" stroke-width="2.5" opacity=".8"/>` + BOUT_DROIT),
  chelsea:   chaussure(BOUT_DROIT, SHAFT_CHELSEA, '150 130 540 330'),
  bottine:   chaussure(BOUT_DROIT, SHAFT_BOTTINE, '150 140 540 320'),
  mocassin:  chaussure(`
    <path d="M232,276 C268,262 306,278 330,300" stroke-width="3.5"/>
    <path d="M262,272 C284,268 302,278 314,290 L300,306 C288,292 274,284 258,286 Z"
          stroke-width="3"/>
    <path d="M282,282 L296,288" stroke-width="2.5"/>`),

  /* ---- entretien ---- */
  creme: objet(`
    <ellipse cx="120" cy="92" rx="54" ry="20"/>
    <path d="M66,92 L66,66 M174,92 L174,66"/>
    <ellipse cx="120" cy="66" rx="54" ry="20"/>
    <ellipse cx="120" cy="66" rx="36" ry="13" opacity=".6"/>
    <path d="M120,53 L120,79" opacity=".45" stroke-width="2"/>`),
  cirage: objet(`
    <ellipse cx="120" cy="98" rx="50" ry="18"/>
    <path d="M70,98 L70,76 M170,98 L170,76"/>
    <ellipse cx="120" cy="76" rx="50" ry="18"/>
    <path d="M84,64 C96,52 144,52 156,64" stroke-width="2.5" opacity=".7"/>
    <ellipse cx="120" cy="76" rx="26" ry="9" opacity=".5" stroke-width="2"/>`),
  brosse: objet(`
    <path d="M46,58 C46,48 54,42 66,42 L174,42 C186,42 194,48 194,58 C194,68 186,74 174,74
             L66,74 C54,74 46,68 46,58 Z"/>
    <path d="M58,74 L54,116 M74,74 L71,118 M90,74 L88,120 M106,74 L105,120
             M122,74 L122,120 M138,74 L139,120 M154,74 L156,118 M170,74 L173,116"
          stroke-width="2.5" opacity=".8"/>
    <path d="M60,56 L180,56" stroke-width="2" opacity=".45"/>`),
  embauchoir: objet(`
    <path d="M34,104 C26,86 34,64 56,56 C82,46 114,50 132,64 C144,74 148,88 142,100
             C134,114 114,122 88,122 C60,122 42,116 34,104 Z"/>
    <path d="M56,70 C78,62 104,66 122,78" stroke-width="2" opacity=".55"/>
    <path d="M144,90 l9,-13 l9,26 l9,-26 l9,26 l7,-13" stroke-width="2.5"/>
    <path d="M187,66 C208,66 214,78 214,90 C214,102 208,114 187,114
             C178,114 175,104 175,90 C175,76 178,66 187,66 Z"/>
  `),
  flacon: objet(`
    <path d="M104,32 L136,32 L136,54 C160,62 168,78 168,96 L168,126
             C168,136 160,142 148,142 L92,142 C80,142 72,136 72,126 L72,96
             C72,78 80,62 104,54 Z"/>
    <path d="M100,26 L140,26" stroke-width="4"/>
    <rect x="84" y="86" width="72" height="34" rx="3" opacity=".6" stroke-width="2"/>`),
  vaporisateur: objet(`
    <path d="M88,52 L152,52 C160,52 164,58 164,66 L164,128 C164,138 158,142 148,142
             L92,142 C82,142 76,138 76,128 L76,66 C76,58 80,52 88,52 Z"/>
    <path d="M104,52 L104,32 L136,32 L136,52"/>
    <path d="M136,38 L166,38 L166,26" stroke-width="2.5"/>
    <rect x="88" y="80" width="64" height="36" rx="3" opacity=".55" stroke-width="2"/>`),
  lacets: objet(`
    <ellipse cx="118" cy="82" rx="52" ry="34" transform="rotate(-12 118 82)"/>
    <ellipse cx="118" cy="82" rx="38" ry="22" transform="rotate(-12 118 82)" opacity=".6"/>
    <path d="M150,108 C166,120 178,126 192,128" stroke-width="3"/>
    <path d="M142,116 C154,130 168,138 184,140" stroke-width="3"/>
    <path d="M188,126 L196,130 M180,138 L188,142" stroke-width="5" opacity=".9"/>`),
  semelleConfort: objet(`
    <path d="M96,20 C122,20 140,34 142,56 C144,76 132,92 128,110 C124,130 116,142 98,142
             C80,142 68,130 66,110 C64,90 72,74 74,56 C76,34 74,20 96,20 Z"/>
    <path d="M74,58 C92,66 116,64 140,56" stroke-width="2" opacity=".55"/>
    <path d="M68,104 C88,110 112,110 130,104" stroke-width="2" opacity=".55"/>`)
};
