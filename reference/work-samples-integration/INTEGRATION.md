# One-time: add the `/work-samples` section to michaelwegter.com

Do this once. After it is in place, every Upwork Proposal Engine run just appends
an entry to `src/data/workSamples.js` and drops a demo in `public/demos/<slug>/`.

All paths below are inside `../michaelwegter.com/`.

## 1. Copy the two new files

```
cp reference/work-samples-integration/workSamples.js  ../michaelwegter.com/src/data/workSamples.js
cp reference/work-samples-integration/WorkSamples.jsx  ../michaelwegter.com/src/pages/WorkSamples.jsx
```

## 2. Make AppFrame resolve work samples too (`src/components/AppFrame.jsx`)

Reuse the existing iframe shell for both registries. Two small edits.

Add the import near the top, next to the existing `apps` import:

```js
import { apps } from '../data/apps'
import { workSamples } from '../data/workSamples'   // ADD
```

Change the lookup line inside `AppFrame` from:

```js
const app = apps.find(a => a.id === appId || a.slug === appId)
```

to:

```js
const app = [...apps, ...workSamples].find(a => a.id === appId || a.slug === appId)
```

Nothing else in AppFrame changes. The same-origin demo at `/demos/<slug>/` means
the cross-origin auth bridge is simply unused, which is fine.

## 3. Add the routes (`src/App.jsx`)

Add the page import next to the others:

```js
import WorkSamples from './pages/WorkSamples'   // ADD
```

Then add two routes inside `<Routes>` (the `:slug` route reuses the existing
`AppFramePage`, which already reads `:slug` from the URL):

```jsx
<Route path="/work-samples" element={<WorkSamples />} />
<Route path="/work-samples/:slug" element={<AppFramePage />} />
```

## 4. Add the nav link (`src/components/Navbar.jsx`)

Desktop nav: next to the existing Experience / Resume links, add:

```jsx
<Link
  to="/work-samples"
  className={`nav-link ${isActive('/work-samples') ? 'active' : ''}`}
>
  Work Samples
</Link>
```

Mobile menu: next to the other mobile `<Link>` items, add:

```jsx
<Link to="/work-samples" className="nav-link" style={{ display: 'block', padding: '12px 0' }}>
  Work Samples
</Link>
```

## 5. Verify

```
cd ../michaelwegter.com
npm run build      # must pass
npm run dev        # visit /work-samples (empty-state until the first run)
```

Commit. From here on, the workflow appends entries automatically.

## How demos are hosted (recap)

Each demo is a same-origin static app at `public/demos/<slug>/index.html`, served
at `michaelwegter.com/demos/<slug>/` and framed by `/work-samples/<slug>`. It
ships with the normal `npm run build` and the existing GitHub Pages deploy, so a
pushed commit is the deploy. Backend-dependent demos call `api.michaelwegter.com`
(mw-backend), which is already CORS-enabled.
