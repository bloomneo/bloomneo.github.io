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
 * Expected sibling structure:
 *   ../appkit/llms.txt
 *   ../appkit/AGENTS.md
 *   ../uikit/llms.txt
 *   ../uikit/AGENTS.md   (optional)
 *   ../bloom/README.md   (used as basis for bloom/llms.txt if maintained separately)
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const SIBLING = path.resolve(ROOT, '..');

const copies = [
  // [source, destination]
  ['appkit/llms.txt',   'appkit/llms.txt'],
  ['appkit/AGENTS.md',  'appkit/AGENTS.md'],
  ['uikit/llms.txt',    'uikit/llms.txt'],
  ['uikit/AGENTS.md',   'uikit/AGENTS.md'],
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
