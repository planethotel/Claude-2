# Upstream provenance

This skill is a vendored copy of **UI UX Pro Max**.

| | |
|---|---|
| Source | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| Homepage | https://uupm.cc |
| Version | 2.13.0 |
| Vendored from commit | `58c220ff9d02be80523b06c03471925c52e8ab5d` (2026-09-02) |
| License | MIT — see `LICENSE` in this directory |

## What was copied

Everything under the upstream repository's `.claude/skills/ui-ux-pro-max/`:
`SKILL.md`, `data/` (12 domain CSVs + 22 stack CSVs + catalog JSON),
`references/` (`quick-reference.md`, `pro-rules.md`), and `scripts/`
(`search.py`, `core.py`, `design_system.py`, `reasoning_contract.py`,
`validate_data.py`, plus the stdlib-only regression tests).

## Local modifications

1. **Script paths in `SKILL.md`.** Upstream ships this directory as a Claude Code
   *plugin*, so every command was written as
   `python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py"`.
   Installed as a *project* skill, `CLAUDE_PLUGIN_ROOT` is not set, so the 11
   command examples now use the repository-relative path
   `python .claude/skills/ui-ux-pro-max/scripts/search.py`.
2. **Removed three upstream-only tests** — `test_catalog_refresh.py`,
   `test_catalog_summary_line_endings.py`, and `test_relevance_evaluator.py`,
   plus their `scripts/tests/fixtures/`. They exercise catalog-refresh and
   relevance-scoring tooling that lives at the upstream repository root and is
   not part of the skill, so they cannot import outside that repo.
3. **Added** this file and the upstream `LICENSE`.

No data file, search logic, or reasoning rule was altered.

## Updating

Re-copy `.claude/skills/ui-ux-pro-max/` from a newer upstream tag, then re-apply
the two modifications above and re-run the checks:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/validate_data.py
cd .claude/skills/ui-ux-pro-max && python3 -m unittest discover -s scripts/tests -p 'test_*.py'
```

Upstream also bundles six companion skills (`banner-design`, `brand`, `design`,
`design-system`, `slides`, `ui-styling`) that were **not** vendored here; install
the full plugin from the marketplace if you want them:

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```
