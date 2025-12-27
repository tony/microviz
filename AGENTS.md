# AGENTS.md

This file provides guidance to AI agents (including Codex CLI, Cursor, and other LLM-powered tools) when working with code in this repository.

## Git Commit Standards

Format commit messages as:
```
commit-type(Component/File[Subcomponent/method]) Concise description

why: Explanation of necessity or impact.
what:
- Specific technical changes made
- Focused on a single topic
```

Notes:
- `commit-type` is always lowercase.
- `Component/File` should usually be lowercase; use proper capitalization only when it’s a proper name (e.g. a class like `UniversalFlashcardWrapper`).

Common commit types:
- **feat**: New features or enhancements
- **fix**: Bug fixes
- **refactor**: Code restructuring without functional change
- **docs**: Documentation updates
- **chore**: Maintenance (dependencies, tooling, config)
- **test**: Test-related updates
- **style**: Code style and formatting
- **js(deps)**: Dependencies
- **js(deps[dev])**: Dev Dependencies
- **ai(rules[AGENTS])**: AI rule updates

Example:
```
feat(lib[youtube]) Support YouTube Shorts URLs

why: Users often paste Shorts links; embeds should just work.
what:
- Detect `/shorts/<id>` URL pattern
- Convert Shorts URLs to `youtube.com/embed/<id>`
- Add tests for common Shorts URL variants
```
For multi-line commits, use heredoc to preserve formatting:
```bash
git commit -m "$(cat <<'EOF'
feat(Component[method]) add feature description

why: Explanation of the change.
what:
- First change
- Second change
EOF
)"
```

## Tooling

| Tool | Purpose | Config Location |
|------|---------|-----------------|
| pnpm | Package manager, workspace orchestration | `pnpm-workspace.yaml` |
| Biome | Linting + formatting (replaces ESLint/Prettier) | `biome.json` |
| Vite | Dev server, production builds | `vite.config.ts` per package |
| Vitest | Unit + integration tests | `vitest.config.ts` |
| Playwright | Visual regression, E2E | `playwright.config.ts` |

## Commands

```bash
pnpm install              # Install dependencies
pnpm docs                 # Docs site (Astro/Starlight)
pnpm --filter @microviz/demo dev  # Demo app (Vite)
pnpm build                # Build all packages
pnpm test                 # Run Vitest (unit + integration)
pnpm --filter @microviz/demo test:visual  # Visual regression (Vitest browser + Playwright)
pnpm lint                 # Biome check
pnpm lint:fix             # Biome fix
pnpm format               # Biome format
```

## CDN Build

The `@microviz/elements` package includes a pre-bundled ESM file at `dist/cdn/microviz.js` with all dependencies (`@microviz/core`, `@microviz/renderers`) inlined. This enables direct browser import without esm.sh or import maps.

**Build commands:**
```bash
pnpm --filter @microviz/elements build      # Standard ESM (externals preserved)
pnpm --filter @microviz/elements build:cdn  # CDN bundle (deps inlined, ~54KB gzip)
pnpm --filter @microviz/elements build:all  # Both builds
```

**CDN URLs (after npm publish):**
- `https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js`
- `https://unpkg.com/@microviz/elements/cdn/microviz.js`

**Design decision (2025-12-20):** ESM-only, no UMD/IIFE. React 19 dropped UMD in 2024; ESM has 93%+ browser support. All major sandboxes (CodePen, JSFiddle, StackBlitz) support `<script type="module">`.

**Known limitation:** Claude Artifacts only allows `cdnjs.cloudflare.com`. Other CDNs (esm.sh, jsdelivr, unpkg) are blocked by its CSP.

## Monorepo Structure

This is a layered monorepo. Packages have strict dependency directions:

```
themes-tailwind → themes
elements → renderers → core
demo → { elements, renderers, core, themes }
site → { core, elements, renderers, themes, themes-tailwind }
```

**core** has zero runtime dependencies. It must remain Worker-safe and SSR-safe.

## Architectural Constraints

### Do

- Keep `core` deterministic: same inputs → same outputs
- Use OffscreenCanvas for text measurement (works in Workers + SSR)
- Return `RenderModel` as serializable data, not DOM nodes
- Use `patchRenderModel` + `createModelIdAllocator` for overlay-style model edits
- Use `a11y.summary` + `a11y.items` in the model; elements own ARIA + keyboard focus
- Prefer chart-specific `a11y.items` in chart definitions when labels are clear
- Use CSS custom properties (`--mv-*`) for theming
- Wrap library styles in `@layer microviz`
- Use `ElementInternals` for accessibility in Web Components
- Ship ESM only (`"type": "module"`)
- Use Tailwind v4's CSS-first config (`@theme`, `@source`, `@import`) in stylesheets
- Treat `tailwind.config.js` / `tailwind.config.ts` as forbidden (this repo does not use them)

### Do Not

- Import DOM APIs in `core` or `renderers`
- Use CommonJS or UMD formats
- Create JavaScript theme config files (Tailwind v4 is CSS-native)
- Add `tailwind.config.js` / `tailwind.config.ts` (Tailwind v4 config lives in CSS)
- Fight specificity with `!important`—use `@layer` instead
- Add polyfills—target Baseline 2025
- Make `themes` depend on Tailwind (`themes-tailwind` is separate)

### HTML Renderer Policy (Experimental)

- HTML renderer is parity-deferred: **rect/circle/line/text only**.
- `path` marks are ignored; SVG/Canvas remain the source of truth for paths.
- Supported defs: `linearGradient` (rect fills), `clipRect` (rect clipPath), `pattern`, `mask`, and `filter` (dropShadow/gaussianBlur only).
- Other defs remain ignored when unsupported.
- Mark effects ignored when unsupported: `mask`, `filter`, `strokeDash` (clipPath only via `clipRect`).
- Demo/UI must **not** auto-fallback to other renderers; show warnings loudly and allow incomplete output so gaps are visible.
- Keep `RenderModel` renderer-agnostic; do not add HTML-specific fields.

## Key Types

```typescript
// The canonical contract between layers
type RenderModel = {
  width: number;
  height: number;
  marks: Mark[];
  defs?: Def[];
  layers?: Layer[];
  a11y?: A11yTree;
  stats: ModelStats;
};

// Interaction state flows IN to computeModel, not stored internally
type InteractionState = {
  hoveredMarkId?: string;
  selectedMarkIds?: string[];
  focusedMarkId?: string;
};
```

## Testing Strategy

| Tier | Scope | Runner | Speed |
|------|-------|--------|-------|
| 0 | Core unit tests, RenderModel snapshots | Vitest (Node) | <3s |
| 1 | Element structure, attribute handling | Vitest + happy-dom | Fast |
| 2 | Visual regression (curated set) | Playwright | Slower |
| 3 | CDN/framework integration | Playwright | Optional |

When adding features:
1. Start with Tier 0 tests for pure computation
2. Add Tier 1 tests for element behavior
3. Add Tier 2 screenshot only for new visual patterns

## Styling Patterns

### Base CSS (no Tailwind dependency)

```css
@layer microviz {
  .mv-bar {
    fill: var(--mv-series-1);
  }
}
```

### Tailwind v4 integration

```css
@import "tailwindcss";

@theme {
  --color-mv-series-1: oklch(0.65 0.2 250);
}

@layer microviz {
  .mv-bar {
    @apply fill-mv-series-1;
  }
}
```

### User overrides (always win)

```css
/* Outside @layer = higher specificity */
.mv-bar {
  fill: red;
}
```

## Web Component Patterns

```typescript
class MicrovizChart extends HTMLElement {
  static observedAttributes = ["data", "type"];
  #internals: ElementInternals;
  #shadow: ShadowRoot;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.#internals.role = "graphics-document";
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.adoptedStyleSheets = [sharedStyles];
  }

  attributeChangedCallback() {
    this.render();
  }
}
```

## SSR Pattern (Declarative Shadow DOM)

```html
<microviz-sparkline data="[1,2,3]">
  <template shadowrootmode="open">
    <style>@layer microviz { ... }</style>
    <svg>...</svg>
  </template>
</microviz-sparkline>
```

## Common Tasks

**Adding a new chart type:**
1. Add computation logic in `core` (returns marks)
2. Ensure it's covered by existing renderers
3. Create Web Component in `elements`
4. Add CSS classes to `themes/base.css`
5. Extend Tailwind tokens in `themes-tailwind` if needed

**Adding a theme token:**
1. Add CSS custom property to `themes/base.css`
2. Add corresponding `@theme` entry in `themes-tailwind`
3. Document in README

**Debugging blank renders:**
Check `model.stats.warnings` for diagnostics:
- `BLANK_RENDER`: Chart produced no marks
- `NAN_COORDINATE`: Invalid data produced NaN
- `MARK_OUT_OF_BOUNDS`: Marks outside viewport
- `EMPTY_DATA`: No data provided
