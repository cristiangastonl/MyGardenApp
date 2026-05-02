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

  // ──────────────────────────────────────────────────────────────────────
  // Wave 1 (Plan 06-02): i18n key parity + behavior matrix.
  // ──────────────────────────────────────────────────────────────────────
  console.log('\n--- Wave 1: i18n parity + behavior matrix ---');

  const en = JSON.parse(await fs.readFile('src/i18n/locales/en/common.json', 'utf8'));
  const es = JSON.parse(await fs.readFile('src/i18n/locales/es/common.json', 'utf8'));
  const get = (obj, path) => path.split('.').reduce((a, k) => a?.[k], obj);

  const newKeyPaths = [
    'lightLevel.indoor.direct',
    'lightLevel.indoor.bright_indirect',
    'lightLevel.indoor.medium_indirect',
    'lightLevel.indoor.low',
    'lightLevel.outdoor.direct',
    'lightLevel.outdoor.bright_indirect',
    'lightLevel.outdoor.medium_indirect',
    'lightLevel.outdoor.low',
    'plantCard.waterBadge.fixed',
    'plantCard.waterBadge.soilCheck',
    'plantDetail.seasonBadge.every',
    'plantDetail.seasonBadge.warm',
    'plantDetail.seasonBadge.cold',
    'plantDetail.seasonBadge.tropical',
    'today.soilCheckEmptyRow',
  ];

  // i18n parity: every new key must exist in BOTH locales as a non-empty string.
  for (const p of newKeyPaths) {
    const enVal = get(en, p);
    const esVal = get(es, p);
    assert(`EN key '${p}' exists as string`, typeof enVal === 'string' && enVal.length > 0);
    assert(`ES key '${p}' exists as string`, typeof esVal === 'string' && esVal.length > 0);
  }

  // Specific value assertions — copy is locked in CONTEXT.md/RESEARCH.md.
  assert("EN lightLevel.indoor.bright_indirect === 'Bright indirect light'",
    en.lightLevel.indoor.bright_indirect === 'Bright indirect light');
  assert("ES lightLevel.indoor.bright_indirect === 'Luz brillante indirecta'",
    es.lightLevel.indoor.bright_indirect === 'Luz brillante indirecta');
  assert("EN lightLevel.outdoor.direct === 'Full sun'",
    en.lightLevel.outdoor.direct === 'Full sun');
  assert("ES lightLevel.outdoor.direct === 'Sol pleno'",
    es.lightLevel.outdoor.direct === 'Sol pleno');
  assert("EN plantCard.waterBadge.fixed contains '💧' and '{{days}}'",
    en.plantCard.waterBadge.fixed.includes('💧') && en.plantCard.waterBadge.fixed.includes('{{days}}'));
  // QW6: soilCheck badge now parallel to fixed (verb + interval voseo). Both share {{days}} interp.
  assert("ES plantCard.waterBadge.soilCheck contains '🤚', voseo verb 'Chequeá', and '{{days}}'",
    es.plantCard.waterBadge.soilCheck.includes('🤚') &&
    es.plantCard.waterBadge.soilCheck.includes('Chequeá') &&
    es.plantCard.waterBadge.soilCheck.includes('{{days}}'));
  assert("EN plantDetail.seasonBadge.tropical === 'tropical'",
    en.plantDetail.seasonBadge.tropical === 'tropical');
  assert("ES plantDetail.seasonBadge.tropical === 'trópico'",
    es.plantDetail.seasonBadge.tropical === 'trópico');
  assert("EN today.soilCheckEmptyRow contains '{{plantName}}' and '{{days}}'",
    en.today.soilCheckEmptyRow.includes('{{plantName}}') && en.today.soilCheckEmptyRow.includes('{{days}}'));
  assert("ES today.soilCheckEmptyRow contains 'modo chequeo' and 'Te avisamos'",
    es.today.soilCheckEmptyRow.includes('modo chequeo') && es.today.soilCheckEmptyRow.includes('Te avisamos'));

  // Voseo-rejection in new ES keys (scoped to new namespaces only — does NOT affect existing keys).
  const esNewBlob = JSON.stringify(es.lightLevel) + JSON.stringify(es.plantCard.waterBadge)
                  + JSON.stringify(es.plantDetail.seasonBadge) + JSON.stringify(es.today.soilCheckEmptyRow);
  assert("ES new keys contain no bare tuteo verbs (riega/toca/revisa)",
    !/\briega\b|\btoca\b|\brevisa\b/.test(esNewBlob));

  // Legacy-key preservation (SCHEMA-08 — keep one release).
  assert("Legacy plantDetail.sunHours preserved in EN", typeof en.plantDetail.sunHours === 'string');
  assert("Legacy plantDetail.waterEvery preserved in EN", typeof en.plantDetail.waterEvery === 'string');
  assert("Legacy plantCard.nextWater preserved in EN", typeof en.plantCard.nextWater === 'string');
  assert("Legacy plantDetailModal.hoursPerDay preserved in EN", typeof en.plantDetailModal.hoursPerDay === 'string');

  // ──────────────────────────────────────────────────────────────────────
  // Wave 1: getLightLabel behavior matrix.
  // Stub translator echoes the requested key — assertions check the key constructed.
  // ──────────────────────────────────────────────────────────────────────
  const tEcho = (key) => key;
  const { getLightLabel, OUTDOOR_TYPE_IDS } = lightLabelMod;

  // 8 indoor/outdoor × 4 level cases.
  assert("getLightLabel({lightLevel:'direct',typeId:'interior'}) → 'lightLevel.indoor.direct'",
    getLightLabel({ lightLevel: 'direct', typeId: 'interior' }, tEcho) === 'lightLevel.indoor.direct');
  assert("getLightLabel({lightLevel:'bright_indirect',typeId:'interior'}) → 'lightLevel.indoor.bright_indirect'",
    getLightLabel({ lightLevel: 'bright_indirect', typeId: 'interior' }, tEcho) === 'lightLevel.indoor.bright_indirect');
  assert("getLightLabel({lightLevel:'medium_indirect',typeId:'interior'}) → 'lightLevel.indoor.medium_indirect'",
    getLightLabel({ lightLevel: 'medium_indirect', typeId: 'interior' }, tEcho) === 'lightLevel.indoor.medium_indirect');
  assert("getLightLabel({lightLevel:'low',typeId:'interior'}) → 'lightLevel.indoor.low'",
    getLightLabel({ lightLevel: 'low', typeId: 'interior' }, tEcho) === 'lightLevel.indoor.low');

  assert("getLightLabel({lightLevel:'direct',typeId:'exterior'}) → 'lightLevel.outdoor.direct'",
    getLightLabel({ lightLevel: 'direct', typeId: 'exterior' }, tEcho) === 'lightLevel.outdoor.direct');
  assert("getLightLabel({lightLevel:'bright_indirect',typeId:'huerta'}) → 'lightLevel.outdoor.bright_indirect'",
    getLightLabel({ lightLevel: 'bright_indirect', typeId: 'huerta' }, tEcho) === 'lightLevel.outdoor.bright_indirect');
  assert("getLightLabel({lightLevel:'medium_indirect',typeId:'aromaticas'}) → 'lightLevel.outdoor.medium_indirect'",
    getLightLabel({ lightLevel: 'medium_indirect', typeId: 'aromaticas' }, tEcho) === 'lightLevel.outdoor.medium_indirect');
  assert("getLightLabel({lightLevel:'low',typeId:'frutales'}) → 'lightLevel.outdoor.low'",
    getLightLabel({ lightLevel: 'low', typeId: 'frutales' }, tEcho) === 'lightLevel.outdoor.low');

  // suculentas → INDOOR (Anti-Pattern lock).
  assert("getLightLabel({lightLevel:'medium_indirect',typeId:'suculentas'}) → INDOOR (suculentas is indoor)",
    getLightLabel({ lightLevel: 'medium_indirect', typeId: 'suculentas' }, tEcho) === 'lightLevel.indoor.medium_indirect');

  // Defensive ladder rung 2: sunHours fallback.
  assert("getLightLabel({sunHours:5,typeId:'interior'}) → indoor.direct (rung 2 — sunHoursToLightLevel)",
    getLightLabel({ sunHours: 5, typeId: 'interior' }, tEcho) === 'lightLevel.indoor.direct');
  assert("getLightLabel({sunHours:4,typeId:'interior'}) → indoor.bright_indirect (rung 2)",
    getLightLabel({ sunHours: 4, typeId: 'interior' }, tEcho) === 'lightLevel.indoor.bright_indirect');
  assert("getLightLabel({sunHours:1,typeId:'exterior'}) → outdoor.low (rung 2)",
    getLightLabel({ sunHours: 1, typeId: 'exterior' }, tEcho) === 'lightLevel.outdoor.low');

  // Defensive ladder rung 3: safe default.
  assert("getLightLabel({typeId:'interior'}) → indoor.bright_indirect (rung 3 — safe default)",
    getLightLabel({ typeId: 'interior' }, tEcho) === 'lightLevel.indoor.bright_indirect');
  assert("getLightLabel({typeId:'unknown_category'}) → indoor.bright_indirect (unknown typeId fails to indoor)",
    getLightLabel({ typeId: 'unknown_category' }, tEcho) === 'lightLevel.indoor.bright_indirect');

  // ──────────────────────────────────────────────────────────────────────
  // Wave 1: getSeasonalInterval matrix.
  // ──────────────────────────────────────────────────────────────────────
  const { getSeasonalInterval } = plantLogicMod;

  assert("getSeasonalInterval({warm:5,cold:10}, 'warm') === 5",
    getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'warm') === 5);
  assert("getSeasonalInterval({warm:5,cold:10}, 'cold') === 10",
    getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'cold') === 10);
  assert("getSeasonalInterval({warm:5,cold:10}, 'tropical') === 5 (tropical→warm bucket)",
    getSeasonalInterval({ waterSchedule: { warm: 5, cold: 10 } }, 'tropical') === 5);
  assert("getSeasonalInterval({waterEvery:7}, 'warm') === 7 (legacy fallback)",
    getSeasonalInterval({ waterEvery: 7 }, 'warm') === 7);
  assert("getSeasonalInterval({waterEvery:7}, 'cold') === 7 (legacy fallback regardless of season)",
    getSeasonalInterval({ waterEvery: 7 }, 'cold') === 7);
  assert("getSeasonalInterval({}, 'warm') === 7 (safe default)",
    getSeasonalInterval({}, 'warm') === 7);
  assert("getSeasonalInterval({waterSchedule:{warm:0,cold:10}}, 'warm') === 7 (zero treated as fallback)",
    getSeasonalInterval({ waterSchedule: { warm: 0, cold: 10 } }, 'warm') === 7);

  console.log('\nWave 1 assertions complete.');

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
