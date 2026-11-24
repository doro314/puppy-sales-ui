# Doro Family Puppies — owner's manual

Everything about the litters lives in one file, **`src/data/litters.json`**. Photos live in folders under **`src/images/`**. Edit them, push to `main`, and the site updates itself.

New to this? Start with the step-by-step tutorial, **[docs/data-tutorial.html](docs/data-tutorial.html)**. Open it in a browser; it has a practice editor that checks what you type exactly the way the real build does.

---

## Edit in VS Code

Open `litters.json` in VS Code. It reads `litters.schema.json` (the list of every field and allowed value) on its own, with nothing to install:

- **Suggestions:** press **⌃ Space** (Control-Space) inside quotes to see the allowed values, each explained.
- **Templates:** press **⌃ Space** inside a list to insert a whole **New litter** or **New puppy**.
- **Mistakes:** a value that isn't allowed is underlined the moment you type it. Hover for the reason.

## Add a litter

1. In `"litters": [ … ]`, put the cursor right after the opening `[` and press **⌃ Space → New litter**. Newest goes first: Home leads with the first listed litter.
2. Fill in the id (`2027-01-coco-leo`: year, month, mom, dad), the breed, the parents and the `due` date.
3. Make its photo folder, `src/images/2027-01-coco-leo/`. The litter's own photos go straight in it; each puppy gets a subfolder later.

Until it has puppies, Home says *"Coco is expecting · Due Jan 12"* and offers the waitlist.

## When the puppies arrive

1. Add `"born"` and `"readyDate"` to the litter.
2. Inside the litter's `"puppies": [ ]`, press **⌃ Space → New puppy** for each one. `slug` is the puppy's web address and folder name: lowercase, no spaces (`bella`, `mr-pickles`).
3. Make a folder per puppy, `src/images/2027-01-coco-leo/bella/`, and drop in photos. An empty folder shows "Photos coming soon".

## Every week

- **Weight:** add a line to the puppy's `"weights"` list: `{ "date": "2027-02-14", "oz": 31.5 }`. The page shows the latest as *"31.5 oz at 5 weeks"*.
- **Care:** add to the litter's `"care"` list: `{ "type": "dewormed", "date": "2027-02-07" }`. Each kind of step gets its own tile on Home the day it's added. The kinds are `vet-check`, `dewormed`, `vaccinated` (add a `"note"`, e.g. `"First DHPP"`) and `microchipped`.
- **Photos:** drop them in the puppy's folder.

## Reserved, adopted

Change the puppy's `"status"` to one of:

- `available`: shows the Inquire button. Before the litter's `readyDate`, the badge says *"Ready Jul 28"* by itself.
- `reserved`: the deposit is paid. The page points visitors to the littermates still available.
- `adopted`: gone home.

Once every puppy is reserved or adopted, Home says *"Every puppy has a home"* and offers the list for the next litter. The $100 deposit banner hides on its own.

## Retire a litter

Set `"listed": false`. It disappears from the site, but nothing is deleted. Old links to its puppies say they've gone home. At least one litter must stay listed, so keep a sold-out litter listed until the next one is in.

## Photos

- **Formats:** JPEG, PNG, GIF, WebP and AVIF. iPhone **HEIC** photos can't be shown in browsers. Export them as JPEG, or set *Settings → Camera → Formats → Most Compatible*.
- **Order:** photos show in file-name order, so the first file leads.
- **Choosing the lead photo:** to lead with another photo without renaming files, set `"cover": "IMG_1876.jpeg"` on the puppy (or the litter). The name must match exactly, capitals included.
- **Sizes:** the build makes small copies of every photo, and the originals stay untouched.
- **Parents:** their photos go in `src/images/parents/` and only ever show as small round icons.

## When the build says no

Every push is checked first. If something in `litters.json` is wrong, the build stops, **the live site stays as it was**, and the message says where and what to type. The most common ones:

| Message | What to do |
|---|---|
| `"Available" isn't an allowed value … Did you mean "available"?` | Values are lowercase. Use the suggestion. |
| `"2027-2-7" doesn't fit. Write dates as YYYY-MM-DD` | Two-digit months and days: `2027-02-07`. |
| `Should be a plain number, like 31.5 — not "31.5 oz"` | Weights are numbers in ounces, no quotes. |
| `The slug "bella" is already used in 2026-06-coco-leo` | Slugs are unique across every litter. Try `bella-2`. |
| `"IMG_1876.jpg" isn't in src/images/…  The file there is "IMG_1876.JPEG"` | Copy the file name exactly. |
| `This isn't valid JSON … missing or extra comma` | Check the line it names for a missing or extra comma or quote. |
| `No litter has "listed": true` | Keep at least one litter listed. |

Warnings (a puppy without photos yet, a HEIC file) don't stop anything.

## Going live

Push to `main`. Cloudflare builds the site and publishes it in a minute or two. A push that fails the check isn't published. Check the result on GitHub, on the commit's status check.

To see changes before pushing, run `npm run dev` and open http://localhost:5173. Any data problem shows in the terminal and as a red overlay in the browser.

---

## For developers

| Command | |
|---|---|
| `npm run dev` | Dev server, with the data check on save |
| `npm run build` | Production build (stops on bad data) |
| `npm test` | The test suite, including a check of the real `litters.json` and photos |

- **Data layer:** components read the data only through the query functions in `src/data/puppies.jsx`. `src/data/checkLitters.js` is the checker (pure). `scripts/puppyDataPlugin.js` runs it in the build and dev server.
- **Addresses:** `/` is Home, `/bella` is a puppy, `/contact?about=bella` or `?about=waitlist` is the form.
- **Hidden switches:** `?parents=true` shows the parents' photos large on Home. `?count` shows the visit counter in the footer.
- **Settings:** the deposit amount is `DEPOSIT_AMOUNT` in `src/utils.js`. Inquiries go to the Formspree form whose ID is in `src/components/ContactForm.jsx`.
- **Why it's built this way:** the decisions and their alternatives are in `docs/puppy-data-options.html` and `docs/site-design-options.html`.
- **Measuring:** `scripts/measure/measure.mjs` measures layouts in headless Chrome against a production build (it blocks the live visit counter).
