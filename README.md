# web-safe

`web-safe` is a company-safe front-end workspace extracted from the private project.

What stays here:

- shared UI primitives
- layout and interaction experiments
- mock data and placeholder copy
- local-only front-end workflows

What does not belong here:

- private endpoints
- business logic
- formulas, ranking rules, or parameter names
- research notes and internal reports

## Start

```bash
node -v  # recommended: Node 20 or 22
npm install
npm run dev
```

## Safety rule

If a screen, label, payload, or test name can reveal how the private system works, keep it in the private repo instead of this package.
