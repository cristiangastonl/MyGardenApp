// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the migration source — do NOT add a fallback compile path.
//
// Phase 4 / Wave 0 — Node-only smoke test for src/utils/migration.ts.
//
// At Wave 0 (before src/utils/migration.ts exists), this script will fail
// to find the source and exit non-zero — that is EXPECTED.
//
// Once Wave 1 lands the migration source, this script must:
//   1. Compile src/utils/migration.ts via typescript.transpileModule (single locked path)
//   2. Dynamic-import the compiled output
//   3. Run mapper unit checks (LIGHT-03, WATER-04) and mode-inference checks (W2)
//   4. Run end-to-end migration over tests/fixtures/v0-app-data.json
//   5. Assert idempotency (SCHEMA-03)
//   6. Print "${pass}/${total} PASS" and exit 0 on success, 1 on any FAIL.
//
// Single compile path policy: do NOT add any fallback compile alternative
// (no experimental TypeScript loaders, no swc, no esbuild). If transpileModule
// throws, fix migration.ts — fallbacks hide real problems.

// Phase 5 / Wave 0 — Pure-utility switchover.
//
// At Wave 0 (before src/utils/seasonality.ts exists), the Phase-5 section
// must EMIT a single line "Phase 5: skipped — seasonality.ts not yet
// present" and NOT increment total/pass. Plan 02 lands seasonality.ts;
// Plans 03/04/05 fill in the assertions (season matrix, soil_check task
// emission, overdue-water penalty skip).
//
// Single compile path policy applies: typescript.transpileModule ONLY.
// Do NOT add esbuild/swc/loader fallbacks.

const fs = await import('node:fs/promises');

const tmp = `${process.cwd()}/scripts/.tmp-migration.mjs`;
const tmpSeason = `${process.cwd()}/scripts/.tmp-seasonality.mjs`;
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
  const fixture = JSON.parse(
    await fs.readFile('tests/fixtures/v0-app-data.json', 'utf8')
  );

  const ts = (await import('typescript')).default;
  const tsSource = await fs.readFile('src/utils/migration.ts', 'utf8');
  const compiled = ts.transpileModule(tsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  await fs.writeFile(tmp, compiled);

  const mod = await import(tmp);
  const {
    runMigrations,
    migratePlant_0to1,
    sunHoursToLightLevel,
    applyColdFactor,
    inferWaterMode,
    CURRENT_SCHEMA_VERSION,
  } = mod;

  // -------- Mapper unit checks (LIGHT-03) --------
  assert("sunHoursToLightLevel(5) === 'direct'", sunHoursToLightLevel(5) === 'direct');
  assert("sunHoursToLightLevel(3) === 'bright_indirect'", sunHoursToLightLevel(3) === 'bright_indirect');
  assert("sunHoursToLightLevel(2) === 'medium_indirect'", sunHoursToLightLevel(2) === 'medium_indirect');
  assert("sunHoursToLightLevel(1) === 'low'", sunHoursToLightLevel(1) === 'low');
  assert("sunHoursToLightLevel(4.999) === 'bright_indirect'", sunHoursToLightLevel(4.999) === 'bright_indirect');

  // -------- Mapper unit checks (WATER-04) --------
  assert("applyColdFactor(7, 'suculentas') === 14", applyColdFactor(7, 'suculentas') === 14);
  assert("applyColdFactor(7, 'interior') === 11", applyColdFactor(7, 'interior') === 11);
  assert("applyColdFactor(7, 'exterior') === 12", applyColdFactor(7, 'exterior') === 12);
  assert("applyColdFactor(7, 'huerta') === 9", applyColdFactor(7, 'huerta') === 9);
  assert("applyColdFactor(7, 'frutales') === 11", applyColdFactor(7, 'frutales') === 11);
  assert("applyColdFactor(20, 'suculentas') === 30 (clamp)", applyColdFactor(20, 'suculentas') === 30);
  assert("applyColdFactor(0.4, 'interior') === 1 (clamp lower)", applyColdFactor(0.4, 'interior') === 1);

  // -------- inferWaterMode (W2 — category beats non-allowlisted dbId) --------
  assert("inferWaterMode('suculentas', 'aloe') === 'soil_check' (allowlist)", inferWaterMode('suculentas', 'aloe') === 'soil_check');
  assert("inferWaterMode('interior', 'aloe') === 'soil_check' (allowlist beats category)", inferWaterMode('interior', 'aloe') === 'soil_check');
  assert("inferWaterMode('suculentas', 'monstera') === 'soil_check' (category beats non-allowlisted dbId)", inferWaterMode('suculentas', 'monstera') === 'soil_check');
  assert("inferWaterMode('interior', 'monstera') === 'fixed'", inferWaterMode('interior', 'monstera') === 'fixed');
  assert("inferWaterMode('frutales', 'tomate') === 'fixed'", inferWaterMode('frutales', 'tomate') === 'fixed');

  // -------- Migration shape (SCHEMA-01) --------
  const persisted = { schemaVersion: 0, data: fixture };
  const migrated = runMigrations(persisted);
  assert('migrated.plants.length === 7', migrated.plants.length === 7);
  for (const p of migrated.plants) {
    assert(`plant ${p.id} has lightLevel string`, typeof p.lightLevel === 'string');
    assert(`plant ${p.id} waterSchedule.warm is number`, typeof p.waterSchedule?.warm === 'number');
    assert(`plant ${p.id} waterSchedule.cold is number`, typeof p.waterSchedule?.cold === 'number');
    assert(`plant ${p.id} waterMode in {fixed,soil_check}`, p.waterMode === 'fixed' || p.waterMode === 'soil_check');
    assert(`plant ${p.id} _migratedFromV0 === true`, p._migratedFromV0 === true);
  }

  // -------- Per-plant truths --------
  const byId = Object.fromEntries(migrated.plants.map((p) => [p.id, p]));
  assert("p1 lightLevel === 'direct'", byId.p1.lightLevel === 'direct');
  assert('p1 waterSchedule.warm === 7', byId.p1.waterSchedule.warm === 7);
  assert('p1 waterSchedule.cold === 11', byId.p1.waterSchedule.cold === 11);
  assert("p1 waterMode === 'fixed'", byId.p1.waterMode === 'fixed');
  assert("p3 (aloe) waterMode === 'soil_check'", byId.p3.waterMode === 'soil_check');
  assert("p2 (cactus) waterMode === 'soil_check'", byId.p2.waterMode === 'soil_check');
  assert("p7 (no sunHours) lightLevel === 'bright_indirect'", byId.p7.lightLevel === 'bright_indirect');

  // -------- Idempotency (SCHEMA-03) --------
  const second = runMigrations({ schemaVersion: 1, data: migrated });
  assert('idempotent: second runMigrations is byte-identical', JSON.stringify(second) === JSON.stringify(migrated));

  // -------- Defensive per-plant guard --------
  const guarded = migratePlant_0to1(migrated.plants[0]);
  assert('migratePlant_0to1 on already-migrated plant is identity', JSON.stringify(guarded) === JSON.stringify(migrated.plants[0]));

  // -------- Schema version constant --------
  assert('CURRENT_SCHEMA_VERSION === 1', CURRENT_SCHEMA_VERSION === 1);

  // ======================================================================
  // PHASE 5 — seasonality + soil_check + overdue-penalty skip
  // ======================================================================

  let seasonalityMod = null;
  try {
    const seasonSrc = await fs.readFile('src/utils/seasonality.ts', 'utf8');
    const seasonCompiled = ts.transpileModule(seasonSrc, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    await fs.writeFile(tmpSeason, seasonCompiled);
    seasonalityMod = await import(tmpSeason);
  } catch (e) {
    // ENOENT is expected at Wave 0 / Plan 01 — Plan 02 lands the file.
    if (e && e.code !== 'ENOENT') throw e;
  }

  if (!seasonalityMod) {
    console.log('Phase 5: skipped — seasonality.ts not yet present');
  } else {
    const { getWaterSeason, TROPICAL_LAT_BOUNDARY } = seasonalityMod;

    // Local-time Date constructor (year, monthIdx, day) is used throughout this
    // section instead of ISO strings — `new Date('2026-04-01')` parses as UTC
    // midnight, which getMonth() then re-interprets in the runner's local TZ
    // (e.g. America/Buenos_Aires UTC-3 turns Apr 1 UTC into Mar 31 local). The
    // multi-arg form is unambiguous local time and TZ-independent.

    // -------- SEASON-01: enum return shape --------
    assert("getWaterSeason returns string", typeof getWaterSeason(40, new Date(2026, 3, 1)) === 'string');
    assert("TROPICAL_LAT_BOUNDARY === 23.5", TROPICAL_LAT_BOUNDARY === 23.5);

    // -------- SEASON-02: tropical inclusive boundary --------
    assert("Singapore (1.35) Jan === 'tropical'", getWaterSeason(1.35, new Date(2026, 0, 15)) === 'tropical');
    assert("Singapore (1.35) Jul === 'tropical'", getWaterSeason(1.35, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary +23.5 Jul === 'tropical' (inclusive)", getWaterSeason(23.5, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary -23.5 Jul === 'tropical' (inclusive)", getWaterSeason(-23.5, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary +23.51 Jul === 'warm' (just outside, Northern)", getWaterSeason(23.51, new Date(2026, 6, 15)) === 'warm');

    // -------- SEASON-03: month-boundary hard flip (off-by-one safeguard) --------
    assert("NY (40) Apr 1 === 'warm' (Northern first warm day)", getWaterSeason(40, new Date(2026, 3, 1)) === 'warm');
    assert("NY (40) Mar 31 === 'cold' (Northern last cold day)", getWaterSeason(40, new Date(2026, 2, 31)) === 'cold');
    assert("NY (40) Sep 30 === 'warm' (Northern last warm day)", getWaterSeason(40, new Date(2026, 8, 30)) === 'warm');
    assert("NY (40) Oct 1 === 'cold' (Northern first cold day)", getWaterSeason(40, new Date(2026, 9, 1)) === 'cold');
    assert("BA (-34.6) Apr 1 === 'cold' (Southern inverted)", getWaterSeason(-34.6, new Date(2026, 3, 1)) === 'cold');
    assert("BA (-34.6) Oct 1 === 'warm' (Southern inverted)", getWaterSeason(-34.6, new Date(2026, 9, 1)) === 'warm');
    assert("BA (-34.6) Jan 15 === 'warm' (Southern summer)", getWaterSeason(-34.6, new Date(2026, 0, 15)) === 'warm');
    assert("BA (-34.6) Jul 15 === 'cold' (Southern winter)", getWaterSeason(-34.6, new Date(2026, 6, 15)) === 'cold');

    // -------- Defensive fallbacks --------
    assert("null lat === 'warm' (LOC-03 safe default)", getWaterSeason(null, new Date(2026, 0, 15)) === 'warm');
    assert("NaN lat === 'warm' (defensive)", getWaterSeason(NaN, new Date(2026, 0, 15)) === 'warm');

    // -------- i18n key parity (EN + ES voseo) --------
    // Voseo regex uses /i flag because the body sentence starts with capital 'Tocá';
    // a strict /tocá/ would miss the sentence-leading capitalized form.
    const en = JSON.parse(await fs.readFile('src/i18n/locales/en/common.json', 'utf8'));
    const es = JSON.parse(await fs.readFile('src/i18n/locales/es/common.json', 'utf8'));
    assert("en.tasks.checkSoil exists", typeof en.tasks?.checkSoil === 'string' && en.tasks.checkSoil.length > 0);
    assert("en.tasks.checkSoilBody exists", typeof en.tasks?.checkSoilBody === 'string' && en.tasks.checkSoilBody.length > 0);
    assert("es.tasks.checkSoil exists", typeof es.tasks?.checkSoil === 'string' && es.tasks.checkSoil.length > 0);
    assert("es.tasks.checkSoilBody exists", typeof es.tasks?.checkSoilBody === 'string' && es.tasks.checkSoilBody.length > 0);
    assert("es.tasks.checkSoilBody uses voseo (tocá+regá)", /tocá/i.test(es.tasks.checkSoilBody) && /regá/i.test(es.tasks.checkSoilBody));
    assert("es.tasks.checkSoilBody NOT tuteo (no standalone toca/riega)", !/\btoca\b/.test(es.tasks.checkSoilBody) && !/\briega\b/.test(es.tasks.checkSoilBody));
  }

  console.log(`\n${pass}/${total} PASS`);
} catch (err) {
  console.error('SMOKE RUNNER ERROR:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
} finally {
  await fs.unlink(tmp).catch(() => {});
  await fs.unlink(tmpSeason).catch(() => {});
}

process.exit(process.exitCode || 0);
