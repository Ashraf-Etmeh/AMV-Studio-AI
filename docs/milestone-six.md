# Milestone 6: local timeline editing prototype

## Delivered behavior

- Each project now has a real Timeline Editor at `#/projects/:id/timeline`, linked from Media, Song Analysis, and the sample AMV Planner.
- Imported audio, video, and still-image records can be placed on matching tracks. Audio/video need a duration the browser can read; stills start at an editable five seconds. The editor never copies sample Planner scenes into a real project edit.
- A clip can be selected, previewed from its original local file, trimmed to a source in/out range (or still duration), reordered within its track by drag or Move buttons, and removed. Tracks are sequential with no gaps. The preview plays only the selected source clip and pauses at its out point.
- Undo/redo covers timeline edits for the current page visit, including keyboard Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y. The current edit is saved after each successful change. Reloading restores clips and trim ranges, with a fresh undo history.
- Timeline metadata is stored alongside project and media records in the existing browser workspace record. Older version 1 records without timelines still load. Removing a media record or project removes its timeline references in the same saved update. Media bytes remain on disk, so the original file must be relinked in Media after reload to restore preview.

## Architecture and decisions

`features/timeline/editing.ts` holds the clip model, track-specific duration and position calculations, validated trim/reorder operations, and undo/redo transitions. `TimelinePage.tsx` composes the reference-inspired editing layout and saves a change before showing it as committed. `Timeline.module.css` provides the three-column desktop workbench and horizontally scrollable tracks. `localWorkspaceRepository.ts` validates clip references against the project's media and persists only clip IDs, source ranges, and track types.

The editor uses project files and deliberately shows no generated waveform, beat markers, scene scores, or AI recommendations. The supplied timeline screenshot informed the dark navy panels, purple and cyan accents, media browser, central preview, inspector, ruler, and tracks. No additional artwork or external image links were introduced.

The current timeline is an edit plan, not a playable or rendered AMV. Video and still tracks are separate, and there is no synchronized sequence playback, gaps, transitions, effects, captions, or export. Real AI analysis, FastAPI, FFmpeg processing, SQLite, and Electron remain outside this milestone.

## Validation

- `npm.cmd run check` passed: ESLint, 21 Vitest tests, TypeScript, and Vite production build. New unit tests cover trim bounds, track independence, order, history, older record loading, persistence, and reference cleanup.
- `npm.cmd run test:e2e` passed: 14 Microsoft Edge flows. New flows cover imported stills, drag and button reorder, trimming, undo/redo, reload, relinking, music placement, and music trim persistence.
- [Desktop capture](validation/timeline-1672x941.png), [1280 px capture](validation/timeline-1280x800.png), and [compact capture](validation/timeline-390x844.png) were visually inspected. The page has no document-wide horizontal overflow at these sizes; the timeline itself scrolls horizontally.

## Next milestone

Connect sequence playback to placed clips, resolve mixed video/still layers and timing, and introduce explicit export readiness checks before rendering. Keep AI recommendations separate until real inference exists.
