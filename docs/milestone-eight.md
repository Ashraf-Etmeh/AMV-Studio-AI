# Milestone 8: retained media and processing handoff

## Delivered behavior

- New imported music, videos, and images are copied into IndexedDB in the current browser profile. The existing `localStorage` project, media, and timeline metadata format remains readable. On startup, the repository matches each media record to a saved file copy and restores its preview URL. Playback and previews therefore survive reloads in the same profile.
- A media record with no matching copy, including records created before this milestone, remains visible and can be relinked from the original file. Relinking replaces the saved copy after checking the name, byte size, modified date, and media kind. Removing a record or local project also requests removal of its saved copies; original files on disk are untouched.
- Timeline **Verify saved media package** checks the saved edit, reads each source copy, checks its byte length against the record, and reports the number of clips, source files, and total source size. It does not render, upload, or claim a finished AMV.

## Architecture and contract

`services/mediaFileStore.ts` isolates IndexedDB file operations from workspace metadata. It stores source `Blob`s by media ID in database `amv-studio-ai:media:v1`, object store `files`. Environments without IndexedDB use an in-memory session store. The workspace repository waits for file-store startup before listing/importing media, and rolls back a new stored copy if the accompanying metadata write fails.

`features/timeline/processingHandoff.ts` defines `ProcessingManifest` schema version 1. It carries the project ID and name, visual and audio durations, one entry for each used source, and ordered clips with source in/out times and computed sequence starts. `ProcessingBundle` pairs that manifest with the source bytes. `processingFormData` can package it as multipart `manifest` JSON plus repeated `media` parts named by media ID. This is an input contract for future processing, not an implemented API or export format. A future FastAPI/FFmpeg service must validate all submitted fields and bytes again, probe media, render the edit, and return an actual output file before Export becomes available.

Browser profile storage has quota limits and can be cleared by the user or browser. Project and source copies do not move to another device or browser. The originals should be kept. Metadata and file bytes use separate browser stores, so an interrupted write or failed cleanup can leave a record needing relink or an orphaned copy; a later desktop persistence layer should provide stronger transaction and recovery behavior.

## Validation

- `npm.cmd run check` passed: ESLint, 25 Vitest tests, TypeScript, and Vite build. Repository tests cover retained bytes, processing manifest/multipart packaging, and failed file writes.
- `npm.cmd run test:e2e` passed in Microsoft Edge: 15 browser flows. Reload checks now verify retained image, video, and audio previews; a missing saved copy is relinked and restored. A playable edit verifies its saved media package and keeps Export unavailable.
- [Desktop handoff capture](validation/handoff-1672x941.png) and the existing responsive timeline captures were inspected. The handoff control fits within the readiness panel without changing the reference-based dark editor layout.

## Next milestone

Build the first real local processing service with Python/FastAPI and FFmpeg once that toolchain is available. It should accept and independently validate the versioned handoff, render supported still/video/music edits into a file, expose progress and errors, and enable download only after a successful output. Browser storage can remain an interim source provider until a desktop file store is implemented.
