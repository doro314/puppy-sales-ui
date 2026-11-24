// docs/data-tutorial.html carries exact copies of the checker, the formatters and the
// schema, so its practice editor works opened straight from disk and checks exactly
// what the build checks. This writes those copies in; the test suite fails when
// they've gone stale.
//
//   node scripts/syncTutorial.js           update the tutorial
//   node scripts/syncTutorial.js --check   exit 1 if it's out of date

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUTORIAL = 'docs/data-tutorial.html';
const BLOCKS = ['src/data/checkLitters.js', 'src/utils.js', 'src/data/litters.schema.json'];

function syncedHtml(html, rootDir) {
  return BLOCKS.reduce((out, path) => {
    const begin = `/* BEGIN ${path} */`;
    const end = `/* END ${path} */`;
    const start = out.indexOf(begin);
    const stop = out.indexOf(end);
    if (start < 0 || stop < start) throw new Error(`${TUTORIAL} has no ${begin} … ${end} block`);
    return `${out.slice(0, start + begin.length)}\n${readFileSync(join(rootDir, path), 'utf8').trim()}\n${out.slice(stop)}`;
  }, html);
}

export function isTutorialInSync(rootDir) {
  const html = readFileSync(join(rootDir, TUTORIAL), 'utf8');
  return syncedHtml(html, rootDir) === html;
}

const isCli = import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  const rootDir = fileURLToPath(new URL('..', import.meta.url));
  if (process.argv.includes('--check')) {
    const inSync = isTutorialInSync(rootDir);
    console.log(inSync ? 'The tutorial is up to date.' : 'The tutorial is out of date — run node scripts/syncTutorial.js');
    process.exit(inSync ? 0 : 1);
  }
  const file = join(rootDir, TUTORIAL);
  writeFileSync(file, syncedHtml(readFileSync(file, 'utf8'), rootDir));
  console.log(`Updated ${TUTORIAL}`);
}
