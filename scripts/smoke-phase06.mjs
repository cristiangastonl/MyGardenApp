// COMPILE PATH IS LOCKED to typescript.transpileModule. If this script breaks, fix the source — do NOT add a fallback compile path.
//
// Phase 6 — Read-side propagation smoke runner.
//
// Wave 0 (this plan, 06-01): scaffold + assert helper exports exist.
// Wave 1 (Plan 06-02): extend with i18n key presence + getLightLabel behavior + getSeasonalInterval matrix.
// Wave 2 (Plans 06-03..05): no further smoke extensions — component swaps verified by tsc + manual UAT.
// Wave 3 (Plan 06-06): TodayScreen soilCheckSilentPlants computation — re-uses Plan 06-02's getNextWaterDate stub harness.
//
// Single compile path policy: typescript.transpileModule ONLY.
// Do NOT add esbuild/swc/loader fallbacks — fallbacks hide real source-level bugs.

const fs = await import('node:fs/promises');

const tmpLightLabel = `${process.cwd()}/scripts/.tmp-lightLabel.mjs`;
const tmpMigration  = `${process.cwd()}/scripts/.tmp-migration-p6.mjs`;
const tmpPlantLogic = `${process.cwd()}/scripts/.tmp-plantLogic-p6.mjs`;
const tmpTypes      = `${process.cwd()}/scripts/.tmp-types-p6.mjs`;
const tmpSeason     = `${process.cwd()}/scripts/.tmp-seasonality-p6.mjs`;
const tmpDates      = `${process.cwd()}/scripts/.tmp-dates-p6.mjs`;
const tmpI18n       = `${process.cwd()}/scripts/.tmp-i18n-p6.mjs`;

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
  const ts = (await import('typescript')).default;
  const compile = (src) => ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  // ──────────────────────────────────────────────────────────────────────
  // Stubs for cross-module deps (mirrors Phase 5 smoke runner pattern).
  // ──────────────────────────────────────────────────────────────────────
  // Types: empty (TS types erased at runtime).
  await fs.writeFile(tmpTypes, `export {};\n`);

  // ──────────────────────────────────────────────────────────────────────
  // Compile and load src/utils/migration.ts (real impl — sunHoursToLightLevel)
  // ──────────────────────────────────────────────────────────────────────
  const migrationSrc = await fs.readFile('src/utils/migration.ts', 'utf8');
  const migrationStubbed = migrationSrc
    .replace(/from ["']\.\.\/types["']/g, `from "./.tmp-types-p6.mjs"`);
  await fs.writeFile(tmpMigration, compile(migrationStubbed));
  const migrationMod = await import(tmpMigration);
  assert('migration.ts exports sunHoursToLightLevel as function',
    typeof migrationMod.sunHoursToLightLevel === 'function');

  // ──────────────────────────────────────────────────────────────────────
  // Compile and load src/utils/lightLabel.ts (the new helper under test).
  // Stub the relative './migration' import to point at our compiled tmp.
  // ──────────────────────────────────────────────────────────────────────
  const lightLabelSrc = await fs.readFile('src/utils/lightLabel.ts', 'utf8');
  const lightLabelStubbed = lightLabelSrc
    .replace(/from ["']\.\.\/types["']/g, `from "./.tmp-types-p6.mjs"`)
    .replace(/from ["']\.\/migration["']/g, `from "./.tmp-migration-p6.mjs"`);
  await fs.writeFile(tmpLightLabel, compile(lightLabelStubbed));
  const lightLabelMod = await import(tmpLightLabel);

  // Wave 0 assertions: exports exist and are functions/sets.
  assert('lightLabel.ts exports getLightLabel as function',
    typeof lightLabelMod.getLightLabel === 'function');
  assert('lightLabel.ts exports OUTDOOR_TYPE_IDS',
    lightLabelMod.OUTDOOR_TYPE_IDS instanceof Set);
  assert('OUTDOOR_TYPE_IDS contains exactly 4 entries',
    lightLabelMod.OUTDOOR_TYPE_IDS.size === 4);
  assert("OUTDOOR_TYPE_IDS includes 'exterior'",
    lightLabelMod.OUTDOOR_TYPE_IDS.has('exterior'));
  assert("OUTDOOR_TYPE_IDS includes 'aromaticas'",
    lightLabelMod.OUTDOOR_TYPE_IDS.has('aromaticas'));
  assert("OUTDOOR_TYPE_IDS includes 'huerta'",
    lightLabelMod.OUTDOOR_TYPE_IDS.has('huerta'));
  assert("OUTDOOR_TYPE_IDS includes 'frutales'",
    lightLabelMod.OUTDOOR_TYPE_IDS.has('frutales'));
  assert("OUTDOOR_TYPE_IDS does NOT include 'suculentas' (succulents are indoor)",
    !lightLabelMod.OUTDOOR_TYPE_IDS.has('suculentas'));
  assert("OUTDOOR_TYPE_IDS does NOT include 'interior'",
    !lightLabelMod.OUTDOOR_TYPE_IDS.has('interior'));

  // ──────────────────────────────────────────────────────────────────────
  // Compile and load src/utils/plantLogic.ts to verify getSeasonalInterval export.
  // Reuse the Phase 5 stub pattern — i18n + types + seasonality + dates as deps.
  // ──────────────────────────────────────────────────────────────────────
  // i18n stub: pass-through translator.
  await fs.writeFile(tmpI18n,
    `export default { t: (key, opts) => opts?.name ? key + ":" + opts.name : key };\n`);
  // dates stub: real impls (parseDate, addDays, isSameDay) — minimal subset getNextWaterDate uses.
  await fs.writeFile(tmpDates,
    `export const parseDate=(s)=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
     export const addDays=(d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
     export const isSameDay=(a,b)=>a.toDateString()===b.toDateString();
     export const formatDate=(d)=>\`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
     export const daysBetween=(a,b)=>{const aa=new Date(a.getFullYear(),a.getMonth(),a.getDate());const bb=new Date(b.getFullYear(),b.getMonth(),b.getDate());return Math.round((bb.getTime()-aa.getTime())/86400000);};\n`);
  // seasonality stub: real impl (re-compiled from src).
  const seasonalitySrc = await fs.readFile('src/utils/seasonality.ts', 'utf8');
  await fs.writeFile(tmpSeason, compile(seasonalitySrc));

  const plantLogicSrc = await fs.readFile('src/utils/plantLogic.ts', 'utf8');
  const plantLogicStubbed = plantLogicSrc
    .replace(/from ["']\.\.\/types["']/g, `from "./.tmp-types-p6.mjs"`)
    .replace(/from ["']\.\.\/i18n["']/g, `from "./.tmp-i18n-p6.mjs"`)
    .replace(/from ["']\.\/seasonality["']/g, `from "./.tmp-seasonality-p6.mjs"`)
    .replace(/from ["']\.\/dates["']/g, `from "./.tmp-dates-p6.mjs"`);
  await fs.writeFile(tmpPlantLogic, compile(plantLogicStubbed));
  const plantLogicMod = await import(tmpPlantLogic);

  assert('plantLogic.ts exports getSeasonalInterval as function (Plan 06-01 export)',
    typeof plantLogicMod.getSeasonalInterval === 'function');
  assert('plantLogic.ts still exports getNextWaterDate (regression-safe)',
    typeof plantLogicMod.getNextWaterDate === 'function');
  assert('plantLogic.ts still exports getTasksForDay (regression-safe)',
    typeof plantLogicMod.getTasksForDay === 'function');

  // Quick smoke of getSeasonalInterval — full matrix lands in Plan 06-02.
  assert("getSeasonalInterval({warm:5,cold:10}, 'warm') === 5",
    plantLogicMod.getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'warm') === 5);
  assert("getSeasonalInterval({warm:5,cold:10}, 'cold') === 10",
    plantLogicMod.getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'cold') === 10);
  assert("getSeasonalInterval({warm:5,cold:10}, 'tropical') === 5 (tropical→warm bucket)",
    plantLogicMod.getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'tropical') === 5);

  console.log('\nWave 0 placeholder section reached, no further assertions yet (Plan 06-02 extends).');

} catch (err) {
  console.error('SMOKE RUNNER ERROR:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
} finally {
  await fs.unlink(tmpLightLabel).catch(() => {});
  await fs.unlink(tmpMigration).catch(() => {});
  await fs.unlink(tmpPlantLogic).catch(() => {});
  await fs.unlink(tmpTypes).catch(() => {});
  await fs.unlink(tmpSeason).catch(() => {});
  await fs.unlink(tmpDates).catch(() => {});
  await fs.unlink(tmpI18n).catch(() => {});
}

console.log(`\n${pass}/${total} PASS`);
if (pass === total && process.exitCode !== 1) console.log('Phase 6 smoke: PASS');
