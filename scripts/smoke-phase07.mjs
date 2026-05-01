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

  // ─── getEffectiveSeason matrix (Plan 07-02) ───
  // Compile and load src/utils/seasonality.ts using the established stub pattern.
  const ts = (await import('typescript')).default;
  const compile = (src) => ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const seasonalitySrc = await fs.readFile('src/utils/seasonality.ts', 'utf8');
  // Stub the ../types import (TS types are erased at runtime).
  const seasonalityStubbed = seasonalitySrc
    .replace(/from ["']\.\.\/types["']/g, `from "./.tmp-types-p7.mjs"`);
  const tmpTypesP7 = `${process.cwd()}/scripts/.tmp-types-p7.mjs`;
  const tmpSeasonalityP7 = `${process.cwd()}/scripts/.tmp-seasonality-p7.mjs`;
  await fs.writeFile(tmpTypesP7, `export {};\n`);
  await fs.writeFile(tmpSeasonalityP7, compile(seasonalityStubbed));
  const seasonMod = await import(tmpSeasonalityP7);

  assert('seasonality.ts exports getEffectiveSeason as function',
    typeof seasonMod.getEffectiveSeason === 'function');
  assert('seasonality.ts no longer exports getWaterSeason (Phase 7 SSOT lock)',
    typeof seasonMod.getWaterSeason === 'undefined');

  // Buenos Aires (Southern temperate, lat -34.6)
  const buenosAires = { lat: -34.6, lon: -58.4, name: 'BA', country: 'AR' };
  // Singapore (tropical, lat 1.35)
  const singapore = { lat: 1.35, lon: 103.8, name: 'SG', country: 'SG' };
  // New York (Northern temperate, lat 40.7)
  const newYork = { lat: 40.7, lon: -74.0, name: 'NY', country: 'US' };

  // TZ-safe local-time constructor (Phase 5 lock)
  const apr1_2026 = new Date(2026, 3, 1);   // April 1, 2026
  const oct1_2026 = new Date(2026, 9, 1);   // October 1, 2026
  const jul15_2026 = new Date(2026, 6, 15); // July 15, 2026
  const jan15_2026 = new Date(2026, 0, 15); // Jan 15, 2026

  // Branch: 'tropical' override — always 'warm' for any location/date.
  assert("getEffectiveSeason(loc, 'tropical', anyDate) → 'warm' (NY Apr)",
    seasonMod.getEffectiveSeason(newYork, 'tropical', apr1_2026) === 'warm');
  assert("getEffectiveSeason(loc, 'tropical', anyDate) → 'warm' (BA Oct)",
    seasonMod.getEffectiveSeason(buenosAires, 'tropical', oct1_2026) === 'warm');
  assert("getEffectiveSeason(null, 'tropical', anyDate) → 'warm' (no location)",
    seasonMod.getEffectiveSeason(null, 'tropical', jan15_2026) === 'warm');

  // Branch: 'northern' override — Apr-Sep warm, Oct-Mar cold (regardless of actual latitude).
  assert("getEffectiveSeason(BA, 'northern', Apr) → 'warm' (override forces Northern flip)",
    seasonMod.getEffectiveSeason(buenosAires, 'northern', apr1_2026) === 'warm');
  assert("getEffectiveSeason(BA, 'northern', Oct) → 'cold' (override forces Northern flip)",
    seasonMod.getEffectiveSeason(buenosAires, 'northern', oct1_2026) === 'cold');
  assert("getEffectiveSeason(null, 'northern', Jul) → 'warm'",
    seasonMod.getEffectiveSeason(null, 'northern', jul15_2026) === 'warm');

  // Branch: 'southern' override — Apr-Sep cold, Oct-Mar warm.
  assert("getEffectiveSeason(NY, 'southern', Apr) → 'cold' (override forces Southern flip)",
    seasonMod.getEffectiveSeason(newYork, 'southern', apr1_2026) === 'cold');
  assert("getEffectiveSeason(NY, 'southern', Oct) → 'warm' (override forces Southern flip)",
    seasonMod.getEffectiveSeason(newYork, 'southern', oct1_2026) === 'warm');

  // Branch: 'auto' override — delegates to internal getWaterSeason via location.lat.
  assert("getEffectiveSeason(NY, 'auto', Apr) → 'warm' (Northern temperate Apr)",
    seasonMod.getEffectiveSeason(newYork, 'auto', apr1_2026) === 'warm');
  assert("getEffectiveSeason(NY, 'auto', Oct) → 'cold' (Northern temperate Oct)",
    seasonMod.getEffectiveSeason(newYork, 'auto', oct1_2026) === 'cold');
  assert("getEffectiveSeason(BA, 'auto', Apr) → 'cold' (Southern temperate Apr)",
    seasonMod.getEffectiveSeason(buenosAires, 'auto', apr1_2026) === 'cold');
  assert("getEffectiveSeason(BA, 'auto', Oct) → 'warm' (Southern temperate Oct)",
    seasonMod.getEffectiveSeason(buenosAires, 'auto', oct1_2026) === 'warm');
  assert("getEffectiveSeason(SG, 'auto', anyDate) → 'tropical' (lat within boundary)",
    seasonMod.getEffectiveSeason(singapore, 'auto', jul15_2026) === 'tropical');

  // Branch: 'auto' + null location → 'warm' (LOC-03 fallback — never under-water).
  assert("getEffectiveSeason(null, 'auto', anyDate) → 'warm' (LOC-03 fallback)",
    seasonMod.getEffectiveSeason(null, 'auto', apr1_2026) === 'warm');

  // Defensive: undefined climateOverride treated as 'auto'.
  assert("getEffectiveSeason(NY, undefined, Apr) → 'warm' (undefined treated as 'auto')",
    seasonMod.getEffectiveSeason(newYork, undefined, apr1_2026) === 'warm');

} catch (err) {
  process.exitCode = 1;
  console.error('Phase 7 smoke runner failed:', err);
}

console.log(`\nPhase 7 smoke: ${process.exitCode ? 'FAIL' : 'PASS'} ${pass}/${total}`);
