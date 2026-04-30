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

const fs = await import('node:fs/promises');

const tmp = `${process.cwd()}/scripts/.tmp-migration.mjs`;
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

  console.log(`\n${pass}/${total} PASS`);
} catch (err) {
  console.error('SMOKE RUNNER ERROR:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
} finally {
  await fs.unlink(tmp).catch(() => {});
}

process.exit(process.exitCode || 0);
