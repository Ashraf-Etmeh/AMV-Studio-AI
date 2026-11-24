# Milestone 5: AMV Planner prototype

## Delivered behavior

- Every project has an AMV Planner route, linked from its media workspace, Song Analysis, and Scene Library. The page draws on the supplied timeline reference: cinematic artwork, dark editing panels, purple active states, a scene preview, a six-beat storyboard, and a right-side assistant panel.
- **AI Director** previews two hand-authored example arcs across the six sample song sections. Selecting an arc updates the preview. **Use this sample plan** copies its scene choices into an in-memory draft and opens Copilot mode.
- **AI Copilot** shows hand-written alternatives and explanations for the selected sample beat. **Use** changes that beat in the draft; **Reset draft** restores the applied example. The changed-beat count reflects the actual draft difference. The storyboard and preview respond immediately.
- Real project music and video counts appear in the sidebar, with an explicit statement that imported files are not used in the examples. The draft is not saved, and reloading restores the default example. Export explains that no render file exists.

## Architecture and provenance

`App.tsx` routes `#/projects/:id/planner` to `PlannerPage`. The page reads project/media metadata through `WorkspaceRepository` for context only. It keeps plan and draft state in React; no sample plan is written to the repository. `features/planner/samplePlans.ts` owns the two plans, editorial notes, section alternatives, scene lookup, and changed-beat count. It combines the already labeled song and scene fixtures without claiming either came from an imported file.

The banner image `frontend/src/assets/demo/planner-preview.png` is an artwork-only crop from `docs/design-references/AI-Assisted AMV Timeline Editor-4.png`, rectangle `X=408, Y=68, Width=782, Height=378`. `scripts/extract-planner-demo-art.ps1` reproduces it. Storyboard and preview stills reuse the approved Scene Library crops. No external image links are used.

The six storyboard cards represent **one example visual moment per song section**. They do not define clip in/out points, cuts, transitions, audio synchronization, or a playable edit. No model inference or confidence scores are presented.

## Validation

- `npm.cmd run check`: ESLint, 17 Vitest tests, TypeScript, and Vite production build passed. Planner fixture tests ensure every sample plan covers each section with a valid scene and editable alternative.
- `npm.cmd run test:e2e`: 12 Playwright tests passed in Microsoft Edge. The two new flows cover Director preview and application, Copilot replacement and reset, reload behavior, imported-media separation, Export disclosure, and layout overflow at 1672, 1280, and 390 px.
- [Director capture](validation/planner-1672x941.png), [Copilot capture](validation/planner-copilot-1672x941.png), [1280 px capture](validation/planner-1280x800.png), and [compact capture](validation/planner-390x844.png) were visually inspected.

## Next milestone

Build a timeline editing prototype with actual clip arrangement, selection, trimming, and undo/redo behavior. Preserve the distinction between a sample storyboard and a real edit until imported media can be placed and played from the timeline. Rendering and AI inference remain later milestones.
