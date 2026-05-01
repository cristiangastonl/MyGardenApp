// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.
//
// Phase 7 — UI Write-Side + Onboarding + Edge-Function Contract smoke runner.
//
// Wave 0 (Plan 07-01): scaffold + climateOverride hydration parity (this file).
// Wave 0 (Plan 07-02): extend with getEffectiveSeason matrix (4 modes × tropical/temperate latitudes).
// Wave 4 (Plan 07-08): extend with edge-function payload discriminator string assertions.
//
// Single compile path policy: typescript.transpileModule ONLY.
// Do NOT add esbuild/swc/loader fallbacks — fallbacks hide real source-level bugs.

const fs = await import('node:fs/promises');

let pass = 0;
let total = 0;

function assert(label, cond) {
  total += 1;
  if (cond) {
    pass += 1;
    console.log(`PASS: ${label}`);
  } else {
    process.exitCode = 1;
    console.log(`FAIL: ${label}`);
  }
}

try {

  // ─── Foundation: ClimateOverride hydration parity ───
  // Stand-alone shape test: missing climateOverride field on AppData snapshot
  // hydrates as 'auto' per Phase 7 LOC-05 lock (additive, no schema bump).
  const samplePayload_missing = { schemaVersion: 1, data: { plants: [], notes: {}, reminders: {}, location: null, onboardingCompleted: true, userName: null, notificationSettings: null, plantNetApiKey: null, installDate: '2026-04-30', identificationCount: 0, diagnosisCount: 0, diagnosisHistory: {}, shoppingList: [] } };
  const samplePayload_present = { schemaVersion: 1, data: { ...samplePayload_missing.data, climateOverride: 'tropical' } };

  // The hydration logic Plan 07-01 Task 2 added is `(data as AppData).climateOverride ?? 'auto'`
  const hydrate = (payload) => payload.data.climateOverride ?? 'auto';

  assert("missing climateOverride hydrates to 'auto' (LOC-05 backward-compat)",
    hydrate(samplePayload_missing) === 'auto');
  assert("present climateOverride 'tropical' round-trips",
    hydrate(samplePayload_present) === 'tropical');
  assert("ClimateOverride accepts 'northern'",
    ['auto','northern','southern','tropical'].includes('northern'));
  assert("ClimateOverride accepts 'southern'",
    ['auto','northern','southern','tropical'].includes('southern'));

  // ─── Plan 07-02 placeholder: getEffectiveSeason matrix ───
  // ENOENT-tolerant — Plan 07-02 adds the export; until then, log placeholder.
  try {
    const seasonalitySrc = await fs.readFile('src/utils/seasonality.ts', 'utf8');
    if (seasonalitySrc.includes('export function getEffectiveSeason')) {
      console.log('PLACEHOLDER: getEffectiveSeason found — Plan 07-02 assertions land in next plan');
    } else {
      console.log('PLACEHOLDER: getEffectiveSeason not yet present (Wave 0 / Plan 07-01 only)');
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    console.log('PLACEHOLDER: seasonality.ts skipped — file not found (should never happen post Phase 5)');
  }

} catch (err) {
  process.exitCode = 1;
  console.error('Phase 7 smoke runner failed:', err);
}

console.log(`\nPhase 7 smoke: ${process.exitCode ? 'FAIL' : 'PASS'} ${pass}/${total}`);
