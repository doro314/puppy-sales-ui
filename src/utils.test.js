import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  daysBetween, firstClause, formatAge, formatCoat, formatDay, formatMonthYear, formatOunces, formatWeight, pluralize,
  todayString, withCoverFirst,
} from './utils';

describe('dates', () => {
  test('today is the local calendar date', () => {
    expect(todayString(new Date(2026, 6, 4, 23, 30))).toBe('2026-07-04');
  });

  test('day counts ignore daylight saving', () => {
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-06-02', '2026-06-28')).toBe(26);
  });

  test('dates read like the site writes them', () => {
    expect(formatDay('2026-06-02')).toBe('Jun 2');
    expect(formatDay('2026-07-28', { withYear: true })).toBe('Jul 28, 2026');
    expect(formatMonthYear('2026-06-02')).toBe('June 2026');
  });

  test('age in days, then weeks', () => {
    expect(formatAge('2027-01-10', '2027-01-10')).toBe('born today');
    expect(formatAge('2027-01-10', '2027-01-11')).toBe('1 day old');
    expect(formatAge('2027-01-10', '2027-01-17')).toBe('1 week old');
    expect(formatAge('2026-06-02', '2026-07-10')).toBe('5 weeks old');
  });
});

describe('weights', () => {
  test('ounces, then pounds and ounces from 32 oz', () => {
    expect(formatOunces(27.8)).toBe('27.8 oz');
    expect(formatOunces(32)).toBe('2 lb');
    expect(formatOunces(36)).toBe('2 lb 4 oz');
    expect(formatOunces(37.5)).toBe('2 lb 5.5 oz');
  });

  test('the latest weigh-in, with the age that day', () => {
    expect(formatWeight([{ date: '2026-06-28', oz: 27.8 }], '2026-06-02')).toBe('27.8 oz at 3 weeks');
    const log = [{ date: '2026-07-12', oz: 36 }, { date: '2026-06-28', oz: 27.8 }];
    expect(formatWeight(log, '2026-06-02')).toBe('2 lb 4 oz at 5 weeks');
    expect(formatWeight([{ date: '2026-06-05', oz: 6 }], '2026-06-02')).toBe('6 oz at 3 days');
  });

  test('no weigh-ins means no weight', () => {
    expect(formatWeight([], '2026-06-02')).toBeNull();
    expect(formatWeight(undefined, '2026-06-02')).toBeNull();
  });
});

describe('coats', () => {
  test('colors and pattern read as one phrase', () => {
    expect(formatCoat(['white', 'black'], 'parti')).toBe('White & black parti');
    expect(formatCoat(['brown'], 'abstract')).toBe('Brown abstract');
    expect(formatCoat(['brown'], 'solid')).toBe('Solid brown');
    expect(formatCoat(['black', 'white', 'tan'], 'tuxedo')).toBe('Black, white & tan tuxedo');
    expect(formatCoat(['cream'])).toBe('Cream');
    expect(formatCoat([])).toBeNull();
  });
});

describe('wording', () => {
  test('breeds pluralize', () => {
    expect(pluralize('Havapoo')).toBe('Havapoos');
    expect(pluralize('Poodle mix')).toBe('Poodle mixes');
  });

  test('a card shows the opening of the description', () => {
    const description = 'Raised in a loving home with children and other pets, making them well-socialized and ready to settle into family life from day one.';
    expect(firstClause(description)).toBe('Raised in a loving home with children and other pets.');
    expect(firstClause('Born in our kitchen. Raised with two kids.')).toBe('Born in our kitchen.');
    expect(firstClause('Born in our kitchen.')).toBe('Born in our kitchen.');
    expect(firstClause('Version 2.0 of the kitchen! Then more.')).toBe('Version 2.0 of the kitchen!');
  });
});

// Safari before 16.4 can't read a lookbehind, and one regex it can't read blanks the
// whole site for that visitor — so none may come back.
test('no source file uses a regex lookbehind', () => {
  const srcDir = resolve(process.cwd(), 'src');
  const offenders = readdirSync(srcDir, { recursive: true })
    .filter((file) => /\.jsx?$/.test(file) && !/\.test\.jsx?$/.test(file))
    .filter((file) => /\(\?<[=!]/.test(readFileSync(join(srcDir, file), 'utf8')));
  expect(offenders).toEqual([]);
});

describe('cover photo', () => {
  const photos = [{ name: 'IMG_1056.jpg' }, { name: 'IMG_1066.jpg' }, { name: 'IMG_1876.jpeg' }];

  test('the cover leads; the rest keep their order', () => {
    expect(withCoverFirst(photos, 'IMG_1876.jpeg').map((p) => p.name)).toEqual(['IMG_1876.jpeg', 'IMG_1056.jpg', 'IMG_1066.jpg']);
  });

  test('no cover, or a cover that is already first, changes nothing', () => {
    expect(withCoverFirst(photos)).toBe(photos);
    expect(withCoverFirst(photos, 'IMG_1056.jpg')).toBe(photos);
  });
});
