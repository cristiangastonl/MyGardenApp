// Single-use codemod for Phase 4 catalog mechanical mapping (LIGHT-03, WATER-04).
// Re-running is safe (idempotent skip on existing v1.1 fields).
// Phase 8 will REPLACE auto-mapped values with expert-vetted overrides.
// Delete this script in v1.2 cleanup pass.
//
// Approach: compile src/utils/migration.ts on-the-fly via typescript.transpileModule
// (same pattern as scripts/migration-smoke-test.mjs) to obtain the SAME mappers
// used for user-data migration. Then walk src/data/plantDatabase.ts as text,
// identifying top-level entries inside the PLANT_DATABASE array via brace depth,
// and inject lightLevel / waterSchedule / waterMode before each entry's closing `}`.
//
// Usage:
//   node scripts/migrate-catalog.mjs
//
// Exits 0 on success. Prints "Updated N entries; M already had v1.1 fields (skipped)."

import fs from 'node:fs/promises';
import path from 'node:path';

const CATALOG_PATH = 'src/data/plantDatabase.ts';
const MIGRATION_TS = 'src/utils/migration.ts';
const TMP_COMPILE_PATH = `${process.cwd()}/scripts/.tmp-migrate-catalog.mjs`;

async function main() {
  // ── Step 1: compile migration.ts to ESM via typescript.transpileModule ──
  const ts = (await import('typescript')).default;
  const tsSource = await fs.readFile(MIGRATION_TS, 'utf8');
  const compiled = ts.transpileModule(tsSource, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  await fs.writeFile(TMP_COMPILE_PATH, compiled);

  const { sunHoursToLightLevel, applyColdFactor, inferWaterMode } = await import(TMP_COMPILE_PATH);

  // ── Step 2: read catalog source ──
  const catalogSource = await fs.readFile(CATALOG_PATH, 'utf8');
  const lines = catalogSource.split('\n');

  // ── Step 3: walk lines, find PLANT_DATABASE array, collect entry boundaries ──
  // Each entry is a top-level object inside the `export const PLANT_DATABASE: PlantDBEntry[] = [ ... ];`
  // We detect entry start by `^  {` (2-space indent + brace) and the corresponding closing `^  },` or `^  }`.

  // Find array bounds first
  let arrayStart = -1;
  let arrayEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (arrayStart === -1 && lines[i].startsWith('export const PLANT_DATABASE')) {
      arrayStart = i;
    }
    if (arrayStart !== -1 && arrayEnd === -1 && /^\];\s*$/.test(lines[i])) {
      arrayEnd = i;
      break;
    }
  }
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error('Could not locate PLANT_DATABASE array bounds');
  }

  // Walk inside the array, tracking brace depth.
  // Top-level entries start when depth transitions 0 → 1 at line starting with `  {`,
  // and close when depth transitions 1 → 0 at a line starting with `  }` (with optional `,`).
  const entries = []; // { startLine, endLine }
  let depth = 0;
  let entryStartLine = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i++) {
    const line = lines[i];
    // Strip line/inline comments and template-string contents to avoid false brace counts.
    // The catalog uses backtick template strings only on imageUrl lines (no embedded braces),
    // so a simple character-by-character walk over the whole line is safe enough.
    let inString = null; // '"' | "'" | '`' | null
    let escape = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
      if (inString) {
        if (ch === inString) inString = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        continue;
      }
      // Line-comment guard: '// ' starts a comment that runs to end of line
      if (ch === '/' && line[c + 1] === '/') break;
      if (ch === '{') {
        if (depth === 0) entryStartLine = i;
        depth += 1;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0 && entryStartLine !== -1) {
          entries.push({ startLine: entryStartLine, endLine: i });
          entryStartLine = -1;
        }
      }
    }
  }

  if (entries.length === 0) {
    throw new Error('No catalog entries detected — brace walker found nothing');
  }

  // ── Step 4: process each entry ──
  let updated = 0;
  let skipped = 0;
  // We'll build the new file by replacing each entry's lines in-place.
  // Iterate in reverse so injected line offsets don't shift unprocessed entries.
  const newLines = [...lines];

  for (let e = entries.length - 1; e >= 0; e--) {
    const { startLine, endLine } = entries[e];
    const entryText = newLines.slice(startLine, endLine + 1).join('\n');

    // Idempotency: skip if already has lightLevel:
    if (/lightLevel:\s*['"]/.test(entryText)) {
      skipped += 1;
      continue;
    }

    // Extract id, category, waterDays, sunHours from this entry
    const idMatch = entryText.match(/id:\s*"([^"]+)"/);
    const catMatch = entryText.match(/category:\s*"(interior|exterior|aromaticas|huerta|frutales|suculentas)"/);
    const waterMatch = entryText.match(/waterDays:\s*(\d+(?:\.\d+)?)/);
    const sunMatch = entryText.match(/sunHours:\s*(\d+(?:\.\d+)?)/);

    if (!idMatch || !catMatch || !waterMatch || !sunMatch) {
      throw new Error(
        `Entry at line ${startLine + 1}: missing required field(s). ` +
          `id=${!!idMatch}, category=${!!catMatch}, waterDays=${!!waterMatch}, sunHours=${!!sunMatch}`
      );
    }

    const id = idMatch[1];
    const category = catMatch[1];
    const waterDays = Number(waterMatch[1]);
    const sunHours = Number(sunMatch[1]);

    const lightLevel = sunHoursToLightLevel(sunHours);
    const warmDays = waterDays;
    const coldDays = applyColdFactor(warmDays, category);
    const waterMode = inferWaterMode(category, id);

    // Build injection lines (4-space indent matching surrounding fields)
    const injection = [
      `    lightLevel: "${lightLevel}",`,
      `    waterSchedule: { warm: ${warmDays}, cold: ${coldDays} },`,
      `    waterMode: "${waterMode}",`,
    ];

    // Insert before the closing `}` line.
    // The closing line (newLines[endLine]) typically looks like `  },` or `  }`.
    // We splice the injection in just BEFORE endLine.
    newLines.splice(endLine, 0, ...injection);
    updated += 1;
  }

  // ── Step 5: write back ──
  const newSource = newLines.join('\n');
  await fs.writeFile(CATALOG_PATH, newSource);

  console.log(`Updated ${updated} entries; ${skipped} already had v1.1 fields (skipped).`);
}

try {
  await main();
} catch (err) {
  console.error('CODEMOD ERROR:', err && err.message ? err.message : err);
  if (err && err.stack) console.error(err.stack);
  process.exitCode = 1;
} finally {
  await fs.unlink(TMP_COMPILE_PATH).catch(() => {});
}

process.exit(process.exitCode || 0);
