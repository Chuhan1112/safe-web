# CLAUDE.md

This file records the local engineering guardrails for `web-safe`.

## Current UI Baseline

The currently approved visual baseline is the UI style around local commit `53d9e00`.

The goal is:
- keep the current look and feel
- keep the current Tailwind 3 + PostCSS toolchain
- only bring back non-visual fixes unless explicitly approved

## Do Not Change Without Explicit Visual Review

Do not casually change these files:

- `src/globals.css`
- `vite.config.ts`
- `postcss.config.js`
- `tailwind.config.js`
- `src/components/ui/calendar.tsx`

Why:

- `src/globals.css` contains the approved typography, color tokens, glass treatment, background glow, and spacing atmosphere. Large changes here quickly make the app feel like a different product.
- `vite.config.ts`, `postcss.config.js`, and `tailwind.config.js` are tied to the current Tailwind 3 setup. Upgrading to Tailwind 4 or changing plugin wiring changed the UI flavor and also broke local dev until dependencies were realigned.
- `src/components/ui/calendar.tsx` is sensitive to `react-day-picker` version differences. Changing its component API without also aligning the package version causes build failures.

## Safe Changes

Usually safe:

- shared hooks
- request caching helpers
- chart hover/date parsing helpers
- animation smoothness fixes
- skeleton components
- pure display components that do not alter visual tokens
- bug fixes that do not rewrite layout/styling systems

## Risky Changes

Treat these as product-level changes, not casual refactors:

- Tailwind major upgrades
- theme token rewrites
- global CSS refactors
- replacing Radix/shadcn-style primitives
- calendar component API changes
- chart styling rewrites

## Private Overlay Boundary

`src/private/` is for:

- real business orchestration
- private API client wiring
- business-specific pages and labels

Shared tracked code should prefer:

- generic UI primitives
- generic helpers
- reusable visual components

When in doubt, move only the most obviously generic pieces out of `src/private/`, validate both modes, and stop before touching approved styling.

## Validation Rule

After each batch of shared changes, validate:

```bash
npm test
npm run lint
npm run build
```

If testing the company-safe mode specifically, temporarily ensure `src/private/` is absent or disabled and verify the same three commands again.
