import { checkLitters, checkLittersText, formatReport } from './checkLitters';
import schema from './litters.schema.json';

function validData() {
  return {
    litters: [
      {
        id: '2027-01-coco-leo',
        listed: true,
        breed: 'Havapoo',
        mom: { name: 'Coco', breed: 'Havapoo', photo: 'coco.jpg' },
        dad: { name: 'Leo', breed: 'Havapoo', photo: 'leo.jpg' },
        born: '2027-01-10',
        readyDate: '2027-03-07',
        care: [{ type: 'dewormed', date: '2027-02-07' }],
        puppies: [
          {
            slug: 'maple', name: 'Maple', sex: 'female', status: 'available',
            color: ['white', 'black'], pattern: 'parti', markings: 'Black ears', personality: 'Bold',
            weights: [{ date: '2027-02-14', oz: 31.5 }],
          },
          { slug: 'rocky', name: 'Rocky', sex: 'male', status: 'reserved' },
        ],
      },
    ],
  };
}

function validFiles() {
  return {
    parents: ['coco.jpg', 'leo.jpg'],
    '2027-01-coco-leo': ['A1.jpg'],
    '2027-01-coco-leo/maple': ['IMG_1.jpeg'],
    '2027-01-coco-leo/rocky': ['IMG_2.JPG'],
  };
}

const maple = (data) => data.litters[0].puppies[0];

describe('checkLitters — values', () => {
  test('accepts a valid litter, photos included', () => {
    expect(checkLitters(validData(), schema, { files: validFiles() })).toEqual({ errors: [], warnings: [] });
  });

  test('a status typo is an error that names the place and suggests the right value', () => {
    const data = validData();
    maple(data).status = 'Available';
    const { errors } = checkLitters(data, schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].where).toBe('2027-01-coco-leo › maple › status');
    expect(errors[0].message).toContain('Did you mean "available"?');
  });

  test('sex is lowercase female or male', () => {
    const data = validData();
    maple(data).sex = 'Female';
    expect(checkLitters(data, schema).errors[0].message).toContain('Use one of: female, male');
  });

  test('weights are plain numbers', () => {
    const data = validData();
    maple(data).weights[0].oz = '31.5 oz';
    const { errors } = checkLitters(data, schema);
    expect(errors[0].where).toBe('2027-01-coco-leo › maple › weights #1 › oz');
    expect(errors[0].message).toContain('plain number, like 31.5');
  });

  test('dates are written YYYY-MM-DD and must exist', () => {
    const shape = validData();
    shape.litters[0].born = '2027-1-10';
    expect(checkLitters(shape, schema).errors[0].message).toContain('Write dates as YYYY-MM-DD');

    const impossible = validData();
    impossible.litters[0].readyDate = '2027-02-30';
    expect(checkLitters(impossible, schema).errors[0].message).toBe('"2027-02-30" isn\'t a real date.');
  });

  test('readyDate and weigh-ins cannot come before born', () => {
    const data = validData();
    data.litters[0].readyDate = '2027-01-01';
    maple(data).weights[0].date = '2027-01-05';
    const messages = checkLitters(data, schema).errors.map((e) => e.message);
    expect(messages).toContain('readyDate (Jan 1, 2027) is before born (Jan 10, 2027).');
    expect(messages).toContain('This weigh-in (Jan 5, 2027) is before the litter was born (Jan 10, 2027).');
  });

  test('a care step cannot come before born', () => {
    const data = validData();
    data.litters[0].care[0].date = '2026-12-07';
    expect(checkLitters(data, schema).errors).toEqual([{
      where: '2027-01-coco-leo › care #1 › date',
      message: 'This care step (Dec 7, 2026) is before the litter was born (Jan 10, 2027).',
    }]);
  });

  test('a slug is unique across all litters, and contact is taken', () => {
    const data = validData();
    data.litters.push({ ...validData().litters[0], id: '2027-06-coco-leo' });
    data.litters[0].puppies[1].slug = 'contact';
    const messages = checkLitters(data, schema).errors.map((e) => e.message);
    expect(messages).toContain('The slug "maple" is already used in 2027-01-coco-leo. Add a number, e.g. "maple-2".');
    expect(messages).toContain('"contact" can\'t be a slug — /contact is the address of a page.');
  });

  test('an unknown field suggests the right one; a missing one says which', () => {
    const data = validData();
    maple(data).colour = maple(data).color;
    delete maple(data).color;
    delete data.litters[0].puppies[1].status;
    const messages = checkLitters(data, schema).errors.map((e) => e.message);
    expect(messages).toContain('"colour" isn\'t a field here. Did you mean "color"?');
    expect(messages).toContain('"status" is missing — every puppy needs it.');
  });

  test('at least one litter stays listed', () => {
    const data = validData();
    data.litters[0].listed = false;
    expect(checkLitters(data, schema).errors[0].message).toContain('No litter has "listed": true');
  });

  test('lowercase descriptions and a short litterSize are warnings, not errors', () => {
    const data = validData();
    maple(data).markings = 'black ears';
    data.litters[0].litterSize = 1;
    const { errors, warnings } = checkLitters(data, schema);
    expect(errors).toEqual([]);
    expect(warnings.map((w) => w.where)).toEqual([
      '2027-01-coco-leo › litterSize',
      '2027-01-coco-leo › maple › markings',
    ]);
  });

  test('a born litter with no puppies listed yet is a warning, not an error', () => {
    const data = validData();
    data.litters[0].puppies = [];
    const { errors, warnings } = checkLitters(data, schema);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([{
      where: '2027-01-coco-leo',
      message: 'Born, but no puppies are listed yet. Home says "Puppies coming soon" and offers the waitlist until you add them.',
    }]);
  });

  test('lineage breeds must add up to 100', () => {
    const data = validData();
    data.litters[0].lineage = { source: 'Wisdom Panel', tested: 'Bear', breeds: { poodle: 47, havanese: 37, bichon: 13, other: 2 } };
    expect(checkLitters(data, schema).errors).toEqual([{
      where: '2027-01-coco-leo › lineage › breeds',
      message: 'The breeds add up to 99%, not 100%.',
    }]);
  });

  test('a lineage sourceUrl must start with https:// and say so', () => {
    const data = validData();
    data.litters[0].lineage = { source: 'Wisdom Panel', sourceUrl: 'http://www.wisdompanel.com', tested: 'Bear', breeds: { poodle: 47, havanese: 37, bichon: 13, other: 3 } };
    expect(checkLitters(data, schema).errors[0].message).toBe('"http://www.wisdompanel.com" doesn\'t fit. Start it with https://, e.g. https://www.wisdompanel.com.');
  });

  test('a breed percentage over 100 is an error, and a missing breed names the group', () => {
    const data = validData();
    data.litters[0].lineage = { source: 'Wisdom Panel', tested: 'Bear', breeds: { poodle: 101, havanese: 0, bichon: 0 } };
    const messages = checkLitters(data, schema).errors.map((e) => e.message);
    expect(messages).toContain('Must be at most 100.');
    expect(messages).toContain('"other" is missing — every breeds group needs it.');
  });

  test('broken JSON gets a plain-language message', () => {
    const { errors } = checkLittersText('{ "litters": [ }', schema);
    expect(errors[0].message).toMatch(/^This isn't valid JSON: .*missing or extra comma/);
  });
});

describe('checkLitters — photos', () => {
  test('a cover must match the file name exactly, capitals included', () => {
    const data = validData();
    data.litters[0].puppies[1].cover = 'IMG_2.jpg';
    const { errors } = checkLitters(data, schema, { files: validFiles() });
    expect(errors[0].message).toBe(
      '"IMG_2.jpg" isn\'t in src/images/2027-01-coco-leo/rocky/. The file there is "IMG_2.JPG" — names must match exactly, capitals included.',
    );
  });

  test('a missing parent photo is an error', () => {
    const files = validFiles();
    files.parents = ['coco.jpg'];
    expect(checkLitters(validData(), schema, { files }).errors[0].where).toBe('2027-01-coco-leo › dad › photo');
  });

  test('a missing lineage photo is an error', () => {
    const data = validData();
    data.litters[0].lineage = { source: 'Wisdom Panel', tested: 'Bear', photo: 'bear.jpg', breeds: { poodle: 47, havanese: 37, bichon: 13, other: 3 } };
    expect(checkLitters(data, schema, { files: validFiles() }).errors).toEqual([{
      where: '2027-01-coco-leo › lineage › photo',
      message: '"bear.jpg" isn\'t in src/images/parents/.',
    }]);
  });

  test('a puppy without photos, a HEIC file and a stray folder are warnings', () => {
    const files = validFiles();
    delete files['2027-01-coco-leo/rocky'];
    files['2027-01-coco-leo/maple'].push('IMG_3.HEIC');
    files['old-litter'] = ['IMG_9.jpg'];
    const { errors, warnings } = checkLitters(validData(), schema, { files });
    expect(errors).toEqual([]);
    expect(warnings.map((w) => w.where)).toEqual([
      '2027-01-coco-leo › rocky',
      'src/images/2027-01-coco-leo/maple/IMG_3.HEIC',
      'src/images/old-litter/',
    ]);
  });
});

describe('formatReport', () => {
  test('a build report says the build stopped and the live site is unchanged', () => {
    const data = validData();
    maple(data).status = 'Available';
    const text = formatReport(checkLitters(data, schema), 'build');
    expect(text).toContain('✗ Puppy data has 1 problem — build stopped. The live site is unchanged.');
    expect(text).toContain('2027-01-coco-leo › maple › status');
  });
});
