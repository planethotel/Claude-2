# Claude-2

## Skills

### `ui-ux-pro-max` — UI/UX design intelligence

A searchable, offline design-knowledge base installed at
`.claude/skills/ui-ux-pro-max/`. Claude Code picks it up automatically for any
UI/UX work in this repository: designing or reviewing pages and components,
choosing color/typography/spacing systems, accessibility, interaction and
motion, responsive layout, charts, and stack-specific implementation.

**Contents:** 79 searchable styles (50 active), 192 product palettes and
reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP
presets, 25 chart types, and 22 technology stacks (React, Next.js, Vue, Nuxt,
Svelte, Astro, Angular, Laravel, Tailwind, shadcn/ui, SwiftUI, Jetpack Compose,
React Native, Flutter, Three.js, JavaFX, WPF, WinUI, Avalonia, Uno, UWP).

**Requirements:** Python 3.x only — the scripts use the standard library, make no
network calls, and install nothing.

#### Using it directly

Run from the repository root:

```bash
# Generate a full design system for a project
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "hotel booking platform" \
  --design-system -p "Planet Hotel"

# Search one domain: ux, style, color, typography, product, landing, chart, icons, gsap, motion
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "keyboard focus modal" --domain ux

# Search stack-specific guidelines
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "server components" --stack nextjs
```

Add `--persist --output-dir .` to a `--design-system` run to write
`design-system/<project-slug>/MASTER.md` plus a `pages/` directory for
page-specific overrides.

`.claude/skills/ui-ux-pro-max/SKILL.md` documents the full query contract and
every flag.

#### Verifying the skill

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/validate_data.py
cd .claude/skills/ui-ux-pro-max && python3 -m unittest discover -s scripts/tests -p 'test_*.py'
```

#### Provenance

Vendored from [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
v2.13.0 (MIT). See `.claude/skills/ui-ux-pro-max/UPSTREAM.md` for the exact
commit and the local modifications.
