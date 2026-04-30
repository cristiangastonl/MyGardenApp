/**
 * Phase 4 / SCHEMA-08 — CI grep guard against legacy field reads.
 *
 * Allowlist baseline: 24 entries (2026-04-30).
 * v1.2 target: 0 entries — when migrating a file off legacy fields,
 * REMOVE its entry from the ALLOWLIST below. The grep guard then
 * permanently prevents regression.
 *
 * Addendum (Wave 0 execution, 2026-04-30): 3 additional readers found
 * during baseline scan that the planner did not enumerate. These are
 * existing transitional readers that Phase 5-7 will migrate:
 *   - src/components/DayDetail.tsx
 *   - src/hooks/usePlantIdentification.ts
 *   - src/data/careTips.ts
 * Effective transitional total: 27 entries; v1.2 target remains 0.
 *
 * Forbidden patterns: plant.sunHours, plant.waterEvery
 * Migration target fields: plant.lightLevel, plant.waterSchedule
 */

const { execSync } = require('child_process');

// ALLOWLIST: Files (or directory prefixes) where legacy-field reads are
// tolerated DURING the v1.1 transition. As Phase 4-7 migrates each file
// off the legacy fields, REMOVE its entry from this list. The grep guard
// will then permanently prevent regressions in that file.
const ALLOWLIST = new Set([
  'src/types/index.ts',
  'src/types/database.ts',
  'src/utils/migration.ts',
  'src/utils/notificationScheduler.ts',
  'src/utils/plantInfo.ts',
  'src/utils/plantLogic.ts',
  'src/utils/plantHealth.ts',
  'src/utils/plantAlerts.ts',
  'src/utils/plantIdentification.ts',
  'src/screens/OnboardingScreen.tsx',
  'src/screens/ExploreScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/components/AddPlantModal.tsx',
  'src/components/PlantCard.tsx',
  'src/components/PlantDetailModal.tsx',
  'src/components/MyPlantDetailModal.tsx',
  'src/components/PlantDatabaseCard.tsx',
  'src/components/PlantHealthDetail.tsx',
  'src/components/PlantDiagnosis',
  'src/components/PlantIdentifier',
  'src/data/plantDatabase.ts',
  'src/data/constants.ts',
  'src/services/syncService.ts',
  'src/services/plantKnowledgeService.ts',
  // Addendum (see header) — transitional readers found during Wave 0 baseline scan:
  'src/components/DayDetail.tsx',
  'src/hooks/usePlantIdentification.ts',
  'src/data/careTips.ts',
]);

const FORBIDDEN_PATTERNS = ['\\.sunHours', '\\.waterEvery'];

const violations = [];

for (const pattern of FORBIDDEN_PATTERNS) {
  let output = '';
  try {
    output = execSync(
      `git grep -nE "${pattern}" -- 'src/**/*.ts' 'src/**/*.tsx'`,
      { encoding: 'utf8' }
    );
  } catch (e) {
    // git grep exits 1 when there are no matches — that's success
    if (e.status === 1) continue;
    throw e;
  }

  const lines = output.split('\n').filter((l) => l.length > 0);
  for (const line of lines) {
    // Parse `file:line:content` (split on first two `:` only — content may contain `:`)
    const firstColon = line.indexOf(':');
    if (firstColon === -1) continue;
    const file = line.slice(0, firstColon);

    // Allowlisted if exact match OR file is inside an allowlisted directory prefix
    let allowed = false;
    if (ALLOWLIST.has(file)) {
      allowed = true;
    } else {
      for (const entry of ALLOWLIST) {
        // Treat ALLOWLIST entries without a `.` extension as directory prefixes
        if (!entry.includes('.') && file.startsWith(entry + '/')) {
          allowed = true;
          break;
        }
      }
    }
    if (!allowed) violations.push(line);
  }
}

if (violations.length > 0) {
  console.error('❌ Legacy field reads found outside allowlist:');
  for (const v of violations) console.error('  ' + v);
  console.error(
    '\nMigrate these to plant.lightLevel / plant.waterSchedule, or add the file to ALLOWLIST in scripts/check-no-legacy-reads.js if it is in transition.'
  );
  process.exit(1);
}

console.log('✅ No new legacy-field reads outside allowlist.');
process.exit(0);
