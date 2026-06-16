# Deployment Spec — puppy-sales-ui

## Phase 1 — Repo cleanup
- [ ] Add `/dist` to `.gitignore`
- [ ] Untrack dist from git: `git rm -r --cached dist/`
- [ ] Commit the cleanup

## Phase 2 — Replace puppy data

### `src/data/puppies.jsx`
Replace the entire `categories` array with real data.

**Litter entry (`id: "all"`)** needs:
- `breed`, `mom`, `dad`, `birthDate`, `litterSize`
- `readyToAdoptDate` — controls "Available Soon" state for all puppies
- `vaccinations`, `dewormingDate`, `vetChecked`
- `litterDescription` — paragraph shown below the stat grid

**Each puppy entry** needs:
- `id` / `name` — must match across the object
- `icon` — `"paw-blue"` (male) or `"paw-pink"` (female)
- `folder` — must exactly match the image subfolder name under `src/images/`
- `details.sex`, `details.color`, `details.pattern`
- `details.weightAsOf` — `{ value: "X lbs", asOf: "YYYY-MM-DD" }`
- `details.personality`
- `details.available` — `true` | `false` | `null` (null hides status badge)

### `src/images/`
- Delete old test folders: `honda/`, `rosa/`, `cece/`, `sparky/`, `barkly/`
- Create one folder per real puppy (name must match `folder` field above)
- Add photos to each folder — Vite picks them up automatically
- Empty folder = "Photos coming soon" (intentional, OK to leave empty temporarily)

### `public/`
- Replace `Coco.jpg` with real mom photo (keep filename, or update reference in `ImageGallery.jsx`)
- Replace `Leo.jpg` with real dad photo (same rule)

### `src/App.jsx` lines 45–46
Confirm or update:
- Site title: `"Doro Family Puppies"`
- Tagline: `"Lovingly raised, family bred"`

## Phase 3 — Contact form (Formspree)
- [ ] Sign up at https://formspree.io
- [ ] Create a new form named "Puppy Inquiry"
- [ ] Copy the form ID from the endpoint URL (e.g. `https://formspree.io/f/abcd1234` → `abcd1234`)
- [ ] Replace `"YOUR_FORM_ID"` in `src/components/ContactForm.jsx` line 13
- [ ] Verify email in Formspree so submissions are delivered

## Phase 4 — Deployment config
- [ ] Create `public/_redirects` containing: `/* /index.html 200`
  - Required for Cloudflare Pages SPA routing (direct URL loads return index.html instead of 404)

## Phase 5 — Cloudflare Pages (one-time browser setup)
- [ ] Create free account at cloudflare.com → Pages
- [ ] Connect to Git → authorize GitHub → select `puppy-sales-ui` repo
- [ ] Configure build:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `NODE_VERSION = 22`
- [ ] Deploy → get free `*.pages.dev` URL
- [ ] (Optional) Attach custom domain in Pages dashboard

## Phase 6 — QA checklist
- [ ] All puppy photos load in each gallery
- [ ] "Inquire About [name]" button pre-fills the contact form with correct puppy name
- [ ] Submit a real test inquiry and confirm it arrives in email (Formspree)
- [ ] Mobile: sidebar collapses to accordion
- [ ] Adopted puppies show "Meet Another Pup" CTA
- [ ] `?parents=true` URL param shows parent section on Litter Info tab

---

## Who does what

| Step | Owner |
|------|-------|
| Git / dist cleanup | Claude |
| `_redirects` file | Claude |
| Real puppy data in `puppies.jsx` | You provide data → Claude updates file |
| New image folders (create) | Claude |
| Puppy photos (add to folders) | You |
| Delete old test image folders | Claude |
| Parent photos (`Coco.jpg`, `Leo.jpg`) | You replace files |
| Formspree form ID | You get it → Claude plugs it in |
| Cloudflare Pages account + connect | You (browser UI) |
| Header title / tagline | You confirm or provide new text |
