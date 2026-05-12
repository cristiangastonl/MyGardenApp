# Phase 24: Documentation - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Update `CLAUDE.md` and `PROJECT.md` (or `.planning/PROJECT.md`) to accurately reflect v1.2 architecture decisions so future Claude sessions start with correct context. No runtime behavior change. Pure documentation infrastructure phase.

**Out of scope:** README rewrites for end-users; marketing copy; CHANGELOG.md authoring; API reference docs; tutorial documents; screenshot updates; renaming directories or files; behavioral or schema changes.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All implementation choices are at Claude's discretion — pure infrastructure phase.

**DOCS-01 — CLAUDE.md updates** (per REQUIREMENTS.md line 125):
- Edge function deploy commands for `get-plant-care` (mirroring the existing `identify-plant`/`diagnose-plant`/`chat-diagnosis`/`waitlist` patterns documented under "Supabase Edge Functions" — `get-plant-care` already appears in the file at line 38; confirm deploy + post-deploy verify command coverage)
- v1.2 architecture decisions:
  - Perenual API key moved server-side (Phase 10 SEC-01 — already documented in CLAUDE.md §Security; verify the pre-submit grep guard documented at line 213-217 is current)
  - Unknown-plant tracker (Phase 12) — brief mention in Architecture or Services section
  - Journal photo storage strategy (Phase 21 — `documentDirectory` + per-plant subdirectory + orphan cleanup on plant delete; modern `Paths` API)
- Pre-submit checks updated for new CI guards:
  - `npm run lint:voseo` (Phase 23 POLISH-06)
  - `node scripts/smoke-phase{18..23}.cjs` chain (full cross-phase regression discipline)
  - The pre-submit section currently lists `npm run check:i18n-keys` + `npm run check:images` — extend to include voseo-lint + smoke runners

**DOCS-02 — PROJECT.md Key Decisions table** (per REQUIREMENTS.md line 126):
- Recommendation-first pivot (entire v1.2 milestone direction — Phase 13+ pivot away from chat-first plant identification)
- Deep-merge guard for `updatePlant` (CRIT-1 — Phase 14; extended to `fertilizeSchedule` in Phase 20 Plan 01, lock against catalog overwriting user customizations)
- Derived-only streaks / no streak counters (Phase 22 GAM-05 anti-pattern lock — Blossom cautionary tale; STRICT smoke negative-grep enforcement)
- Journal photos in FileSystem (Phase 21 JOURNAL-02 — modern `Paths.document.uri` API, NOT base64 in AsyncStorage)
- Two-AppContent-paths discipline extended to BottomSheetProvider (Phase 13 INFRA-04 — provider hierarchy preserves both auth-on and auth-off paths)
- Plus any v1.2 decisions worth surfacing: ModalSectionId extension precedent (Phase 19 mascotas + Phase 21 diario; Phase 20 deliberately did NOT extend via orthogonal initialExpanded); three-tier smoke runner discipline with STRICT cross-phase regression sentinels (Phase 19+); per-phase Option B device-test deferral to v1.2 backlog memory (5 consecutive precedents)

### Validation surface

- `scripts/smoke-phase24.cjs` is OPTIONAL (planner's discretion — minimal scaffold or skip if Phase 24 ships zero source-code surface; if shipped, STRICT cross-phase regression for Phase 18-23 preserved)
- File-content sentinels: CLAUDE.md contains specific updated sections; PROJECT.md table contains specific row literals
- No `tsc` change expected (no source code edits)
- No `npm run check:i18n-keys` change expected (no i18n surface)
- No `npm run lint:voseo` change expected (no ES JSON edits in scope)
- Cross-phase Phase 18-23 smoke runners must remain green at phase close

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `CLAUDE.md` already has well-organized sections: About / Commands / Architecture (Stack / Feature Flags / Data Flow / Provider Hierarchy / Key Patterns / Services Layer / Supabase Configuration) / Design System / Internationalization / App Store & Privacy / Android Build / iOS Build / Pre-submit Checks / Landing Page / Security. Phase 24 EXTENDS these sections; does not rewrite structure.
- `.planning/PROJECT.md` (verify location) — Key Decisions table extension target.
- Three-tier smoke runner pattern is documented implicitly by the smoke-phase{18..23}.cjs scripts themselves.

### Established Patterns

- Atomic commit per task (GSD baseline)
- Documentation phases close at code level only — manual review of doc accuracy is implicit; no device-test gate
- Phase 18-23 STRICT cross-phase regression discipline is the precedent — Phase 24 preserves it

### Integration Points

- `CLAUDE.md`: extend Pre-submit Checks section + Security section (already touches Perenual) + Supabase Edge Functions enumeration + Architecture §Key Patterns (journal photo storage)
- `.planning/PROJECT.md` (or `PROJECT.md` at repo root — planner confirms): Key Decisions table

</code_context>

<specifics>
## Specific Ideas

- **CLAUDE.md is the AUTHORITATIVE handoff document** for future Claude sessions — accuracy of architecture/conventions/commands here is the primary value of Phase 24.
- **Pre-submit Checks section** is the operational checklist for ship — extending it to include `npm run lint:voseo` + the smoke-runner chain ensures future ships honor v1.2 quality discipline.
- **Avoid bloat:** Phase 24 updates are surgical additions, not full rewrites. The principle is "future Claude session has correct context", not "comprehensive technical writing".

</specifics>

<deferred>
## Deferred Ideas

- End-user README rewrite — out of scope
- CHANGELOG.md authoring — out of scope (would be a release-management task, not v1.2 closing doc)
- Marketing copy / store listing updates (already in `store-listing.md`) — out of scope unless explicitly flagged
- API reference docs — out of scope
- Screenshot regeneration — out of scope
- Renaming directories or files — out of scope; doc-only changes

</deferred>

---

*Phase: 24-documentation*
*Context: pure infrastructure phase — autonomous workflow skipped grey-area discussion per infrastructure-detection rules*
*Gathered: 2026-05-12 (autonomous mode, minimal context)*
