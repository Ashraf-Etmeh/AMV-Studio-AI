# Milestone 4: Scene Library interface

## Delivered behavior

- Every project has a Scene Library route linked from its media workspace and Song Analysis page. The screen follows the supplied Scene Library reference: studio top navigation, project/media rail, rich anime scene cards, selected-scene detail, and a search/filter/results rail.
- **Demo scenes** contains five hand-authored sample records. Keyword search matches sample titles, descriptions, tags, and a small explicit synonym list. Emotion, action, character, maximum motion, sorting, layout selection, and demo favorites work locally. The result count is the actual number of matching sample records. Favorites last for the current page visit.
- **Your videos** is separate from the sample data. It lists videos imported into the current project and plays a selected file through the browser when the session still has access. After reload it directs the user to relink the original file in Media. It displays the file's saved size, duration, and dimensions and clearly says no scenes, tags, or search index have been extracted.
- Automatic scene detection, semantic search, confidence scores, and scene-level playback are not implemented or simulated as inference.

## Architecture and asset provenance

`App.tsx` routes `#/projects/:id/scenes` to `SceneLibraryPage`. The page reads real project and media metadata through `WorkspaceRepository`; it does not create inferred scene records for imported files. Demo records and the pure keyword/filter function live in `features/scenes/sampleScenes.ts`, separate from the user workspace. No backend API, database migration, or media processing is introduced.

`scripts/extract-scene-demo-art.ps1` reproducibly crops five artwork-only stills from `docs/design-references/Neon Anime Scene Library Interface-3.png` into `frontend/src/assets/demo/`. The rectangles are: crying `(305,684,459,183)`, confrontation `(624,125,290,132)`, sunset `(934,125,288,132)`, reaching `(304,411,342,119)`, and reunion `(667,411,340,119)`. They exclude screenshot controls and labels. The page uses no external image links.

The page uses a CSS module and shared color tokens, buttons, icons, and media contracts. At narrower widths the card grid changes from three to two to one column; the rail collapses to icons and search moves below the cards. This keeps the document within the viewport width.

## Validation

- `npm.cmd run check`: ESLint, 15 Vitest tests, TypeScript, and Vite production build passed.
- `npm.cmd run test:e2e`: ten Playwright tests passed in Microsoft Edge. The two new tests cover keyword and filter results, favorites, view switching, narrow-window overflow, local video playback, the demo/local boundary, and relinking after reload. The video test records a short WebM in the browser and reuses the same temporary file when relinking.
- [Reference-size capture](validation/scene-library-1672x941.png), [1280 px capture](validation/scene-library-1280x800.png), and [compact capture](validation/scene-library-390x844.png) were visually inspected against the supplied dark navy, neon purple, cyan, and anime-art reference.

## Next milestone

Prototype AI Director and AI Copilot proposal interactions with explicitly labeled sample sequences. Real clip recommendations and editing decisions will require later processing and provenance contracts.
