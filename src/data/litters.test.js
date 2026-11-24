import { resolve } from 'node:path';

import { readImageFolders } from '../../scripts/puppyDataPlugin';
import { checkLitters, formatReport } from './checkLitters';
import data from './litters.json';
import schema from './litters.schema.json';

// Vitest runs from the project root; import.meta.url isn't a file URL under happy-dom.
const IMAGES_DIR = resolve(process.cwd(), 'src/images');

// The rest of the suite mocks the data; this is the test that reads the real file and photos.
test('the real litters.json and its photos pass the checker', () => {
  const report = checkLitters(data, schema, { files: readImageFolders(IMAGES_DIR) });
  expect(report.errors, formatReport(report)).toEqual([]);
});
