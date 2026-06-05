#!/usr/bin/env node
/**
 * Fetch plant images from Unsplash, download them, and upload to Supabase Storage.
 *
 * Usage:
 *   node scripts/fetch-plant-images.mjs                  # Search & download
 *   node scripts/fetch-plant-images.mjs --upload          # Also upload to Supabase
 *   node scripts/fetch-plant-images.mjs --dry-run         # Just show what would be searched
 */

import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'plant-images');
const RESULTS_FILE = path.join(IMAGES_DIR, 'results.json');

const UNSPLASH_ACCESS_KEY = 'CNJCh3JTCMET-iysuAXY87OJ4hcbuhq1o7CEpejVnSQ';

// Map each plant ID to the best English search query for Unsplash
const PLANT_SEARCHES = {
  // Interior
  'potus': 'pothos plant indoor',
  'monstera': 'monstera deliciosa plant',
  'ficus': 'ficus elastica rubber plant',
  'sansevieria': 'snake plant sansevieria',
  'orquidea': 'phalaenopsis orchid flower',
  'calathea': 'calathea plant leaves',
  'cinta': 'spider plant chlorophytum',
  'palmera-interior': 'parlor palm chamaedorea',
  'aloe-vera': 'aloe vera plant',
  'espatifilo': 'peace lily spathiphyllum',
  'dracaena': 'dracaena fragrans plant',
  'filodendro': 'philodendron heartleaf plant',
  'jade': 'jade plant crassula ovata',
  'peperomia': 'peperomia plant',

  // Exterior
  'lavanda': 'lavender field flowers',
  'petunia': 'petunia flowers colorful',
  'hortensia': 'hydrangea flowers blue',
  'jazmin': 'jasmine flowers white',
  'geranio': 'geranium pelargonium flowers',
  'rosa': 'rose garden flowers',
  'bougainvillea': 'bougainvillea flowers',
  'hibisco': 'hibiscus flower tropical',
  'margarita': 'daisy leucanthemum flower',

  // Aromáticas
  'albahaca': 'basil herb plant',
  'romero': 'rosemary herb plant',
  'menta': 'mint plant herb',
  'perejil': 'parsley herb plant',
  'oregano': 'oregano herb plant',
  'cilantro': 'cilantro coriander herb',
  'tomillo': 'thyme herb plant',
  'ciboulette': 'chives herb garden',

  // Huerta
  'tomatera': 'tomato plant red fruit',
  'pimiento': 'pepper plant capsicum',
  'frutilla': 'strawberry plant fruit',
  'lechuga': 'lettuce growing garden',
  'pepino': 'cucumber plant growing',
  'zanahoria': 'carrot harvest garden',
  'rucula': 'arugula rocket plant',
  'zapallito': 'summer squash zucchini',

  // Frutales
  'limonero': 'lemon tree fruit',
  'naranjo': 'orange tree citrus fruit',
  'aguacate': 'avocado tree plant',
  'higuera': 'fig tree ficus carica',
  'mandarino': 'mandarin citrus tree',

  // Suculentas
  'suculenta-generica': 'succulent plant collection',
  'cactus': 'cactus plant desert',
  'echeveria': 'echeveria succulent rosette',
  'haworthia': 'haworthia succulent striped',
  'sedum': 'sedum morganianum burros tail',

  // ─── v1.2 catalog expansion — fetched in review batches via --only=<ids> ───
  // Batch 1 — interior tropicals (Phase 15 Wave A)
  'anthurium': 'anthurium andraeanum flamingo flower plant',
  'alocasia': 'alocasia elephant ear plant',
  'caladium': 'caladium',
  'singonio': 'syngonium',
  'aglaonema': 'chinese evergreen',
  'costilla-adan': 'monstera deliciosa swiss cheese plant',
  'difenbaquia': 'dumb cane plant',
  'begonia-rex': 'begonia leaves',
  'croton': 'croton leaves',
  'fitonia': 'fittonia pink',

  // Batch 2 — remaining interior tropicals / ferns / palms (Phase 15)
  'zamioculca': 'zz plant zamioculcas',
  'cola-burro': 'donkey tail sedum morganianum',
  'hiedra': 'english ivy plant',
  'palmera-areca': 'areca palm plant',
  'palmera-kentia': 'kentia palm indoor pot',
  'helecho-boston': 'nephrolepis boston fern potted',
  'helecho-nido': 'asplenium nidus fern',
  'pilea': 'pilea peperomioides',
  'maranta': 'maranta prayer plant',
  'ficus-lyrata': 'fiddle leaf fig',

  // Batch 3 — cactus / suculentas (Phase 16 Wave B)
  'nopal': 'opuntia prickly pear cactus',
  'mammillaria': 'mammillaria cactus',
  'cactus-navidad': 'christmas cactus schlumbergera',
  'kalanchoe': 'kalanchoe blossfeldiana flowers',
  'siempreviva': 'sempervivum hens and chicks',
  'gasteria': 'gasteria succulent',
  'piedras-vivas': 'lithops',
  'senecio-rowleyanus': 'string of pearls plant',
  'corona-espinas': 'euphorbia milii crown of thorns',
  'agave': 'agave plant',

  // Batch 4 — exterior flores (Phase 17 + v1.1 LATAM)
  'azalea': 'azalea flowers',
  'ciclamen': 'cyclamen flowers',
  'fucsia': 'fuchsia magellanica hanging flower',
  'clavel': 'carnation dianthus flowers',
  'crisantemo': 'chrysanthemum flowers',
  'tulipan': 'tulip flowers',
  'girasol': 'sunflower',
  'magnolia': 'magnolia flower',
  'dalia': 'dahlia flower',
  'camelia': 'camellia flower',

  // Batch 5 — follaje / trepadoras / trending (Phase 15-16)
  'arbol-dinero': 'pachira money tree plant',
  'tradescantia': 'tradescantia zebrina plant',
  'cheflera': 'schefflera umbrella plant',
  'hoya': 'hoya carnosa wax plant',
  'mini-monstera': 'rhaphidophora tetrasperma pot',
  'bambu-suerte': 'lucky bamboo stalks',
  'sansevieria-cilindrica': 'dracaena angolensis',
  'strelitzia': 'strelitzia bird of paradise plant',
  'eucalipto': 'eucalyptus plant',
  'cactus-san-pedro': 'trichocereus columnar cactus pot',
};

async function searchUnsplash(query, plantId) {
  const fetchResults = async (orientation) => {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '3');
    if (orientation) url.searchParams.set('orientation', orientation);
    url.searchParams.set('content_filter', 'high');

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Unsplash API error for "${plantId}": ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.results || [];
  };

  // Prefer squarish (best fit for catalog cards), but fall back to any orientation
  // so scarce species (caladium, syngonium, …) still get a hit — squarish-only
  // frequently returns nothing for less-photographed plants.
  let results = await fetchResults('squarish');
  if (results.length === 0) results = await fetchResults(null);
  if (results.length === 0) {
    console.warn(`  ⚠ No results for "${plantId}" (query: "${query}")`);
    return null;
  }

  const photo = results[0];
  return {
    id: plantId,
    photoId: photo.id,
    // Use &w=600 for good quality but small file size
    downloadUrl: photo.urls.regular.replace(/&w=\d+/, '&w=600'),
    smallUrl: photo.urls.small,
    author: photo.user.name,
    authorUrl: photo.user.links.html,
    unsplashUrl: photo.links.html,
    query,
  };
}

async function downloadImage(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));
  return buffer.byteLength;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const doUpload = args.includes('--upload');
  // --only=id1,id2 restricts the run to specific IDs so we can fetch+review in small
  // batches without re-hitting Unsplash for the already-uploaded older catalog entries.
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlyIds = onlyArg
    ? onlyArg.slice('--only='.length).split(',').map(s => s.trim()).filter(Boolean)
    : null;

  console.log(`\n🌱 Plant Image Fetcher`);
  console.log(`   ${Object.keys(PLANT_SEARCHES).length} plants to process\n`);

  if (dryRun) {
    console.log('DRY RUN — showing search queries:\n');
    for (const [id, query] of Object.entries(PLANT_SEARCHES)) {
      console.log(`  ${id.padEnd(22)} → "${query}"`);
    }
    return;
  }

  // Create images directory
  if (!existsSync(IMAGES_DIR)) {
    await mkdir(IMAGES_DIR, { recursive: true });
  }

  // Load existing results to avoid re-fetching
  let existingResults = {};
  if (existsSync(RESULTS_FILE)) {
    existingResults = JSON.parse(await readFile(RESULTS_FILE, 'utf-8'));
    console.log(`   Found ${Object.keys(existingResults).length} cached results\n`);
  }

  const results = { ...existingResults };
  const entries = Object.entries(PLANT_SEARCHES)
    .filter(([id]) => !onlyIds || onlyIds.includes(id));
  let searched = 0;
  let downloaded = 0;
  let errors = 0;

  for (const [plantId, query] of entries) {
    // Skip if already have result and image
    const imgPath = path.join(IMAGES_DIR, `${plantId}.jpg`);
    if (results[plantId] && existsSync(imgPath)) {
      console.log(`  ✓ ${plantId} (cached)`);
      continue;
    }

    // Rate limit: Unsplash allows 50 req/hr for demo apps
    if (searched > 0 && searched % 10 === 0) {
      console.log('  ⏳ Pausing 2s to respect rate limits...');
      await new Promise(r => setTimeout(r, 2000));
    }

    try {
      // Search
      console.log(`  🔍 ${plantId} → "${query}"`);
      const result = await searchUnsplash(query, plantId);
      searched++;

      if (!result) {
        errors++;
        continue;
      }

      results[plantId] = result;

      // Download
      const size = await downloadImage(result.downloadUrl, imgPath);
      downloaded++;
      console.log(`     ✓ Downloaded (${(size / 1024).toFixed(0)}KB) by ${result.author}`);

      // Save results incrementally
      await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));

      // Small delay between requests
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.error(`     ✗ Error: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Searched: ${searched}`);
  console.log(`   Downloaded: ${downloaded}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Images saved to: ${IMAGES_DIR}/`);
  console.log(`   Results saved to: ${RESULTS_FILE}`);

  // Generate attribution file
  const attributions = Object.values(results)
    .filter(Boolean)
    .map(r => `${r.id}: Photo by ${r.author} (${r.authorUrl}) on Unsplash (${r.unsplashUrl})`)
    .join('\n');
  await writeFile(path.join(IMAGES_DIR, 'ATTRIBUTIONS.md'), `# Plant Image Attributions\n\n${attributions}\n`);
  console.log(`   Attributions saved to: plant-images/ATTRIBUTIONS.md`);

  if (doUpload) {
    console.log('\n⬆️  Upload to Supabase not yet implemented.');
    console.log('   Run the upload step separately after reviewing images.');
  }
}

main().catch(console.error);
