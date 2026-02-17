# AI Handoff: Chameleon Finance

This file captures the latest deploy + code state so the next AI/dev can continue without re-discovery.

## 1. Project Snapshot

- Name: `chameleon-finance`
- Repo remote: `https://github.com/KunanonJ/abdull-finance.git`
- Branch: `main`
- Production domain: `https://chameleon-finance.pages.dev`
- Latest production deployment: `https://b5d73bf3.chameleon-finance.pages.dev`
- Latest deploy id: `b5d73bf3-4874-4f81-a20b-39b31aff3873`
- Cloudflare account id used for deploy: `187ab61ed9dbc6e616cb23e6b95aa8f1`
- Updated at: `2026-02-17`

## 2. What Was Changed Most Recently

### Security: logo token removal from client
- Removed hardcoded `LOGO_API_TOKEN` from client constants.
- Added backend proxy endpoint for logos:
  - `functions/api/logo/[domain].js`
- Added shared helper to build proxy URL:
  - `src/shared/lib/logo.js`
- Updated UI components to use `/api/logo/:domain` (no client-side token in requests).
- Existing exposed token value was scrubbed from source files/docs and must remain revoked.

### Performance: code splitting
- Added lazy loading and `Suspense` for heavy sections and modals in:
  - `src/App.jsx`
- Added Vite chunking strategy in:
  - `vite.config.js`

### Server-side storage path (optional)
- Added helper client for backup/restore via existing R2 API:
  - `src/shared/lib/serverStorage.js`
- Added Settings UI for token-based cloud backup/restore:
  - `src/features/settings/SettingsModal.jsx`
- Current model:
  - localStorage remains primary
  - server backup is opt-in

### Test additions
- Added CSV parser + recurring detection tests:
  - `src/shared/lib/csvParser.test.js`
- Added Sheets sync hook tests:
  - `src/features/sync/useSheetsSync.test.js`

## 3. Deploy Runbook (Cloudflare Pages)

### Build
```bash
npm run build
```

### Deploy (explicit account selection needed)
```bash
CLOUDFLARE_ACCOUNT_ID=187ab61ed9dbc6e616cb23e6b95aa8f1 \
npx wrangler pages deploy dist --project-name=chameleon-finance --commit-dirty=true
```

### Verify latest deployment
```bash
CLOUDFLARE_ACCOUNT_ID=187ab61ed9dbc6e616cb23e6b95aa8f1 \
npx wrangler pages deployment list --project-name=chameleon-finance
```

## 4. Required Runtime Secrets

- `LOGO_DEV_API_TOKEN`
  - Used only by `functions/api/logo/[domain].js`
  - Must be set in Cloudflare Pages/Workers environment
  - Must not be committed into source

For local testing:
- `.dev.vars.example` exists
- create `.dev.vars` from it with real values

## 5. Known Issues / Caveats

- Build warning still appears:
  - `%VITE_CLOUDFLARE_ANALYTICS_TOKEN% is not defined in /index.html`
  - non-blocking for deploy, but should be configured cleanly.
- Vitest currently fails to run in this environment due local `jsdom` package issue:
  - missing `node_modules/jsdom/lib/generated/idl/utils.js`
  - tests added but not fully executed in this environment.
- Wrangler requires explicit account id when multiple Cloudflare accounts are present.

## 6. Files to Read First for Continuation

- `src/App.jsx` (lazy loading / app shell)
- `functions/api/logo/[domain].js` (logo proxy endpoint)
- `src/shared/lib/logo.js` (logo URL normalization/proxy)
- `src/features/settings/SettingsModal.jsx` (server backup/restore UI)
- `src/shared/lib/serverStorage.js` (R2 backup client helpers)
- `src/features/sync/useSheetsSync.test.js` and `src/shared/lib/csvParser.test.js` (new tests)
