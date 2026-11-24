// light: bars, paws and borders. strong: text and button fills — dark enough for
// white text and small type to pass WCAG AA (4.5:1).
export const ACCENTS = {
  female: { light: "#e91e8c", strong: "#df1683" },
  male: { light: "#4a90d9", strong: "#2a78c8" },
  neutral: { light: "#8a9bb0", strong: "#5d718a" },
};
export const DEPOSIT_AMOUNT = 100;

const DAY_MS = 24 * 60 * 60 * 1000;
const OZ_PER_LB = 16;
const POUNDS_FROM_OZ = 32;

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "Havapoo" → "Havapoos", "Poodle mix" → "Poodle mixes"
export function pluralize(word) {
  return /(s|x|z|ch|sh)$/i.test(word) ? `${word}es` : `${word}s`;
}

// The opening of a description, short enough for a card: its first sentence, or —
// when that runs long — the words up to its first comma.
export function firstClause(text, maxLength = 90) {
  const sentence = text.split(/(?<=[.!?])\s/)[0];
  if (sentence.length <= maxLength) return sentence;
  const clause = sentence.split(",")[0].trim();
  return clause.length < sentence.length ? `${clause}.` : sentence;
}

// Today's local calendar date as YYYY-MM-DD. Compare these strings, never timestamps:
// a timestamp comparison flips at the wrong hour in every time zone but UTC.
export function todayString(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// UTC arithmetic on calendar dates, so a daylight-saving change can't make a day 23 hours long.
function dayNumber(value) {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

export function daysBetween(from, to) {
  return dayNumber(to) - dayNumber(from);
}

// "2026-06-02" → "Jun 2", or "Jun 2, 2026" with { withYear: true }
export function formatDay(value, { withYear = false } = {}) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function formatSpan(days) {
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

// "5 weeks old"; "born today" on the day itself
export function formatAge(born, on) {
  const days = daysBetween(born, on);
  if (days <= 0) return "born today";
  return `${formatSpan(days)} old`;
}

// 27.8 → "27.8 oz"; from 32 oz on, pounds: 36 → "2 lb 4 oz"
export function formatOunces(oz) {
  const tenth = (n) => Math.round(n * 10) / 10;
  if (oz < POUNDS_FROM_OZ) return `${tenth(oz)} oz`;
  const pounds = Math.floor(oz / OZ_PER_LB);
  const rest = tenth(oz - pounds * OZ_PER_LB);
  return rest ? `${pounds} lb ${rest} oz` : `${pounds} lb`;
}

// The latest weigh-in, with the puppy's age that day: "27.8 oz at 3 weeks"
export function formatWeight(weights, born) {
  if (!weights?.length) return null;
  const latest = weights.reduce((a, b) => (b.date >= a.date ? b : a));
  if (!born) return formatOunces(latest.oz);
  return `${formatOunces(latest.oz)} at ${formatSpan(daysBetween(born, latest.date))}`;
}

// ["white", "black"] + "parti" → "White & black parti"; ["brown"] + "solid" → "Solid brown"
export function formatCoat(colors = [], pattern) {
  if (colors.length === 0) return pattern ? capitalize(pattern) : null;
  const names = colors.length === 1
    ? colors[0]
    : `${colors.slice(0, -1).join(", ")} & ${colors[colors.length - 1]}`;
  if (!pattern) return capitalize(names);
  if (pattern === "solid") return `Solid ${names}`;
  return capitalize(`${names} ${pattern}`);
}

// Moves the photo named `cover` to the front; without one, file-name order stands.
export function withCoverFirst(photos, cover) {
  const index = cover ? photos.findIndex((p) => p.name === cover) : -1;
  if (index <= 0) return photos;
  return [photos[index], ...photos.slice(0, index), ...photos.slice(index + 1)];
}

export function isLikelyBot() {
  if (navigator.webdriver) return true;
  return /bot|crawl|spider|scrape|headless|phantom|selenium|puppeteer/i.test(navigator.userAgent);
}
