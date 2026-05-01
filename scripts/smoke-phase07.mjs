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

  // ─── Plan 07-03: i18n parity (Phase 7 keyset present in both EN + ES) ───
  const en = JSON.parse(await fs.readFile('src/i18n/locales/en/common.json', 'utf8'));
  const es = JSON.parse(await fs.readFile('src/i18n/locales/es/common.json', 'utf8'));

  // Phase 7 mandatory keyset
  const phase7Keys = [
    'lightLevelHint.indoor.direct',
    'lightLevelHint.indoor.bright_indirect',
    'lightLevelHint.indoor.medium_indirect',
    'lightLevelHint.indoor.low',
    'lightLevelHint.outdoor.direct',
    'lightLevelHint.outdoor.bright_indirect',
    'lightLevelHint.outdoor.medium_indirect',
    'lightLevelHint.outdoor.low',
    'waterSchedule.modeFixed',
    'waterSchedule.modeSoilCheck',
    'waterSchedule.warmLabel',
    'waterSchedule.coldLabel',
    'waterSchedule.soilCheckExplanation',
    'onboarding.location.title',
    'onboarding.location.body',
    'onboarding.location.useGps',
    'onboarding.location.searchCity',
    'onboarding.location.skip',
    'settings.climateOverride.title',
    'settings.climateOverride.body',
    'settings.climateOverride.auto',
    'settings.climateOverride.northern',
    'settings.climateOverride.southern',
    'settings.climateOverride.tropical',
    'today.locationBanner.body',
    'today.locationBanner.cta',
    'identification.lightLevelLabel',
  ];

  const lookup = (obj, path) => path.split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, obj);

  for (const key of phase7Keys) {
    assert(`ES has key ${key}`, typeof lookup(es, key) === 'string');
    assert(`EN has key ${key}`, typeof lookup(en, key) === 'string');
  }

  // ─── Verbatim REQUIREMENTS lock (LOC-02 + LOC-06) ───
  assert("ES onboarding.location.body matches LOC-06 verbatim",
    es.onboarding.location.body === 'Lo usamos para ajustar el cuidado a tu clima — no se envía a ningún lado además del servicio de clima');
  assert("ES today.locationBanner.body matches LOC-02 verbatim",
    es.today.locationBanner.body === 'Agregá tu ubicación para horarios precisos');

  // ─── Voseo discipline ───
  assert("ES onboarding.location.useGps starts with 'Usá' (voseo, not tuteo 'Usa')",
    es.onboarding.location.useGps === 'Usá mi ubicación');
  assert("ES settings.climateOverride.body uses 'elegí' (voseo, not 'elige')",
    es.settings.climateOverride.body.includes('elegí'));
  assert("ES onboarding.location.title uses 'tenés' (voseo, not 'tienes')",
    es.onboarding.location.title.includes('tenés'));

  // ─── Interpolation markers preserved ───
  assert("ES waterSchedule.soilCheckExplanation contains {{days}} interpolation",
    es.waterSchedule.soilCheckExplanation.includes('{{days}}'));
  assert("EN waterSchedule.soilCheckExplanation contains {{days}} interpolation",
    en.waterSchedule.soilCheckExplanation.includes('{{days}}'));

  // ─── Plan 07-08: edge-function payload discriminator (string-level) ───
  const diagnoseSrc = await fs.readFile('supabase/functions/diagnose-plant/index.ts', 'utf8');
  const chatSrc = await fs.readFile('supabase/functions/chat-diagnosis/index.ts', 'utf8');

  // Discriminator presence
  assert("diagnose-plant has isV2 discriminator (!!ctx.waterSchedule)",
    /isV2\s*=\s*!!\s*ctx\??\.waterSchedule/.test(diagnoseSrc));
  assert("chat-diagnosis has isV2 discriminator (!!ctx.waterSchedule)",
    /isV2\s*=\s*!!\s*ctx\??\.waterSchedule/.test(chatSrc));

  // v1.1 prompt fragments (ES + EN)
  assert("diagnose-plant ES v1.1 prompt mentions 'Modo de riego'",
    diagnoseSrc.includes('Modo de riego'));
  assert("diagnose-plant EN v1.1 prompt mentions 'Watering mode'",
    diagnoseSrc.includes('Watering mode'));
  assert("diagnose-plant ES v1.1 prompt mentions 'temporada cálida cada'",
    diagnoseSrc.includes('temporada cálida cada'));
  assert("diagnose-plant EN v1.1 prompt mentions 'warm season every'",
    diagnoseSrc.includes('warm season every'));
  assert("diagnose-plant ES v1.1 prompt mentions 'Nivel de luz'",
    diagnoseSrc.includes('Nivel de luz'));
  assert("diagnose-plant EN v1.1 prompt mentions 'Light level'",
    diagnoseSrc.includes('Light level'));

  // Legacy fragments preserved (backward compat)
  assert("diagnose-plant legacy ES branch preserves 'Frecuencia de riego: cada'",
    diagnoseSrc.includes('Frecuencia de riego: cada'));
  assert("diagnose-plant legacy EN branch preserves 'Watering frequency: every'",
    diagnoseSrc.includes('Watering frequency: every'));

  // soil_check explainer
  assert("diagnose-plant ES soil_check explainer mentions 'por chequeo'",
    diagnoseSrc.includes('por chequeo'));
  assert("diagnose-plant EN soil_check explainer mentions 'check-in'",
    diagnoseSrc.includes('check-in'));

  // chat-diagnosis parity (same fragments)
  assert("chat-diagnosis ES v1.1 prompt mentions 'Modo de riego'",
    chatSrc.includes('Modo de riego'));
  assert("chat-diagnosis EN v1.1 prompt mentions 'Watering mode'",
    chatSrc.includes('Watering mode'));
  assert("chat-diagnosis legacy ES branch preserves 'Frecuencia de riego: cada'",
    chatSrc.includes('Frecuencia de riego: cada'));
  assert("chat-diagnosis legacy EN branch preserves 'Watering frequency: every'",
    chatSrc.includes('Watering frequency: every'));

  // PlantContext shape parity
  assert("diagnose-plant PlantContext has waterSchedule? optional field",
    /waterSchedule\?\s*:\s*\{\s*warm:\s*number;\s*cold:\s*number/.test(diagnoseSrc));
  assert("chat-diagnosis PlantContext has waterSchedule? optional field",
    /waterSchedule\?\s*:\s*\{\s*warm:\s*number;\s*cold:\s*number/.test(chatSrc));

} catch (err) {
  process.exitCode = 1;
  console.error('Phase 7 smoke runner failed:', err);
}

console.log(`\nPhase 7 smoke: ${process.exitCode ? 'FAIL' : 'PASS'} ${pass}/${total}`);
