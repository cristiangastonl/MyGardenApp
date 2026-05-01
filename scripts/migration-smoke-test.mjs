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
const tmpPlantLogic = `${process.cwd()}/scripts/.tmp-plantLogic.mjs`;
const tmpPlantHealth = `${process.cwd()}/scripts/.tmp-plantHealth.mjs`;
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
    // Phase 7 (Plan 07-02): getWaterSeason is now module-private (SSOT lock).
    // All assertions now go through the public getEffectiveSeason API.
    // getEffectiveSeason(location, 'auto', date) delegates to getWaterSeason internally,
    // preserving all Phase 5 SEASON-01..03 behavior contracts.
    const { getEffectiveSeason, TROPICAL_LAT_BOUNDARY } = seasonalityMod;
    // Helper to call with latitude-derived location object (auto mode = same as old getWaterSeason).
    const ws = (lat, date) => getEffectiveSeason(lat !== null && Number.isFinite(lat) ? { lat, lon: 0, name: '', country: '' } : null, 'auto', date);

    // Local-time Date constructor (year, monthIdx, day) is used throughout this
    // section instead of ISO strings — `new Date('2026-04-01')` parses as UTC
    // midnight, which getMonth() then re-interprets in the runner's local TZ
    // (e.g. America/Buenos_Aires UTC-3 turns Apr 1 UTC into Mar 31 local). The
    // multi-arg form is unambiguous local time and TZ-independent.

    // -------- SEASON-01: enum return shape --------
    assert("getEffectiveSeason('auto') returns string", typeof ws(40, new Date(2026, 3, 1)) === 'string');
    assert("TROPICAL_LAT_BOUNDARY === 23.5", TROPICAL_LAT_BOUNDARY === 23.5);

    // -------- SEASON-02: tropical inclusive boundary --------
    assert("Singapore (1.35) Jan === 'tropical'", ws(1.35, new Date(2026, 0, 15)) === 'tropical');
    assert("Singapore (1.35) Jul === 'tropical'", ws(1.35, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary +23.5 Jul === 'tropical' (inclusive)", ws(23.5, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary -23.5 Jul === 'tropical' (inclusive)", ws(-23.5, new Date(2026, 6, 15)) === 'tropical');
    assert("Boundary +23.51 Jul === 'warm' (just outside, Northern)", ws(23.51, new Date(2026, 6, 15)) === 'warm');

    // -------- SEASON-03: month-boundary hard flip (off-by-one safeguard) --------
    assert("NY (40) Apr 1 === 'warm' (Northern first warm day)", ws(40, new Date(2026, 3, 1)) === 'warm');
    assert("NY (40) Mar 31 === 'cold' (Northern last cold day)", ws(40, new Date(2026, 2, 31)) === 'cold');
    assert("NY (40) Sep 30 === 'warm' (Northern last warm day)", ws(40, new Date(2026, 8, 30)) === 'warm');
    assert("NY (40) Oct 1 === 'cold' (Northern first cold day)", ws(40, new Date(2026, 9, 1)) === 'cold');
    assert("BA (-34.6) Apr 1 === 'cold' (Southern inverted)", ws(-34.6, new Date(2026, 3, 1)) === 'cold');
    assert("BA (-34.6) Oct 1 === 'warm' (Southern inverted)", ws(-34.6, new Date(2026, 9, 1)) === 'warm');
    assert("BA (-34.6) Jan 15 === 'warm' (Southern summer)", ws(-34.6, new Date(2026, 0, 15)) === 'warm');
    assert("BA (-34.6) Jul 15 === 'cold' (Southern winter)", ws(-34.6, new Date(2026, 6, 15)) === 'cold');

    // -------- Defensive fallbacks --------
    assert("null lat === 'warm' (LOC-03 safe default)", ws(null, new Date(2026, 0, 15)) === 'warm');
    assert("NaN lat === 'warm' (defensive)", ws(NaN, new Date(2026, 0, 15)) === 'warm');

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

    // -------- Compile plantLogic.ts (depends on seasonality.ts + i18n + types) --------
    // The plantLogic source imports from "../i18n" which is a relative path
    // resolved at runtime; in Node smoke we stub it to a no-op translator.
    const plantLogicSrc = await fs.readFile('src/utils/plantLogic.ts', 'utf8');
    const stubbed = plantLogicSrc
      .replace(/from ["']\.\.\/types["']/g, 'from "./.tmp-types.mjs"')
      .replace(/from ["']\.\.\/i18n["']/g, 'from "./.tmp-i18n.mjs"')
      .replace(/from ["']\.\/seasonality["']/g, 'from "./.tmp-seasonality.mjs"')
      .replace(/from ["']\.\/dates["']/g, 'from "./.tmp-dates.mjs"');
    // Compile and stub deps
    const stubbedCompiled = ts.transpileModule(stubbed, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    await fs.writeFile(tmpPlantLogic, stubbedCompiled);
    // Stub i18n: pass through key with optional name interpolation.
    await fs.writeFile(`${process.cwd()}/scripts/.tmp-i18n.mjs`,
      `export default { t: (key, opts) => opts?.name ? key + ":" + opts.name : key };\n`);
    // Stub types: empty module — TS types are erased at runtime.
    await fs.writeFile(`${process.cwd()}/scripts/.tmp-types.mjs`, `export {};\n`);
    // Stub dates: real impls (parseDate, addDays, isSameDay, formatDate, daysBetween).
    // daysBetween + formatDate are added so plantHealth (Plan 04) imports succeed
    // when this module is loaded later — Node ES module caches imports, so the
    // exports must exist on first load (cannot be appended later mid-test).
    await fs.writeFile(`${process.cwd()}/scripts/.tmp-dates.mjs`,
      `export const parseDate=(s)=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
       export const addDays=(d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
       export const isSameDay=(a,b)=>a.toDateString()===b.toDateString();
       export const formatDate=(d)=>\`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
       export const daysBetween=(a,b)=>{const aa=new Date(a.getFullYear(),a.getMonth(),a.getDate());const bb=new Date(b.getFullYear(),b.getMonth(),b.getDate());return Math.round((bb.getTime()-aa.getTime())/86400000);};\n`);

    const plantLogicMod = await import(tmpPlantLogic);
    const { getNextWaterDate, getTasksForDay } = plantLogicMod;

    // Phase 7 (Plan 07-02): getNextWaterDate and getTasksForDay now take season: WaterSeason
    // instead of latitude. Pre-compute season using the ws() helper defined above.
    const seasonBA_Apr = ws(-34.6, new Date(2026, 3, 15));   // 'cold'
    const seasonNY_Apr = ws(40, new Date(2026, 3, 15));       // 'warm'
    const seasonSG_Apr = ws(1.35, new Date(2026, 3, 15));     // 'tropical'
    const seasonBA_Apr1 = ws(-34.6, new Date(2026, 3, 1));    // 'cold'
    const seasonNull_Apr = ws(null, new Date(2026, 3, 15));   // 'warm' (LOC-03)

    // -------- SEASON-04: getNextWaterDate season-awareness --------
    const fixedPlantBA = {
      id: 'pBA', name: 'BA Fixed', waterMode: 'fixed',
      waterSchedule: { warm: 5, cold: 10 },
      lastWatered: '2026-04-01', sunDays: [], outdoorDays: [],
    };
    const apr15 = new Date(2026, 3, 15); // Apr 15, 2026
    // BA (-34.6) Apr 15: Southern → cold, 10d. lastWatered Apr 1 + 10 = Apr 11 → advance to Apr 21.
    const baNext = getNextWaterDate(fixedPlantBA, apr15, seasonBA_Apr);
    assert("BA fixed plant Apr 15 advances to cold-bucket interval (Apr 21)",
      baNext.getDate() === 21 && baNext.getMonth() === 3);

    // NY (40) Apr 15: Northern → warm, 5d. lastWatered Apr 1 + 5 = Apr 6 → advance to Apr 16.
    const nyNext = getNextWaterDate(fixedPlantBA, apr15, seasonNY_Apr);
    assert("NY fixed plant Apr 15 uses warm-bucket interval (Apr 16)",
      nyNext.getDate() === 16 && nyNext.getMonth() === 3);

    // Tropical: Singapore (1.35) → must NOT yield NaN/undefined; uses warm bucket (5d).
    const sgNext = getNextWaterDate(fixedPlantBA, apr15, seasonSG_Apr);
    assert("Singapore tropical Apr 15 uses warm bucket (no undefined/NaN)",
      !isNaN(sgNext.getTime()) && sgNext.getDate() === 16);

    // -------- ROADMAP success criterion #4: cross-month transition produces no >1-cycle jump --------
    // Southern plant lastWatered Mar 25 (warm season was active). On Apr 1 Southern flips to cold (10d).
    // Verify next-water-date is bounded: not in the past, not >1 full cold cycle ahead.
    const transitionPlantBA = {
      id: 'pBAtr', name: 'BA Transition', waterMode: 'fixed',
      waterSchedule: { warm: 5, cold: 10 },
      lastWatered: '2026-03-25', sunDays: [], outdoorDays: [],
    };
    const apr1 = new Date(2026, 3, 1); // Apr 1, 2026 — Southern flips warm→cold
    const transitionNext = getNextWaterDate(transitionPlantBA, apr1, seasonBA_Apr1);
    const apr1Ms = apr1.getTime();
    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    assert("Cross-month transition (Mar 25 → Apr 1 Southern flip) returns valid Date (no NaN)",
      !isNaN(transitionNext.getTime()));
    assert("Cross-month next-water-date is not in the past relative to today",
      transitionNext.getTime() >= apr1Ms);
    assert("Cross-month next-water-date is no more than 1 cold-cycle (10d) ahead of today",
      transitionNext.getTime() <= apr1Ms + tenDaysMs);

    // Defensive fallback: legacy waterEvery only.
    const legacyPlant = {
      id: 'pL', name: 'Legacy', waterMode: 'fixed',
      waterEvery: 7, waterSchedule: undefined,
      lastWatered: '2026-04-01', sunDays: [], outdoorDays: [],
    };
    const legacyNext = getNextWaterDate(legacyPlant, apr15, seasonNY_Apr);
    assert("Legacy waterEvery fallback (7d) Apr 1 → Apr 8 → advance to Apr 15",
      !isNaN(legacyNext.getTime()) && legacyNext.getDate() === 15);

    // null lat → 'warm' default → 5d.
    const nullLatNext = getNextWaterDate(fixedPlantBA, apr15, seasonNull_Apr);
    assert("null latitude uses warm safe-default (Apr 16)",
      nullLatNext.getDate() === 16);

    // -------- WATER-05: soil_check dispatch --------
    // Plant whose check-in day is today (lastWatered exactly cold-interval ago).
    const soilCheckBA = {
      id: 'pSC', name: 'Cactus', waterMode: 'soil_check',
      waterSchedule: { warm: 14, cold: 28 },
      lastWatered: '2026-03-18', // 28d before Apr 15 — Southern Apr is cold, 28d → check-in TODAY
      sunDays: [], outdoorDays: [],
    };
    const baTasks = getTasksForDay([soilCheckBA], apr15, seasonBA_Apr);
    assert("soil_check plant on check-in day emits exactly 1 task",
      baTasks.length === 1);
    assert("soil_check task type === 'check_soil' (NOT 'water')",
      baTasks[0]?.type === 'check_soil');
    assert("soil_check task icon === '🤚'",
      baTasks[0]?.icon === '🤚');
    assert("soil_check task label uses tasks.checkSoil i18n key (stubbed pass-through)",
      baTasks[0]?.label?.startsWith('tasks.checkSoil'));

    // Non-check-in day: same plant, day before next check-in.
    const apr14 = new Date(2026, 3, 14);
    const baTasksNonCheckIn = getTasksForDay([soilCheckBA], apr14, seasonBA_Apr);
    assert("soil_check plant on non-check-in day emits 0 tasks",
      baTasksNonCheckIn.length === 0);

    // First-encounter (lastWatered === null) for soil_check: emits day-1 (Pitfall 5 recommendation).
    const newSoilCheck = { ...soilCheckBA, id: 'pNew', lastWatered: null };
    const newTasks = getTasksForDay([newSoilCheck], apr15, seasonBA_Apr);
    assert("New soil_check plant (lastWatered null) emits 'check_soil' on day 1",
      newTasks.length === 1 && newTasks[0]?.type === 'check_soil');

    // Fixed-mode plant on its check-in day: emits 'water', NOT 'check_soil'.
    const fixedTasks = getTasksForDay([{ ...fixedPlantBA, lastWatered: '2026-04-05' }], new Date(2026,3,15), seasonBA_Apr);
    // BA Apr 15 cold 10d, lastWatered Apr 5 → next is Apr 15 = today (check-in)
    assert("fixed plant on check-in day emits 'water' (NOT 'check_soil')",
      fixedTasks.length === 1 && fixedTasks[0]?.type === 'water');

    // -------- WATER-06: plantHealth overdue-water penalty skip for soil_check --------
    // Note: .tmp-dates.mjs was already written above with daysBetween +
    // formatDate exports; no need to rewrite (Node ES caches anyway).
    //
    // Subtle: the production getNextWaterDate uses an advance-loop
    // (`while (next < today) next = addDays(next, intervalDays)`) which
    // ALWAYS returns a date >= today, making `daysUntilWater < 0` unreachable
    // through the real plantLogic. To exercise the WATER-06 gate (the
    // ENTIRE point of Plan 04), we stub plantLogic with a no-advance
    // getNextWaterDate that returns `lastWatered` verbatim — this makes
    // `daysUntilWater = today - lastWatered` produce a NEGATIVE value
    // (overdue), which is the precondition for the penalty branch. The
    // gate `plant.waterMode !== 'soil_check'` is then meaningfully
    // exercised: soil_check skips, fixed/undefined apply.
    const tmpPlantLogicOverdue = `${process.cwd()}/scripts/.tmp-plantLogic-overdue.mjs`;
    await fs.writeFile(tmpPlantLogicOverdue,
      `export const getNextWaterDate=(plant)=>{const[y,m,d]=(plant.lastWatered||'2026-01-01').split('-').map(Number);return new Date(y,m-1,d);};\n`);

    const plantHealthSrc = await fs.readFile('src/utils/plantHealth.ts', 'utf8');
    const phStubbed = plantHealthSrc
      .replace(/from ["']\.\.\/types["']/g, 'from "./.tmp-types.mjs"')
      .replace(/from ["']\.\/plantLogic["']/g, 'from "./.tmp-plantLogic-overdue.mjs"')
      .replace(/from ["']\.\/dates["']/g, 'from "./.tmp-dates.mjs"');
    const phCompiled = ts.transpileModule(phStubbed, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    await fs.writeFile(tmpPlantHealth, phCompiled);
    const plantHealthMod = await import(tmpPlantHealth);
    const { calculatePlantHealth } = plantHealthMod;

    // Heavily-overdue soil_check plant — must NOT incur overdue_water penalty.
    // With the no-advance stub: nextWaterDate === Feb 1, today === Apr 15,
    // daysBetween(Apr15, Feb1) === -73 → triggers the penalty branch (which
    // WATER-06 must skip for soil_check).
    const today = new Date(2026, 3, 15); // Apr 15, 2026
    const overdueSoilCheck = {
      id: 'pSCO', name: 'Cactus Overdue', waterMode: 'soil_check',
      waterSchedule: { warm: 14, cold: 28 },
      lastWatered: '2026-02-01', // 73 days ago
      sunDays: [], outdoorDays: [],
    };
    const phSoilCheck = calculatePlantHealth(overdueSoilCheck, today, null, undefined, -34.6);
    assert("WATER-06: soil_check overdue does NOT push overdue_water issue",
      !phSoilCheck.issues.some(i => i.type === 'overdue_water'));
    assert("WATER-06: soil_check overdue score === 100 (no water penalty applied)",
      phSoilCheck.score === 100);

    // Same plant but waterMode === 'fixed' — MUST incur the penalty (regression-safe).
    const overdueFixed = { ...overdueSoilCheck, id: 'pFO', waterMode: 'fixed' };
    const phFixed = calculatePlantHealth(overdueFixed, today, null, undefined, -34.6);
    assert("Regression: fixed-mode overdue STILL pushes overdue_water issue",
      phFixed.issues.some(i => i.type === 'overdue_water'));
    assert("Regression: fixed-mode overdue score < 100",
      phFixed.score < 100);

    // Defensive: waterMode === undefined (legacy/migration-failure) — penalty STILL applies.
    const overdueLegacy = { ...overdueSoilCheck, id: 'pLO', waterMode: undefined, waterEvery: 7 };
    const phLegacy = calculatePlantHealth(overdueLegacy, today, null, undefined, -34.6);
    assert("Defensive: undefined waterMode STILL pushes overdue_water (preserves pre-Phase-5 behavior)",
      phLegacy.issues.some(i => i.type === 'overdue_water'));
  }

  console.log(`\n${pass}/${total} PASS`);
} catch (err) {
  console.error('SMOKE RUNNER ERROR:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
} finally {
  await fs.unlink(tmp).catch(() => {});
  await fs.unlink(tmpSeason).catch(() => {});
  await fs.unlink(tmpPlantLogic).catch(() => {});
  await fs.unlink(tmpPlantHealth).catch(() => {});
  await fs.unlink(`${process.cwd()}/scripts/.tmp-plantLogic-overdue.mjs`).catch(() => {});
  await fs.unlink(`${process.cwd()}/scripts/.tmp-i18n.mjs`).catch(() => {});
  await fs.unlink(`${process.cwd()}/scripts/.tmp-types.mjs`).catch(() => {});
  await fs.unlink(`${process.cwd()}/scripts/.tmp-dates.mjs`).catch(() => {});
}

process.exit(process.exitCode || 0);
