# Milestone 3: Song Analysis interface

## Delivered behavior

- Each project has a Song Analysis route, linked from its media workspace. The page follows the supplied Song Analysis reference: project workflow rail, anime art preview, waveform and section strip, tabbed analysis area, and right-side Song Intelligence and Music Structure panels.
- **Demo analysis** is a hand-authored fixture based on the visual reference. The waveform, six sections, sample lyrics, BPM, energy, emotion scores, and beat markers are illustrative. Buttons select sections; tabs show structure, markers, and an emotion curve. The marker checkbox and density slider only change their display.
- **Your music** is a separate view for imported audio. It plays a real local track using the browser's audio control while an in-session file URL is available. It reports the stored filename, size, and decoded duration, or explains when relinking is needed. It explicitly states that no analysis has been inferred from that file.
- Workflow steps whose functionality is not implemented open a status dialog. The Anime Library step opens the existing media workspace.

## Architecture and asset provenance

`App.tsx` routes `#/projects/:id/analysis` to `SongAnalysisPage`. The page reads project and media records through `WorkspaceRepository`, keeping storage details outside the UI. Demo values live in `features/song-analysis/sampleAnalysis.ts`; they are never written into project records or presented as results for imported music. Local playback uses the repository's temporary object URL and the browser's native audio control.

The artwork in `frontend/src/assets/demo/song-preview.png` is an artwork-only crop from `docs/design-references/Neon Memories AMV Song Analysis UI-2.png`. `scripts/extract-song-demo-art.ps1` reproduces it from rectangle `X=270, Y=155, Width=426, Height=250`. The crop contains no reference UI controls or text. No external image URL is used.

The page has its own CSS module for the reference-specific layout and reuses shared colors, type, icons, buttons, dialogs, and project media contracts. At narrow widths the workflow rail collapses to icons, panels stack, and the lyric table scrolls sideways with a visible hint.

## Validation

- `npm.cmd run check`: ESLint, 15 Vitest tests, TypeScript, and Vite production build passed.
- `npm.cmd run test:e2e`: eight Playwright tests passed in Microsoft Edge. The Song Analysis tests cover section and tab interaction, marker controls, responsive overflow, imported audio, the explicit demo/local boundary, and relinking after reload.
- [Reference-size capture](validation/song-analysis-1672x941.png) and [narrow-window capture](validation/song-analysis-390x844.png) were visually inspected. The reference-size layout closely follows the supplied design's panel proportions, colors, and artwork.

## Next milestone

Build the Scene Library screen from the supplied reference, with local media browsing and clearly labeled sample search/scene metadata. Real scene detection, embeddings, semantic retrieval, and media processing will require later backend milestones.
