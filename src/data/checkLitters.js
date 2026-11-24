// Checks litters.json against litters.schema.json, plus the rules a schema can't
// express: real dates, unique slugs, photos that exist. It is pure — folder listings
// are passed in — so the build, the dev server, the tests and the tutorial's editor
// all run exactly the same checks.

const WEB_PHOTO = /\.(jpe?g|png|gif|webp|avif)$/i;
const RESERVED_SLUGS = ['contact'];
const RESERVED_LITTER_IDS = ['parents'];
const CONTAINER_NOUNS = { litters: 'litter', puppies: 'puppy', weights: 'weigh-in', care: 'care step' };

export function checkLitters(data, schema, { files } = {}) {
  const report = { errors: [], warnings: [] };
  const ctx = { schema, data, report };
  validate(schema, data, [], ctx);
  if (report.errors.length > 0) return report;
  checkRules(data, ctx);
  if (files) checkFiles(data, files, ctx);
  return report;
}

export function checkLittersText(text, schema, options) {
  try {
    return checkLitters(JSON.parse(text), schema, options);
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
    return {
      errors: [{ where: 'litters.json', message: `This isn't valid JSON: ${err.message}. Usually a missing or extra comma, or a missing quote.` }],
      warnings: [],
    };
  }
}

export function formatReport({ errors, warnings }, mode = 'build') {
  const lines = [];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (errors.length > 0) {
    lines.push(mode === 'build'
      ? `✗ Puppy data has ${plural(errors.length, 'problem')} — build stopped. The live site is unchanged.`
      : `✗ Puppy data has ${plural(errors.length, 'problem')} — fix and save, and the page reloads.`);
    for (const e of errors) lines.push('', `  ${e.where}`, `  ${e.message}`);
  }
  if (warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push(`⚠ ${plural(warnings.length, 'warning')} — the site still works`);
    for (const w of warnings) lines.push('', `  ${w.where}`, `  ${w.message}`);
  }
  return lines.join('\n');
}

// ── Reporting ──────────────────────────────────────────────────────────────

function add(ctx, kind, where, message) {
  const label = typeof where === 'string' ? where : describePath(where, ctx.data);
  ctx.report[kind].push({ where: label, message });
}

// ['litters', 0, 'puppies', 3, 'status'] → "2026-06-coco-leo › olive › status"
function describePath(path, data) {
  const parts = [];
  let node = data;
  path.forEach((key, i) => {
    node = node?.[key];
    if (typeof key !== 'number') {
      if (key !== 'litters' && key !== 'puppies') parts.push(key);
      return;
    }
    const container = path[i - 1];
    if (container === 'litters') parts.push(node?.id || `litter ${key + 1}`);
    else if (container === 'puppies') parts.push(node?.slug || `puppy ${key + 1}`);
    else parts[parts.length - 1] = `${parts[parts.length - 1]} #${key + 1}`;
  });
  return parts.join(' › ') || 'litters.json';
}

function nounFor(path) {
  const last = path[path.length - 1];
  if (typeof last === 'number') return CONTAINER_NOUNS[path[path.length - 2]] ?? 'entry';
  if (last === 'mom' || last === 'dad') return 'parent';
  return 'entry';
}

// ── Schema (the subset litters.schema.json uses) ───────────────────────────

function resolve(node, schema) {
  if (!node.$ref) return node;
  const target = node.$ref.replace(/^#\//, '').split('/').reduce((obj, key) => obj[key], schema);
  return resolve(target, schema);
}

function validate(node, value, path, ctx) {
  const s = resolve(node, ctx.schema);
  if (s.type && !hasType(value, s.type)) return add(ctx, 'errors', path, typeMessage(s.type, value));
  if (s.enum && !s.enum.includes(value)) return add(ctx, 'errors', path, enumMessage(s.enum, value));

  if (typeof value === 'string') {
    if (s.minLength && value.trim().length < s.minLength) add(ctx, 'errors', path, "Can't be empty. Fill it in, or leave the field out.");
    if (s.pattern && !new RegExp(s.pattern).test(value)) add(ctx, 'errors', path, `"${value}" doesn't fit. ${s.patternErrorMessage ?? ''}`.trim());
  }
  if (typeof value === 'number') {
    if (s.exclusiveMinimum !== undefined && !(value > s.exclusiveMinimum)) add(ctx, 'errors', path, `Must be more than ${s.exclusiveMinimum}.`);
    if (s.minimum !== undefined && value < s.minimum) add(ctx, 'errors', path, `Must be at least ${s.minimum}.`);
  }
  if (Array.isArray(value)) validateList(s, value, path, ctx);
  if (isPlainObject(value)) validateFields(s, value, path, ctx);
}

function validateList(s, value, path, ctx) {
  if (s.minItems !== undefined && value.length < s.minItems) add(ctx, 'errors', path, `Needs at least ${s.minItems} ${s.minItems === 1 ? 'entry' : 'entries'}.`);
  if (s.maxItems !== undefined && value.length > s.maxItems) add(ctx, 'errors', path, `Can hold at most ${s.maxItems} entries.`);
  if (s.uniqueItems) {
    const repeated = value.find((v, i) => value.indexOf(v) !== i);
    if (repeated !== undefined) add(ctx, 'errors', path, `Lists "${repeated}" twice.`);
  }
  if (s.items) value.forEach((item, i) => validate(s.items, item, [...path, i], ctx));
}

function validateFields(s, value, path, ctx) {
  const allowed = Object.keys(s.properties ?? {}).filter((k) => k !== '$schema');
  for (const key of s.required ?? []) {
    if (!(key in value)) add(ctx, 'errors', path, `"${key}" is missing — every ${nounFor(path)} needs it.`);
  }
  for (const [key, v] of Object.entries(value)) {
    if (s.properties?.[key]) validate(s.properties[key], v, [...path, key], ctx);
    else if (s.additionalProperties === false) add(ctx, 'errors', [...path, key], unknownFieldMessage(key, allowed));
  }
}

function hasType(value, type) {
  if (type === 'object') return isPlainObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function typeMessage(type, value) {
  if (type === 'number' && typeof value === 'string' && !Number.isNaN(parseFloat(value))) {
    return `Should be a plain number, like ${parseFloat(value)} — not "${value}".`;
  }
  if (type === 'boolean' && (value === 'true' || value === 'false')) return `Should be ${value} without quotes.`;
  const wanted = {
    string: 'text in quotes, like "Bella"',
    number: 'a number, like 27.8',
    integer: 'a whole number, like 5',
    boolean: 'true or false, without quotes',
    array: 'a list in square brackets: [ … ]',
    object: 'a group in curly braces: { … }',
  };
  return `Should be ${wanted[type] ?? type}.`;
}

function enumMessage(allowed, value) {
  const shown = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
  const suggestion = typeof value === 'string' ? closest(value, allowed) : null;
  const hint = suggestion ? ` Did you mean "${suggestion}"?` : '';
  return `${shown} isn't an allowed value. Use one of: ${allowed.join(', ')}.${hint}`;
}

function unknownFieldMessage(key, allowed) {
  const suggestion = closest(key, allowed);
  if (suggestion) return `"${key}" isn't a field here. Did you mean "${suggestion}"?`;
  return `"${key}" isn't a field here. The fields are: ${allowed.join(', ')}.`;
}

function closest(word, options) {
  const lower = word.toLowerCase();
  const exact = options.find((o) => String(o).toLowerCase() === lower);
  if (exact) return exact;
  let best = null;
  let bestDistance = 3;
  for (const option of options) {
    const d = editDistance(lower, String(option).toLowerCase());
    if (d < bestDistance) { best = option; bestDistance = d; }
  }
  return best;
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = current;
    }
  }
  return row[b.length];
}

// ── Rules a schema can't express ───────────────────────────────────────────

function checkRules(data, ctx) {
  const { litters } = data;
  if (!litters.some((litter) => litter.listed)) {
    add(ctx, 'errors', ['litters'], 'No litter has "listed": true, so Home would have nothing to show. Keep the last litter listed until the next one goes in.');
  }

  const litterIds = new Set();
  const slugOwners = new Map();
  litters.forEach((litter, li) => {
    const lp = ['litters', li];
    if (litterIds.has(litter.id)) add(ctx, 'errors', [...lp, 'id'], `Two litters use the id "${litter.id}". Each needs its own.`);
    litterIds.add(litter.id);
    if (RESERVED_LITTER_IDS.includes(litter.id)) {
      add(ctx, 'errors', [...lp, 'id'], `"${litter.id}" can't be a litter id — src/images/${litter.id}/ holds the parents' photos.`);
    }

    for (const field of ['due', 'born', 'readyDate']) checkRealDate(litter[field], [...lp, field], ctx);
    (litter.care ?? []).forEach((step, ci) => checkRealDate(step.date, [...lp, 'care', ci, 'date'], ctx));
    if (litter.born && litter.readyDate && litter.readyDate < litter.born) {
      add(ctx, 'errors', [...lp, 'readyDate'], `readyDate (${formatDay(litter.readyDate)}) is before born (${formatDay(litter.born)}).`);
    }
    if (!litter.born && !litter.due) add(ctx, 'warnings', lp, 'Has neither "due" nor "born", so the site can\'t say when.');
    if (litter.litterSize !== undefined && litter.litterSize < litter.puppies.length) {
      add(ctx, 'warnings', [...lp, 'litterSize'], `litterSize is ${litter.litterSize}, but ${litter.puppies.length} puppies are listed.`);
    }

    litter.puppies.forEach((puppy, pi) => {
      const pp = [...lp, 'puppies', pi];
      if (RESERVED_SLUGS.includes(puppy.slug)) {
        add(ctx, 'errors', [...pp, 'slug'], `"${puppy.slug}" can't be a slug — /${puppy.slug} is the address of a page.`);
      }
      const owner = slugOwners.get(puppy.slug);
      if (owner) add(ctx, 'errors', [...pp, 'slug'], `The slug "${puppy.slug}" is already used in ${owner}. Add a number, e.g. "${puppy.slug}-2".`);
      else slugOwners.set(puppy.slug, litter.id);

      (puppy.weights ?? []).forEach((weight, wi) => {
        const wp = [...pp, 'weights', wi, 'date'];
        checkRealDate(weight.date, wp, ctx);
        if (litter.born && weight.date < litter.born) {
          add(ctx, 'errors', wp, `This weigh-in (${formatDay(weight.date)}) is before the litter was born (${formatDay(litter.born)}).`);
        }
      });
      for (const field of ['markings', 'personality']) {
        if (puppy[field] && /^[a-z]/.test(puppy[field])) {
          add(ctx, 'warnings', [...pp, field], `Starts with a lowercase letter: "${puppy[field]}". Start it with a capital.`);
        }
      }
    });
  });
}

function checkRealDate(value, path, ctx) {
  if (!value || isRealDate(value)) return;
  add(ctx, 'errors', path, `"${value}" isn't a real date.`);
}

function isRealDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function formatDay(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Photos ─────────────────────────────────────────────────────────────────

// files: { 'parents': ['coco.jpg'], '2026-06-coco-leo': [...], '2026-06-coco-leo/bella': [...] }
// Names are compared exactly: the Mac ignores capitals in file names, the Linux build doesn't.
function checkFiles(data, files, ctx) {
  const expected = new Set(['parents']);
  data.litters.forEach((litter, li) => {
    const lp = ['litters', li];
    expected.add(litter.id);
    if (litter.cover) needFile(files[litter.id], litter.cover, `src/images/${litter.id}/`, [...lp, 'cover'], ctx);
    for (const parent of ['mom', 'dad']) {
      if (litter[parent].photo) needFile(files.parents, litter[parent].photo, 'src/images/parents/', [...lp, parent, 'photo'], ctx);
    }
    litter.puppies.forEach((puppy, pi) => {
      const pp = [...lp, 'puppies', pi];
      const folder = `${litter.id}/${puppy.slug}`;
      expected.add(folder);
      const names = files[folder];
      if (!names) add(ctx, 'warnings', pp, `No photo folder yet — make src/images/${folder}/. Until then the page says "Photos coming soon".`);
      else if (!names.some((n) => WEB_PHOTO.test(n))) add(ctx, 'warnings', pp, `src/images/${folder}/ has no photos yet, so the page says "Photos coming soon".`);
      if (puppy.cover) needFile(names, puppy.cover, `src/images/${folder}/`, [...pp, 'cover'], ctx);
    });
  });

  for (const [folder, names] of Object.entries(files)) {
    if (!expected.has(folder)) {
      add(ctx, 'warnings', `src/images/${folder}/`, "This folder doesn't belong to any litter or puppy in litters.json, so its photos aren't shown.");
    }
    for (const name of names) {
      if (!WEB_PHOTO.test(name)) add(ctx, 'warnings', `src/images/${folder}/${name}`, "Not a photo format browsers can show, so it's skipped. Save it as a JPEG.");
    }
  }
}

function needFile(names, name, where, path, ctx) {
  if (names?.includes(name)) return;
  const near = names?.find((n) => n.toLowerCase() === name.toLowerCase());
  const hint = near
    ? ` The file there is "${near}" — names must match exactly, capitals included.`
    : '';
  add(ctx, 'errors', path, `"${name}" isn't in ${where}.${hint}`);
}
