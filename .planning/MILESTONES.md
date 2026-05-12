# Milestones

## v1.2 Recommendation-First Plant Guide (Shipped: 2026-05-12)

**Phases completed:** 16 phases (10-24 including 14.1), 83 plans

**Key accomplishments:**
- Locked Perenual API key server-side via new `get-plant-care` Supabase edge function (rotation pending before public ship); hardened parsing + `isGoodMatch` validator + inferred humidity/tempMax
- Built 6-section educational `MyPlantDetailModal` (¿Qué hacer? / ¿Dónde ponerla? / ¿Por qué? / Tus ajustes + Mascotas + Diario) with collapsible sections, override-detection note, identification picker pre-select, and `PROTECTED_USER_FIELDS` deep-merge guard
- Expanded catalog from 64 to 118 plants across 3 waves (Interior Tropicals 23, Suculentas/Cactus/Trepadoras 17 + 2 EDU upgrades, Exterior/Aromáticas/Frutales 14); identification routing fix (exact-match-first) closed the Dracaena genus collision
- PlantCard redesign: 5-element layout, swipe-to-delete + long-press menu via `Gesture.Pan/LongPress/Race`, always-visible mood emoji (🌱/😊/😐/😟) replacing conditional health badge
- ASPCA-verified `petToxicity` on all 118 entries with cat/dog badges, 5th Mascotas modal section, pet-safe catalog filter, and onboarding switch — LATAM species honestly flagged `'unknown'`
- Fertilization subsystem: `'fertilize'` task type with 5-site discriminator sweep, season-aware cadence (cold-season null = no emission), opt-in push notifications, and full EN/ES fertilizer-type content (industrial + homemade) across all 118 entries
- Plant Journal: per-plant `JournalEntry[]` with file-system photo storage (1080px @ 0.7 JPEG, never base64), bottom-sheet quick-add, reverse-chronological timeline, and orphan cleanup on plant delete
- Gamification done right: celebration toasts + `NotificationFeedbackType.Success` haptics on task completion, with STRICT smoke-runner negative-grep enforcing GAM-05 anti-pattern lock (no persistent streak counters anywhere)
- UAT polish + brand voice: outdoor task gate, outdoor picker labels, `textSecondary` WCAG AA contrast (#8a7e6b → #6f6450), voseo lint over ES locale, illustrated empty states across 3 screens
- Three-tier smoke runner discipline with STRICT cross-phase regression sentinels from Phase 19+ onward; Option B end-of-milestone device-test deferral pattern (5 consecutive precedents) kept code velocity high without skipping verification

---

## v1.1 Precision Care (Shipped: 2026-05-02)

**Phases completed:** 6 phases, 39 plans, 10 tasks

**Key accomplishments:**
- (none recorded)

---

## v1.0 Diagnosis & Tracking (Shipped: 2026-03-19)

**Phases completed:** 3 phases, 7 plans, 2 tasks

**Key accomplishments:**
- (none recorded)

---

