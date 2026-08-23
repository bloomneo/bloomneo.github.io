#!/usr/bin/env node
/**
 * sync-docs.js
 *
 * Syncs llms.txt and AGENTS.md from the sibling package repos into this
 * bloomneo.github.io site so that AI agents visiting dev.bloomneo.com get
 * up-to-date machine-readable docs.
 *
 * Usage (run from the bloomneo.github.io directory):
 *   node scripts/sync-docs.js
 *
 * Finds the package repos automatically — beside this one, or in
 * ~/vc/production — and reads:
 *   <packages>/appkit/llms.txt
 *   <packages>/appkit/AGENTS.md
 *   <packages>/uikit/llms.txt
 *   <packages>/uikit/AGENTS.md   (optional)
 *   <packages>/bloom/llms.txt
 *
 * Override the location with BLOOM_PACKAGES_DIR.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * Where the package repos live.
 *
 * This used to be `path.resolve(ROOT, '..')` — one level up, on the assumption
 * that appkit/uikit/bloom sit beside this site. They did, until this repo was
 * moved to a different projects folder, at which point every source path
 * resolved to somewhere that does not exist.
 *
 * A hardcoded relative path is a claim about a directory layout, and the layout
 * is not this script's to control. So try the candidates, use the first that
 * actually holds the packages, and say which one — and if none do, fail with
 * the full list of what was looked at rather than a confusing ENOENT on a path
 * nobody recognises.
 */
const CANDIDATES = [
  path.resolve(ROOT, '..'),                                  // siblings
  path.resolve(ROOT, '../../../production'),                 // ~/vc/production
  path.resolve(ROOT, '../../production'),
  process.env.BLOOM_PACKAGES_DIR || '',                      // explicit override
].filter(Boolean);

const SIBLING = (() => {
  const found = CANDIDATES.find((dir) =>
    ['appkit', 'uikit', 'bloom'].every((pkg) => fs.existsSync(path.join(dir, pkg))),
  );
  if (!found) {
    console.error('❌ Could not find the appkit/uikit/bloom repos. Looked in:');
    for (const dir of CANDIDATES) console.error(`     ${dir}`);
    console.error('   Set BLOOM_PACKAGES_DIR to the directory that holds them.');
    process.exit(1);
  }
  console.log(`📦 Reading packages from ${found}`);
  return found;
})();

const copies = [
  // [source, destination]
  ['appkit/llms.txt',   'appkit/llms.txt'],
  ['appkit/AGENTS.md',  'appkit/AGENTS.md'],
  ['uikit/llms.txt',    'uikit/llms.txt'],
  ['uikit/AGENTS.md',   'uikit/AGENTS.md'],
  ['bloom/llms.txt',    'bloom/llms.txt'],
  ['bloom/AGENTS.md',   'bloom/AGENTS.md'],
];

let synced = 0;
let skipped = 0;

for (const [src, dst] of copies) {
  const srcPath = path.join(SIBLING, src);
  const dstPath = path.join(ROOT, dst);

  if (!fs.existsSync(srcPath)) {
    console.warn(`⚠  Source not found, skipping: ${srcPath}`);
    skipped++;
    continue;
  }

  const srcContent = fs.readFileSync(srcPath, 'utf8');
  const dstContent = fs.existsSync(dstPath) ? fs.readFileSync(dstPath, 'utf8') : null;

  if (srcContent === dstContent) {
    console.log(`✓  Up to date: ${dst}`);
    continue;
  }

  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, srcContent, 'utf8');
  console.log(`↑  Synced: ${src} → ${dst}`);
  synced++;
}

console.log(`\nDone. ${synced} file(s) updated, ${skipped} skipped.`);
if (synced > 0) {
  console.log('Remember to commit the updated files to bloomneo.github.io.');
}
