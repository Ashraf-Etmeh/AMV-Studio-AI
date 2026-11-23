# Dashboard milestone: design and architecture

## Scope

Milestone 1 implements the approved Dashboard and supporting dialogs only. It establishes visual primitives and an interface for project metadata; it does not create the later editing workspaces.

## Reference interpretation

The Dashboard's 1672×941 reference has a roughly 305 px fixed sidebar, a 320 px cinematic hero, three illustrated workflow cards, and a recent-project row. Dark navy backgrounds, softly bordered panels, purple gradients, subtle cyan details, and image-rich compositions are preserved. Branding is consistently AMV Studio AI.

The song-analysis reference suggests a project-navigation shell with preview, waveform, segment table, and intelligence inspector. The scene-library reference emphasizes a media browser, scene grid, selected-scene preview, and search inspector. The timeline reference uses a full-width editor shell, central preview, recommendation panel, and dense tracks. Those layouts should share tokens and UI controls while keeping their own panel structure.

System typography uses Segoe UI with Arial/sans-serif fallbacks. All fonts are local. The exact typeface from the raster references was not supplied, so typography is a close practical match rather than a claim of pixel identity.

## Asset provenance

All implemented artwork comes from `docs/design-references/Anime AMV Studio Dashboard-1.png`. The user approved extracting artwork-only regions. The originals remain unchanged. To reproduce assets on Windows, run `scripts/extract-demo-art.ps1` with PowerShell.

Coordinates are source pixels, with the origin at the top left:

| Asset | x, y | Width × height |
| --- | --- | --- |
| Hero | 1055, 0 | 617 × 317 |
| Sidebar illustration | 0, 470 | 305 × 471 |
| Analyze Song artwork | 338, 343 | 416 × 161 |
| Scene Library artwork | 785, 343 | 416 × 161 |
| Generate AMV artwork | 1231, 343 | 416 × 161 |
| Beneath the Sky thumbnail | 629, 724 | 318 × 82 |
| Fragments of Us thumbnail | 979, 724 | 317 × 82 |
| Last Summer thumbnail | 1328, 724 | 317 × 82 |

The hero uses the clean right-hand image region with a CSS gradient/mask blend. Thumbnails use tighter crops to exclude baked-in duration labels. Their composition and resolution differ from standalone original artwork; replace only with explicitly approved local art when available. Buttons, labels, durations, borders, navigation, and dialog controls are rendered elements, not screenshot hit areas. Lucide SVGs serve as interface icons only.

## Decisions

- Feature components and CSS Modules keep Dashboard composition separate from shared primitives.
- CSS custom properties centralize colors, surfaces, typography, radius, and sidebar sizing.
- A `ProjectRepository` async contract separates rendering from storage. The current adapter owns an in-memory list; a future FastAPI adapter can fulfill the contract. No speculative backend implementation exists.
- A project hook handles loading, errors, create, and rename. Ordinary React state handles dialogs and menus. A global store is unnecessary at this size.
- A discriminated union allows one active dialog at a time. Native HTML dialogs provide the modal top layer; explicit initial focus, focus restoration, and Tab handling make behavior consistent. Search fields also dismiss on Escape.
- Routing is deferred until the second actual page. Current navigation opens clearly scoped dialogs, so there are no empty pages or broken routes.
- The reference's three projects retain fixture provenance even if renamed. New drafts have unknown duration and no media rather than invented sample values.
- Sample edited timestamps are static. They are not calculated from the machine's clock and do not represent real activity.

## Validation approach

Repository tests cover validation, mutation isolation, session separation, and rename behavior. Component tests cover user flows and repository error handling. Playwright checks actual Edge behavior, local image loading, console errors, external requests, horizontal overflow, focus, keyboard operation, and reset on reload.

Visual QA compares captured screenshots with the supplied reference at its native viewport and checks the two additional approved desktop widths. A 390 px-wide capture additionally checks compact reflow. The small demo label and session notice are intentional disclosures absent from the original image.

### Completed validation

- ESLint: passed.
- Vitest: 10 of 10 tests passed.
- TypeScript and Vite production build: passed.
- Playwright in headless Microsoft Edge: 3 of 3 tests passed.
- All eight images loaded; no browser console errors or external HTTP requests were observed.
- No horizontal overflow at 1672×941, 1440×900, 1280×800, or 390×844. Shorter desktop windows use normal vertical scrolling.
- Native-size and resized screenshots were visually inspected. [Reference-size capture](validation/dashboard-1672x941.png), [1440 px capture](validation/dashboard-1440x900.png), [1280 px capture](validation/dashboard-1280x800.png), [compact capture](validation/dashboard-390x844.png).
- The embedded browser preview service was unavailable. Automated Edge tests and saved screenshots supplied browser validation; opening an embedded user-facing preview was not verified.

Observed differences from the supplied design: the product name is standardized, a system font is used, the clean hero crop is enlarged and blended, thumbnail crops exclude baked-in duration labels, and visible demo/session disclosures are added. No numerical pixel-perfect match is claimed.

## Next milestones

1. Projects and media intake, with a separate persistence decision.
2. Song Analysis interface using visibly labeled fixtures.
3. Scene Library and filtering interface using labeled fixtures.
4. AI Director/Copilot proposal interactions with sample sequences.
5. Timeline editing prototype with measurable editing and undo/redo behavior.

Real media processing and inference need their own plan, provenance, job/error contracts, and backend tests. Desktop packaging follows a working application. None of these later milestones is implemented by Dashboard approval.
