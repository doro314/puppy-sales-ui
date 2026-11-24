import { isTutorialInSync } from './syncTutorial';

// The tutorial's practice editor runs copies of the real checker, formatters and schema.
test('docs/data-tutorial.html carries the current checker, formatters and schema', () => {
  expect(isTutorialInSync(process.cwd()), 'The tutorial is out of date — run node scripts/syncTutorial.js').toBe(true);
});
