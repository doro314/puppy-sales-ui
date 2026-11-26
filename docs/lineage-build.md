# DNA lineage card — build plan

Decided Nov 25, 2026. Visual reference: **`docs/lineage-card.html`**, open it beside this file.

## What we're building

A collapsible **"DNA-confirmed Havapoo pairing"** card in the litter card on Home. It uses Bear's Wisdom Panel test, from Coco & Leo's first litter, as proof of the pair's Poodle × Havanese lineage, which every puppy from Coco × Leo shares.

- **Closed (default):** seal, headline, subtitle, breed bar, and a "What this means for every puppy" link.
- **Open:** the breakdown (Poodle 47% / Havanese 37% / Bichon family 13% / Other 3%), three points about every puppy, and a "Tested: Bear" row with his photo.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Puppy page or litter? | **Litter card on Home** | The claim is about the pair, not one puppy. |
| What's guaranteed? | **The lineage** ("Poodle × Havanese"), never the percentages | One puppy's test shows the pair's line. It can't promise every puppy is 84%. The percentages are always credited to Bear. |
| How robust? | **Simple:** one `lineage` block on the litter | One result from one pair. Copy the block into each new Coco × Leo litter by hand (about 9 lines). |
| Bear's first litter | **Not** re-added to `litters.json` | Not needed: his name and photo live in the `lineage` block. |
| Link to the report? | **No:** a footnote-style reference instead | Bear's owners hold the report. A small numbered citation names the test and the puppy, and links the test's name to its site. That's enough to back the claim. |
| Collapsing | Native `<details>` / `<summary>` | No state, works without script, keyboard accessible. |
| Where in the card | Last thing in `.litter-card-panel`, after `LitterDetails` | "More about the litter" keeps opening right under its link. |

Rejected for now (explored in `dna-options.html`, `litter-dna-options.html`, `lineage-options.html`): DNA on puppy pages, a tile among the care tiles, littermate comparison, and auto-matching tested puppies across litters by mom and dad. Revisit if Coco and Leo or more puppies get tested.

## Before you ship

- [ ] **Bear's owners are okay** with his name and photo on the site. If not: leave out `photo`, and set `tested` to something like "a puppy from Coco & Leo's first litter".
- [ ] Optional: confirm the percentages against the full Wisdom Panel report once they share access. The numbers here come from a screenshot of the Ancestry tab.

## Build steps

### 1. Photo
Copy one photo of Bear into the parents folder, which only ever shows small round icons:

```
~/Pictures/BEAR/IMG_2018.JPG  →  src/images/parents/bear.jpg
```

It shows as a 38 px rounded square (`object-fit: cover`), so the original size doesn't matter. The build makes the small copies.

### 2. Data: `src/data/litters.json`
Add to the `2026-06-coco-leo` litter, after `facts`:

```json
"lineage": {
  "source": "Wisdom Panel",
  "sourceUrl": "https://www.wisdompanel.com",
  "tested": "Bear",
  "testedFrom": "Coco & Leo's first litter",
  "photo": "bear.jpg",
  "breeds": { "poodle": 47, "havanese": 37, "bichon": 13, "other": 3 }
}
```

From the report: Poodle 45 (toy/mini) + 2 (medium/standard) = 47 · Havanese 37 · Bichon family 13 (Bichon Frise 5, Bolonka 3, Maltese 3, Bolognese 2) · Other 3 (Chihuahua 2, Lhasa Apso 1).

While you're in there, fix the typo `"Rabbies-1yr"` → `"Rabies-1yr"`, because it shows on the live site.

### 3. Schema: `src/data/litters.schema.json`
The litter has `"additionalProperties": false`, so the build rejects `lineage` until the schema knows it. Add a definition under `definitions`:

```json
"lineage": {
  "type": "object",
  "description": "A DNA test that confirms the parents' lineage. Copy it into each new litter from the same mom and dad.",
  "required": ["source", "tested", "breeds"],
  "additionalProperties": false,
  "properties": {
    "source": { "$ref": "#/definitions/text", "description": "The test, e.g. Wisdom Panel." },
    "sourceUrl": { "type": "string", "pattern": "^https://", "description": "The test's main website. The footnote links the test's name to it, e.g. https://www.wisdompanel.com." },
    "tested": { "$ref": "#/definitions/text", "description": "The puppy who was tested, e.g. Bear." },
    "testedFrom": { "$ref": "#/definitions/text", "description": "Which litter, e.g. Coco & Leo's first litter." },
    "photo": { "type": "string", "description": "A file in src/images/parents/, shown as a small square beside the tested puppy's name." },
    "breeds": {
      "type": "object",
      "required": ["poodle", "havanese", "bichon", "other"],
      "additionalProperties": false,
      "description": "Whole percentages that add up to 100.",
      "properties": {
        "poodle": { "type": "integer", "minimum": 0, "maximum": 100, "description": "All poodle sizes together." },
        "havanese": { "type": "integer", "minimum": 0, "maximum": 100 },
        "bichon": { "type": "integer", "minimum": 0, "maximum": 100, "description": "Bichon Frise, Bolonka, Maltese, Bolognese." },
        "other": { "type": "integer", "minimum": 0, "maximum": 100 }
      }
    }
  }
}
```

…and to the litter's `properties`:

```json
"lineage": { "$ref": "#/definitions/lineage" }
```

### 4. Checker: `src/data/checkLitters.js` (two small additions)
In `checkRules`, inside the `litters.forEach`:

```js
const breeds = litter.lineage?.breeds;
if (breeds) {
  const total = Object.values(breeds).reduce((sum, n) => sum + n, 0);
  if (total !== 100) add(ctx, 'errors', [...lp, 'lineage', 'breeds'], `The breeds add up to ${total}%, not 100%.`);
}
```

In `checkFiles`, next to the parent photo check:

```js
if (litter.lineage?.photo) needFile(files.parents, litter.lineage.photo, 'src/images/parents/', [...lp, 'lineage', 'photo'], ctx);
```

### 5. Data layer: `src/data/puppies.jsx`
```js
export function getLineagePhoto(lineage) {
  return lineage.photo ? getPhoto("parents", lineage.photo) : null;
}
```

### 6. Component: `src/components/LineageCard.jsx` + `LineageCard.css`
- Default export `LineageCard({ lineage })`. LitterCard renders it only when `litter.lineage` exists.
- In `LitterCard.jsx`, place it as the last child of `.litter-card-panel`, after `{isOpen && <LitterDetails …/>}`.
- The seal SVG stays inline in the component, since it's used in one place only (per CLAUDE.md). The chevron can come from `Icons.jsx` if one exists, otherwise inline.
- Constants at the top of the file:
  ```js
  const BREED_GROUPS = [
    ['poodle', 'Poodle', '#2c3e50'],
    ['havanese', 'Havanese', '#b07a46'],
    ['bichon', 'Bichon family', '#d8c3a0'],
    ['other', 'Other', '#a9b6c4'],
  ];
  ```
  These colors stay clear of the pink and blue that mean female and male. Pass them to the bar with `style={{ '--seg': color, width: `${pct}%` }}`.
- Styles: copy the `.lin*`, `.cert-*`, `.seal`, `.dna-bar` rules from `docs/lineage-card.html` into `LineageCard.css`. Rename them to BEM, e.g. `.lineage`, `.lineage-summary`, `.lineage-bar`.

**Copy, exactly:**

| Where | Text |
|---|---|
| Headline | DNA-confirmed Havapoo pairing |
| Subtitle | Poodle × Havanese · {source} (plain text, not a link, so tapping the header only opens and closes the card) |
| Closed link | What this means for every puppy |
| Breakdown rows | Poodle {poodle}% · Havanese {havanese}% · Bichon family *(Havanese's close cousins)* {bichon}% · Other {other}%, one row each with its color swatch |
| Section heading | What this means for every puppy |
| Point 1 ✓ | Every puppy is half {mom}, half {dad}, so they all come from this same Poodle × Havanese line. |
| Point 2 ✓ | Applies to this litter and every future {mom} × {dad} litter. |
| Point 3 (i, grey) | Each puppy's exact percentages vary a little, like siblings in any family. |
| Proof row | **Tested: {tested}¹** / {testedFrom} on the line below. No percentages here: they're in the breakdown. |

Bar `aria-label`: "{poodle + havanese}% Poodle and Havanese, {bichon}% Bichon family, {other}% other".

**No link to the report.** The source is cited quietly, the way a paper cites a reference:

- A tiny superscript **1** after "Tested: {tested}" in the proof row (`<sup>`, light grey `#a3b0be`, about half size). It marks the evidence, and the footnote sits right below it.
- One line at the very bottom of the open card, under the proof row, with no rule above it, in 10.5px light grey `#a3b0be`:

> ¹ [{source}]({sourceUrl}), breed ancestry results for {tested}.

For example: "¹ <u>Wisdom Panel</u>, breed ancestry results for Bear." "Wisdom Panel" links to `sourceUrl` and opens in a new tab (`target="_blank" rel="noopener"`). The link keeps the footnote's grey (`color: inherit`), and the only change is an underline (`text-underline-offset: 2px`). Without `sourceUrl`, the name shows as plain text.

**Wider screens** (checked in `docs/lineage-card.html` → "Wider screens"):
- 1100 px and up: the card sits in the column beside the gallery (about 360 px), so it looks the same as on a phone. Nothing extra needed.
- 768–1100 px: the card runs the full content width. Add one rule so the percentages stay next to their names:
  ```css
  @media (min-width: 768px) {
    .lineage-breeds { max-width: 420px; }
  }
  ```
  (The breed list's class, whatever it's named in `LineageCard.css`.) A two-column layout was tried at this width and rejected: it squeezed "Bichon family" onto two lines.

### 7. Tutorial sync and tests
The tutorial carries a copy of the schema and checker, so run:

```
node scripts/syncTutorial.js
npm test
```

`npm test` fails until the sync is done. Consider adding one test each for `LineageCard` (closed by default, opens on summary click) and the checker (a total that isn't 100 → error).

### 8. Check, then ship
1. `npm run dev` → http://localhost:5173. Check the card closed and open at phone, tablet (~900 px) and desktop widths against the mockup.
2. `npm run build` passes.
3. Commit, push to `main`. Cloudflare publishes in a minute or two.

### 9. README: add under "Every week" or as its own section

> **DNA lineage**
> The litter's `"lineage"` block shows the "DNA-confirmed Havapoo pairing" card on Home. It belongs to the parents, so when Coco and Leo have a new litter, copy the whole block into it unchanged. A litter from different parents gets no `lineage` until one of its puppies, or its parents, is tested. The four `breeds` numbers must add up to 100.

…and in "For developers → Why it's built this way", add `docs/lineage-build.md`.
