# Mermaid Viewer

A minimal Mermaid diagram playground built with Vite + React + HeroUI + Tailwind and Monaco Editor.

## Features

- Monaco Editor with custom Mermaid syntax highlighting
- Live preview (mermaid@11)
- Shareable URLs (compressed in the hash)
- Export: SVG and PNG (origin‑clean, background aware)
- Copy: code, SVG, PNG
- Adjustable split view (editor | preview), persisted between sessions
- Dark/light theme

## Local development (macOS)

```bash
# Node 20+, pnpm 9
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
pnpm build
pnpm preview
```

## GitHub Pages deployment

A workflow at `.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages.

- Triggers: push to `main`/`master`, or manual `workflow_dispatch`.
- Vite base path is set automatically in `vite.config.ts` when running in GitHub Actions:
  `/<repo>/` for project pages. For a custom domain you can set base to `/`.

### First‑time setup

1. Push this repository to GitHub.
2. Settings → Pages → Build and deployment: GitHub Actions.
3. Push to `main` and the site will be published.

## Keyboard shortcuts

- Copy code: ⌘C (via button)
- Save `.mmd`: ⌘S (via button)

## Notes

- PNG export uses a data URL to avoid tainted canvas security errors.
- Split handle bounds: 20–80%.

## License

MIT
