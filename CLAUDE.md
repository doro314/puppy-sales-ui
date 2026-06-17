# Application Build Constitution

Conventions for React + Vite applications. These are defaults — override per-project when the problem genuinely demands it, but don't deviate without a reason.

---

## Stack

- **React 19** — function components only, no class components
- **Vite** — build tool and dev server
- **Vitest** — tests in `*.test.jsx` files colocated with source
- **TypeScript** — preferred for apps with significant logic or multiple contributors; plain JS is fine for small, self-contained projects
- **React Router** — use `useSearchParams` / `useNavigate` for URL state; avoid complex route trees unless the app genuinely needs them
- **State management** — start with lifted state in React; only introduce Context or an external library when prop drilling becomes a real problem across many layers
- **CSS approach** — global CSS + BEM naming works well for small apps; switch to CSS Modules when the app grows past ~10 components or class name collisions become a maintenance concern

---

## File & Folder Structure

```
src/
  App.jsx          — root layout and lifted state
  App.css          — global styles shared across the app
  index.css        — body/base reset only; nothing else goes here
  index.jsx        — entry point; no logic here
  utils.js         — pure, stateless helper functions (no React imports)
  components/
    Icons.jsx      — reusable SVG icon components
    FeatureA.jsx   — self-contained components
    FeatureA.css   — only when the component needs isolated styles
  data/
    entities.jsx   — static data + query functions (getAll, getById, etc.)
    loaders.jsx    — external data fetching or Vite glob imports
  images/
    <folder>/      — one folder per entity, matched to data definitions
```

### File naming

- **Components** — PascalCase: `ContactForm.jsx`, `PuppyDetails.jsx`
- **Utilities / data** — camelCase: `utils.js`, `imageLoader.jsx`
- **CSS** — match the component name: `ContactForm.css`

---

## CSS Architecture

### Three layers — respect the separation

| File | Purpose |
|------|---------|
| `index.css` | `body` reset and font stack only |
| `App.css` | All shared/global component styles |
| `ComponentName.css` | Only when a component is truly self-contained |

### Naming convention

```
.component-element            — base element
.component-element--modifier  — variant of that element
```

Use `--` for modifiers, `-` for element nesting. Keep names scoped to their component context to avoid global collisions.

### CSS custom properties for theming

Dynamic values flow through CSS variables set on a wrapper element via the `style` prop:

```jsx
<div style={{ "--accent-color": accentColor }}>
```

```css
.my-element { color: var(--accent-color, #fallback); }
```

Always provide a fallback value inside `var()`. Never hardcode a value that should be dynamic.

### Responsive strategy — mobile-first

Mobile is the baseline. Desktop enhancements go in `@media (min-width: 768px)` blocks. Group all responsive overrides together, either at the bottom of the file or inline after each rule set — be consistent within a project.

```css
/* Mobile — baseline */
.layout { display: flex; flex-direction: column; }

/* Desktop */
@media (min-width: 768px) {
  .layout { flex-direction: row; }
}
```

### Button hover pattern

```css
.button {
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}
.button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  filter: brightness(1.08);
}
.button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
```

---

## JSX Conventions

### Component declarations

Always use function declarations for named components:

```jsx
// ✅
function MyComponent({ value, onChange }) { ... }

// ❌
const MyComponent = ({ value }) => { ... }
```

Arrow functions are fine for tiny anonymous inline components defined inside another file.

### Prop destructuring

Always destructure in the function signature:

```jsx
// ✅
function Card({ title, subtitle, accentColor = "#8a9bb0" }) { ... }

// ❌
function Card(props) { const { title } = props; ... }
```

### Prop naming conventions

Consistent prop names make components predictable without reading their internals:

| Prop type | Convention | Examples |
|-----------|------------|---------|
| Event callbacks | `onX` | `onChange`, `onSubmit`, `onNavigate` |
| Boolean flags | `isX` / `hasX` | `isLoading`, `isOpen`, `hasError` |
| Uncontrolled defaults | `defaultX` | `defaultValue`, `defaultOpen` |

Avoid vague names like `data`, `info`, or `value` when something more specific is possible.

### Early returns over nested conditionals

Return early for guard conditions — it flattens the component and makes the happy path obvious:

```jsx
// ❌ nested and hard to scan
function UserCard({ user, isLoading }) {
  return (
    <div>
      {isLoading ? <Spinner /> : user ? <Profile user={user} /> : <Empty />}
    </div>
  );
}

// ✅ each case is clear
function UserCard({ user, isLoading }) {
  if (isLoading) return <Spinner />;
  if (!user) return <Empty />;
  return <Profile user={user} />;
}
```

### Avoid nested ternaries

If a ternary needs another ternary inside it, extract to a variable or use early returns:

```jsx
// ❌ hard to parse
const label = isLoading ? "Loading…" : hasError ? "Error" : "Done";

// ✅ readable
let label = "Done";
if (isLoading) label = "Loading…";
else if (hasError) label = "Error";
```

### Conditional className

```jsx
className={`base-class${isActive ? ' base-class--active' : ''}`}
```

### Dynamic CSS variables

```jsx
<div className="card" style={{ "--card-color": accentColor }}>
```

### Conditional rendering

`&&` for show/hide:
```jsx
{isError && <p className="error-message">Something went wrong.</p>}
```

Ternary for either/or:
```jsx
{isSuccess ? <SuccessState /> : <form>...</form>}
```

### Keys

Always use a stable, unique value — never array index. Prefer natural IDs or content-derived keys.

### Import ordering

Keep imports in this order, with a blank line between groups:

```js
import { useState } from 'react';               // 1. React
import { useNavigate } from 'react-router-dom'; // 2. Third-party

import MyComponent from './MyComponent';         // 3. Local components/utils
import { formatKey } from '../utils';

import './MyComponent.css';                      // 4. CSS last
```

---

## Component Architecture

### Co-location rule

| Situation | Where it lives |
|-----------|---------------|
| Used by one parent only | Same file as that parent, defined above it |
| Used by two or more files | Own file in `components/` |
| No React dependency | `utils.js` |
| Reusable SVG icon | `Icons.jsx` |

### When to split a component

Extract a sub-component when any of these are true:
- The JSX block exceeds ~80–100 lines
- A section has clearly unrelated concerns from its siblings
- The same structure appears in more than one place

Don't split just because a component feels large — cohesion matters more than line count.

### Data flow

Lift state to the nearest common ancestor. Pass values and callbacks down as props. Avoid Context or external libraries until prop drilling genuinely becomes a problem.

```
App.jsx (state owner)
  ├── handleAction → passed as onAction prop
  ├── ComponentA (reads state, calls onAction)
  └── ComponentB (reads different state slice)
```

### Exports — named vs default

- **Components** → default export (one per file)
- **Utils, Icons, data query functions** → named exports only

```js
// components/Card.jsx
export default function Card() { ... }

// utils.js
export function formatDate() { ... }
export function formatKey() { ... }

// Icons.jsx
export function IconClock() { ... }
export function PawSvg() { ... }
```

Named exports are explicit and refactor-friendly — your editor can rename them across the codebase. Default exports are conventional for components because there's only ever one thing to import from a component file.

### Feature flags

Simple boolean constants at the top of the owning file:

```js
const SHOW_FEATURE = true;
```

---

## Icon System (`Icons.jsx`)

**Reusable icons** — used in two or more places — are exported from a single `Icons.jsx` file:

```jsx
export function IconClock({ className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" ...>...</svg>
  );
}
```

**One-off decorative SVGs** used in exactly one place can stay inline in the component — extracting them to `Icons.jsx` just creates indirection with no benefit.

For icons with a variable color, accept it as a prop with a sensible default:

```jsx
export function PawSvg({ className, fill = "currentColor", ...props }) {
  return <svg fill={fill} className={className} {...props}>...</svg>;
}
```

---

## Extracting Helpers Out of Components

Before writing a function inside a component file, ask: **is this function truly specific to this component, or is it just living here by accident?**

Functions accumulate inside component files naturally as features grow. Periodically review component files and extract anything that doesn't belong there. A component file should read as component logic — not a collection of utilities that happen to be nearby.

### Extraction hierarchy

| The function… | Where it belongs |
|---------------|-----------------|
| Is pure, no React, could be used anywhere | `utils.js` |
| Is a reusable SVG used in 2+ places | `Icons.jsx` |
| Is a reusable component used in 2+ places | Own file in `components/` |
| Is only used in this one component | Top of the same file, above the component |

### Signs a function should be extracted

- It has no dependency on component props, state, or hooks
- It appears in more than one file (even copy-pasted)
- The component file is hard to scan because helper definitions bury the component itself
- You could unit test it in isolation without rendering anything

### What stays in the component file

- Event handlers (`handleSubmit`, `handleChange`) — they close over state setters
- Derived values computed from props/state (`const hasErrors = ...`)
- Sub-components used only by this parent — defined above the parent, not inside it

```js
// ❌ this belongs in utils.js, not at the top of ContactForm.jsx
function formatDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ✅ this stays in ContactForm.jsx — it closes over component state
const handleSubmit = async (e) => {
  e.preventDefault();
  if (hasErrors) { setSubmitAttempted(true); return; }
  ...
};
```

---

## Utils (`utils.js`)

Only pure functions with no React or component dependency:

```js
// ✅ good candidates
export function formatDate(str) { ... }
export function formatKey(key) { ... }
export function validate(fields) { ... }

// ❌ not for utils.js — anything that imports React, uses hooks, or returns JSX
```

---

## Form Validation Pattern

Three-state validation: per-field `touched` (on blur) + `submitAttempted` (on failed submit). Errors only surface after the user has interacted with a field or tried to submit.

```js
const [touched, setTouched] = useState({ name: false, email: false });
const [submitAttempted, setSubmitAttempted] = useState(false);

const errors = validate(fields);
const showError = (field) => (touched[field] || submitAttempted) && errors[field];

const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));

const handleSubmit = (e) => {
  e.preventDefault();
  if (Object.keys(errors).length > 0) { setSubmitAttempted(true); return; }
  // submit
};
```

Per-field error display with accessibility:
```jsx
<input aria-invalid={!!showError("name")} aria-describedby="name-error" />
{showError("name") && <span id="name-error" role="alert">{errors.name}</span>}
```

Reset state on success:
```js
setTouched({ name: false, email: false });
setSubmitAttempted(false);
```

---

## Constants Over Magic Values

Named constants make code scannable and changes safe — update one place instead of hunting for every occurrence.

```js
// ❌ magic values scattered through the code
if (window.innerWidth < 768) { ... }
setTimeout(fn, 5000);
const color = icon === "paw-blue" ? "#4a90d9" : "#e91e8c";

// ✅ named constants
const MOBILE_BREAKPOINT = 768;
const POLL_INTERVAL_MS = 5000;
const GENDER_COLORS = { "paw-blue": "#4a90d9", "paw-pink": "#e91e8c" };
```

Constants shared across files go in `utils.js` or a dedicated `constants.js`. Constants used only in one file go at the top of that file, above the component.

---

## Code Hygiene

### Comments — only the why

Write a comment only when the code can't explain itself: a hidden constraint, a non-obvious workaround, or a subtle invariant. Never narrate what the code does — the code already does that.

```js
// ❌ narrating the obvious
// Loop through categories and filter available ones
const available = categories.filter(c => c.details?.available);

// ✅ explaining a non-obvious constraint
// Append T00:00:00 to force local-time parsing — bare date strings parse as UTC in V8
const d = new Date(value + "T00:00:00");
```

### Dead code — delete it, don't comment it out

Commented-out code is noise that makes files harder to read and creates false trails for future editors. If you're removing something, remove it completely. Git history preserves it if you ever need it back.

```js
// ❌
// const oldHandler = () => { ... };
// function legacyFormat(val) { return val.trim(); }

// ✅ just delete it
```

---

## Data Layer (`data/`)

Keep data and query logic in `data/` files. Components import query functions, never the raw data directly. This keeps the data shape internal and makes future refactors (e.g. swapping static data for an API) a one-file change.

```js
// data/items.jsx
const items = [ ... ];

export function getItems() { return items; }
export function getItemById(id) { return items.find(i => i.id === id); }
```
