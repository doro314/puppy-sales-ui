# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## TODO: Migrate to Supabase (database-driven)

Currently all puppy data is hardcoded in `src/data/puppies.jsx` and images are bundled at build time via `import.meta.glob`. Below is a step-by-step plan to migrate to Supabase (free tier).

### 1. Create a Supabase project

- Go to https://supabase.com and sign up (free)
- Create a new project — note your **Project URL** and **anon public API key**

### 2. Create the database tables

Run this SQL in the Supabase SQL editor:

```sql
-- Litter / "all" entry
create table litters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  mom text,
  dad text,
  birth_date date,
  litter_size int,
  ready_to_adopt_date date,
  vaccinations text,
  deworming_date date,
  vet_checked boolean,
  litter_description text
);

-- Individual puppies
create table puppies (
  id uuid primary key default gen_random_uuid(),
  litter_id uuid references litters(id),
  name text not null,
  icon text,          -- 'paw-blue' | 'paw-pink' | null
  folder text,        -- kept for reference; images come from storage
  sex text,
  color text,
  pattern text,
  weight_value text,
  weight_as_of date,
  personality text,
  available boolean
);
```

### 3. Set up Supabase Storage for images

- In the Supabase dashboard go to **Storage → New bucket**
- Name it `puppy-images`, set it to **Public**
- Upload each puppy's photos into a folder matching their name (e.g. `honda/photo1.jpg`)
- Image URLs will follow the pattern:
  `https://<project-ref>.supabase.co/storage/v1/object/public/puppy-images/<folder>/<filename>`

### 4. Install the Supabase JS client

```bash
npm install @supabase/supabase-js
```

### 5. Add environment variables

Create a `.env` file at the project root (never commit this):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 6. Replace `src/data/puppies.jsx`

Replace the hardcoded `categories` export with a fetch function:

```js
import { supabase } from '../lib/supabase';

export async function fetchCategories() {
  const { data: litter } = await supabase.from('litters').select('*').single();
  const { data: puppies } = await supabase.from('puppies').select('*').order('name');

  // Build the "all" entry
  const all = {
    id: 'all',
    name: 'Our Litter',
    icon: null,
    folder: null,
    details: {
      breed: litter.breed,
      mom: litter.mom,
      dad: litter.dad,
      birthDate: litter.birth_date,
      litterSize: litter.litter_size,
      readyToAdoptDate: litter.ready_to_adopt_date,
      vaccinations: litter.vaccinations,
      dewormingDate: litter.deworming_date,
      vetChecked: litter.vet_checked,
      litterDescription: litter.litter_description,
    },
  };

  const puppyCategories = puppies.map((p) => ({
    id: p.name,
    name: p.name,
    icon: p.icon,
    folder: p.folder,
    details: {
      sex: p.sex,
      color: p.color,
      pattern: p.pattern,
      weightAsOf: { value: p.weight_value, asOf: p.weight_as_of },
      personality: p.personality,
      available: p.available,
    },
  }));

  return [all, ...puppyCategories];
}
```

### 7. Replace `src/data/imageLoader.jsx`

Instead of `import.meta.glob`, fetch image URLs from Supabase Storage:

```js
import { supabase } from '../lib/supabase';

export async function getImagesByFolder() {
  const { data: files } = await supabase.storage.from('puppy-images').list('', {
    limit: 200,
    offset: 0,
  });

  const folders = {};

  // List each puppy subfolder
  for (const folder of files.filter((f) => !f.metadata)) {
    const { data: images } = await supabase.storage
      .from('puppy-images')
      .list(folder.name);

    folders[folder.name] = images.map(
      (img) =>
        supabase.storage
          .from('puppy-images')
          .getPublicUrl(`${folder.name}/${img.name}`).data.publicUrl
    );
  }

  return folders;
}
```

### 8. Update `App.jsx` (or wherever data is consumed)

Anywhere `categories` or `getImagesByFolder()` are imported synchronously, wrap them in `useEffect` + `useState`:

```js
const [categories, setCategories] = useState([]);

useEffect(() => {
  fetchCategories().then(setCategories);
}, []);
```

### 9. Contact Form

The contact form in `src/components/ContactForm.jsx` currently submits to **Formspree**. You have two options:

---

#### Option A — Keep Formspree (easiest, no code changes)

Formspree handles email delivery for you. Free tier allows 50 submissions/month.

1. Sign up at https://formspree.io
2. Click **New Form**, name it (e.g. "Puppy Inquiry")
3. Copy the form ID from the endpoint URL — e.g. `https://formspree.io/f/abcd1234` → ID is `abcd1234`
4. Open `src/components/ContactForm.jsx` and replace:
   ```js
   const FORMSPREE_ID = "YOUR_FORM_ID";
   ```
   with your actual ID:
   ```js
   const FORMSPREE_ID = "abcd1234";
   ```
5. Verify your email in Formspree so submissions are delivered
6. (Optional) Enable spam filtering / reCAPTCHA in the Formspree dashboard

That's it — no other changes needed.

---

#### Option B — Route submissions through Supabase (no third-party dependency)

Use this if you want all data (puppies + inquiries) in one place, or if you exceed Formspree's free limit.

**Step 1 — Create an `inquiries` table in Supabase:**

```sql
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  submitted_at timestamptz default now()
);

-- Allow anonymous inserts (public form), block reads from the client
alter table inquiries enable row level security;
create policy "Allow anonymous insert" on inquiries for insert with check (true);
```

**Step 2 — Update `ContactForm.jsx`:**

Replace the `handleSubmit` fetch block:

```js
// Before (Formspree)
const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(fields),
});
if (res.ok) { ... }
```

With a Supabase insert:

```js
import { supabase } from '../lib/supabase'; // add this import at the top

// Inside handleSubmit, replace the fetch block:
const { error } = await supabase.from('inquiries').insert([fields]);
if (!error) {
  setStatus("success");
  setFields({ name: "", email: "", message: "" });
} else {
  setStatus("error");
}
```

You can also remove the `FORMSPREE_ID` constant and the `Accept` / fetch import if nothing else uses them.

**Step 3 — Set up email notifications (optional but recommended):**

Supabase doesn't send emails on its own. Add a free notification layer:

- **Supabase Edge Function + Resend**: Create an edge function triggered on new `inquiries` rows, then send email via https://resend.com (free tier: 3,000 emails/month)
- **Zapier / Make (free tier)**: Watch the `inquiries` table via webhook and send a Gmail/email notification — no code required

---

### 10. Checklist

- [ ] Supabase project created
- [ ] SQL tables created and seeded with current puppy data
- [ ] Storage bucket created and images uploaded
- [ ] `.env` file created with Supabase URL + anon key
- [ ] `.env` added to `.gitignore`
- [ ] `src/lib/supabase.js` created
- [ ] `src/data/puppies.jsx` replaced with async fetch version
- [ ] `src/data/imageLoader.jsx` replaced with storage fetch version
- [ ] `App.jsx` updated to use `useEffect` for async data loading
- [ ] Test locally with `npm run dev`
- [ ] Deploy (Vercel / Netlify — add env vars in their dashboard)
