# Undead Nightfall — Agent Collaboration Guide

## Agents
- **Claude Code** — architecture review, regression analysis, large-file understanding, gameplay/system planning, identifying root causes
- **Codex** — targeted implementation, debugging, small patches, terminal-driven fixes, syntax correction

## Platform Assessment
Before beginning any task, briefly assess whether Codex or Claude is better suited using the criteria above. If the other platform is better suited, say so before editing.

---

## Project Structure
- `index.html` — all CSS (inline `<style>` blocks with named `id` attributes) + HTML shell
- `scripts/script-01.js` through `script-49.js` — numbered modules loaded in order
- `scripts/manifest.txt` — index of scripts (number | name/tag | description)
- `assets/` — audio (mp3) and image (png) files

## Conventions
- New scripts append to the numbered sequence (next: `script-50.js`)
- Each `<style>` block in `index.html` has a descriptive `id` attribute — follow this pattern
- Script manifest (`scripts/manifest.txt`) must be updated when a new script is added
- Do not rename or reorder existing scripts — other scripts may depend on load order
- Supabase URL is set in `script-06.js` via `window.SUPABASE_URL`

---

## Workflow Rules

### General
- Work through requested changes one step at a time, in the exact order given
- Analyse the best approach before implementation when a task has multiple options or gameplay tradeoffs
- Do not make code, asset, or config changes without explicit approval
- When approval is needed, clearly write `APPROVAL REQUIRED:` so it is easy to notice
- Touch only files necessary for the approved step
- Prefer PowerShell commands in this workspace
- Use `rg` / `rg --files` for searching when available
- Use `apply_patch` for manual text edits
- Do not install external tools or packages unless explicitly approved
- Preserve existing gameplay unless the approved step requires changing it
- After JavaScript changes, run syntax checks with `node --check` over the scripts
- Keep final summaries concise and include what was verified

### No Silent Editing
Before making changes, explicitly state:
> "I am about to modify: [files]"

After changes, explicitly state:
> "I modified: [files]"

If no files were changed, explicitly say so.

### Git Awareness
- Before edits: run `git status`
- After edits: run `git status` and summarize changed files

### HANDOVER.md
Before starting work:
- Read `HANDOVER.md` if present
- Check git status

After completing work, update `HANDOVER.md` with:
- Files inspected
- Files changed
- Summary of findings
- Tests performed
- Risk level
- Next recommended action

### Key Insights Rule
After investigations or edits, provide a concise "Key Insights" section including:
- What files were searched
- What files were modified
- Important findings
- Current risks
- What was intentionally NOT changed

---

## Multi-AI Safety
- Only one AI should modify files at a time
- The other AI should remain in review, planning, analysis, or testing support mode
- Avoid simultaneous edits to the same files
- Before starting a task: check this file and `scripts/manifest.txt` for current state
- After completing a task: note what changed under ## Change Log
- Conflicts: if a task touches a file another agent recently edited, flag it before proceeding
- Scope: only modify files relevant to the assigned task; do not refactor unrelated code

---

## Change Log
<!-- Agents: prepend entries here after completing work -->
<!-- Format: [Agent] [Date] — description -->
[Claude] [2026-07-09] — Added Vividex studio splash bumper: new `#vividexBumper` overlay (index.html), `scripts/script-50.js` (canvas whip-burst renderer, midpoint-displacement lightning paths, plays existing chain-lightning SFX via `__undeadSpellAudio`), new asset `assets/vividex-splash-v.png`, service-worker.js cache bump. Purely additive — does not touch `#bootLayoutSplash`, `script-31.js`, or any gameplay code. Design/plan: `docs/superpowers/specs/2026-07-09-vividex-splash-bumper-design.md`, `docs/superpowers/plans/2026-07-09-vividex-splash-bumper.md`.
