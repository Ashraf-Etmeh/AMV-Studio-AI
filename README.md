# AMV Studio AI

A local-first, AI-assisted Anime Music Video editor graduation project. The first eight frontend milestones are implemented with React, TypeScript, and Vite.

## Run on Windows

Use Node.js 22.12+ and npm. From the repository root:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173/`. PowerShell can run `npm.cmd` even when execution policy blocks `npm.ps1`. After the first install, use `npm.cmd run dev`.

## What works

- A Dashboard based on the supplied visual reference, with local artwork, workflow cards, and recent projects.
- A Projects page to create, search, rename, open, and delete local projects. The three reference samples remain available.
- A project media workspace to choose or drop music, video, and image files. Supported files can be previewed in the browser.
- Accurate file name, type, byte size, modified date, and native duration or dimensions when the browser can read them.
- Project, media, and timeline metadata saved in browser `localStorage`. New imports also save a media copy in IndexedDB so previews survive reloads in the same browser profile. Older records without a saved copy can be relinked. Relinking checks file name, size, modified date, and media kind.
- Removing a media record or local project does not delete original files.
- A Song Analysis page modeled on the supplied reference. Its waveform, lyrics, sections, BPM, emotion, and energy are labeled **demo data**; selecting segments and switching views are interactive.
- A separate **Your music** view plays imported audio from its saved browser copy. It displays real file details and makes no analysis claims.
- A Scene Library page based on the supplied reference, with five **demo scenes**, keyword search over hand-authored descriptions and tags, filters, sorting, selection, and favorites for the current visit. No semantic retrieval or scene extraction is implied.
- A separate **Your videos** view lists and previews videos imported into the project from their saved browser copies. It shows real file details and reports that no scenes have been detected.
- An AMV Planner prototype with **AI Director** and **AI Copilot** modes. Director previews and applies two hand-authored story arcs; Copilot replaces one sample visual beat at a time and can reset the draft. These changes remain in memory and do not modify imported media or create a timeline.
- A **Timeline Editor** for imported project media. Place music, video, and still images; trim, reorder, remove, and undo/redo clips. Video and stills form one ordered visual sequence, with project music alongside it. The Sequence monitor plays and scrubs the imported edit, while Source mode previews a selected file. The edit and saved media copies survive reload in the same browser profile. The sample Planner storyboard never populates this timeline.
- An **Export readiness** panel checks for picture, music, linked source files, and matching durations. **Verify saved media package** reads the saved source bytes and builds a versioned timeline/media manifest for a future processor. No render file is generated or uploaded.

The app uses browser `localStorage` for small metadata records and IndexedDB for imported media copies, with object URLs for previews. It stores no credentials or generated AI analysis. These copies can consume substantial browser quota; clearing site data or using another browser removes the saved workspace. Keep your original media files. Desktop file access and portable project storage remain future work.

The project reference samples have static illustrative titles, durations, and edited labels. They are not playable AMVs or AI output. New projects begin with no media or runtime.

Real music analysis, scene indexing, semantic retrieval, AI-generated Director/Copilot recommendations, frame-accurate playback, rendering, FastAPI, SQLite, FFmpeg, and Electron remain future work. Controls for those capabilities explain their status.

## Validation

```powershell
cd frontend
npm.cmd run check
npm.cmd run test:e2e
```

`check` runs ESLint, Vitest interaction and repository tests, TypeScript checks, and a production build. `test:e2e` runs Playwright tests in installed Microsoft Edge by default. Browser tests cover dashboard layout, project persistence and deletion, media import, saved-copy restoration and relinking, metadata, keyboard focus, Song Analysis, Scene Library, Planner, timeline editing, handoff validation, demo-data boundaries, and responsive layout. Test screenshots are saved under `frontend/test-results/`.

The original screenshots are preserved in `docs/design-references/`. Approved artwork-only crops live in `frontend/src/assets/demo/` and can be reproduced with the extraction scripts in `scripts/` on Windows. See [Dashboard milestone notes](docs/dashboard-milestone.md), [Milestone 2 notes](docs/milestone-two.md), [Milestone 3 notes](docs/milestone-three.md), [Milestone 4 notes](docs/milestone-four.md), [Milestone 5 notes](docs/milestone-five.md), [Milestone 6 notes](docs/milestone-six.md), [Milestone 7 notes](docs/milestone-seven.md), and [Milestone 8 notes](docs/milestone-eight.md) for architecture, asset provenance, and scope.

## Code map

| Location | Purpose |
| --- | --- |
| `frontend/src/app/App.tsx` | Selects Dashboard, Projects, project media, Song Analysis, Scene Library, Planner, or Timeline routes. |
| `frontend/src/pages/` | Page composition and workspace layouts. |
| `frontend/src/features/dashboard/` | Reference-based Dashboard and shared sidebar. |
| `frontend/src/features/projects/` | Project types, fixtures, dialogs, and loading hook. |
| `frontend/src/features/media/` | Media metadata types and formatting. |
| `frontend/src/features/song-analysis/` | Explicit sample analysis fixture and display helpers. |
| `frontend/src/features/scenes/` | Explicit sample scene metadata and keyword/filter logic. |
| `frontend/src/features/planner/` | Hand-authored story arcs, alternatives, and fixture checks. |
| `frontend/src/features/timeline/` | Real clip model, visual/audio sequence timing, browser playback, readiness checks, processing handoff, and undo/redo state. |
| `frontend/src/pages/SongAnalysisPage.tsx` | Song Analysis layout, sample interactions, and local audio playback. |
| `frontend/src/pages/SceneLibraryPage.tsx` | Scene Library layout, sample interactions, and local video preview. |
| `frontend/src/pages/PlannerPage.tsx` | Director/Copilot sample storyboard interactions. |
| `frontend/src/pages/TimelinePage.tsx` | Imported-media sequence/source preview, clip inspector, readiness panel, and multitrack editing layout. |
| `frontend/src/services/projectRepository.ts` | Project operations contract. |
| `frontend/src/services/localWorkspaceRepository.ts` | Browser-local project/timeline metadata, media import and relinking, retained file access, and processing bundle preparation. |
| `frontend/src/services/mediaFileStore.ts` | IndexedDB source file copies with a session fallback for unsupported environments. |
| `frontend/src/services/mediaMetadata.ts` | Reads supported image dimensions and audio/video duration from selected files. |
| `frontend/src/components/ui/` | Shared buttons and accessible dialog. |
| `frontend/src/styles/` | Shared colors, global focus treatment, and typography. |
| `frontend/tests/` | Browser flows and visual capture. |
| `backend/` | Reserved for later processing milestones. |
