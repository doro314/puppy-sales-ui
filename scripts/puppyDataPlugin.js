import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { checkLittersText, formatReport } from '../src/data/checkLitters.js';

// { 'parents': ['coco.jpg'], '2026-06-coco-leo/bella': ['A1.jpg', …] } — exact names, dotfiles skipped.
export function readImageFolders(imagesDir) {
  const folders = {};
  const walk = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true }).filter((e) => !e.name.startsWith('.'));
    const rel = relative(imagesDir, dir).split(sep).join('/');
    if (rel) folders[rel] = entries.filter((e) => e.isFile()).map((e) => e.name);
    for (const e of entries) if (e.isDirectory()) walk(join(dir, e.name));
  };
  walk(imagesDir);
  return folders;
}

export function runPuppyDataCheck({ dataFile, schemaFile, imagesDir }) {
  const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  const files = imagesDir ? readImageFolders(imagesDir) : undefined;
  return checkLittersText(readFileSync(dataFile, 'utf8'), schema, { files });
}

// Build: bad data stops the build, so the previous deploy stays live.
// Dev: the problem shows in the terminal and as the browser's error overlay on save.
export function puppyDataPlugin(paths) {
  let mode = 'dev';
  const report = () => {
    const result = runPuppyDataCheck(paths);
    const text = formatReport(result, mode);
    if (text) console.log(`\n${text}\n`);
    return { result, text };
  };

  return {
    name: 'puppy-data-check',
    apply: () => !process.env.VITEST,
    configResolved(config) {
      mode = config.command === 'build' ? 'build' : 'dev';
    },
    buildStart() {
      const { result } = report();
      if (mode === 'build' && result.errors.length > 0) this.error('Puppy data has problems — see the list above.');
    },
    handleHotUpdate({ file, server }) {
      if (file !== paths.dataFile) return undefined;
      const { result, text } = report();
      if (result.errors.length === 0) return undefined;
      server.ws.send({ type: 'error', err: { message: text, stack: '', plugin: 'puppy-data-check' } });
      return [];
    },
  };
}
