# Milestone 7: local sequence preview and export checks

## Delivered behavior

- The saved Timeline edit can be played and scrubbed in a **Sequence monitor**. It shows the active imported video or still image and plays the imported music track alongside it. A separate **Source** mode retains the selected clip preview for inspection and trimming.
- Video and still clips now form one ordered visual sequence. They remain visible on their respective lanes, positioned at their actual sequence times. Music clips form an independent audio sequence that starts at zero. Reordering across video and still lanes changes visual playback order. Video source audio is muted in the monitor so project music is the audible track.
- Play, pause, scrub, clip-boundary switching, and a timeline playhead use a local browser clock. Active native media elements follow that clock and seek when they drift. Selecting or editing a clip pauses playback and moves the playhead to that clip.
- An **Export readiness** panel checks that the edit has a visual sequence, music, accessible source files, and matching full lengths. It reports specific missing items, including files that need relinking after reload. Passing these checks does **not** produce a render or promise compatibility with a future encoder.

## Architecture and scope

`features/timeline/sequence.ts` calculates visual/audio durations, the active clips at a playhead time, and readiness results from real project metadata and current file access. `useSequencePlayback.ts` owns the local preview clock. `SequenceMonitor.tsx` displays actual imported media and synchronizes the active video and audio elements. `editing.ts` now treats video and stills as one visual ordering group while keeping music separate. `TimelinePage.tsx` integrates the mode switch, transport, playhead, and readiness panel.

The preview depends on the browser's media decoding and is not frame-accurate editing or a rendered AMV. It does not create a video file, mix source video audio, or add transitions, effects, gaps, or AI recommendations. Project files still require relinking after reload. The preview uses imported files only; the hand-authored Planner examples remain separate. No new artwork or external image links were added.

## Validation

- `npm.cmd run check` passed: ESLint, 23 Vitest tests, TypeScript, and Vite production build. New pure tests cover mixed video/still ordering, active source-time mapping, duration boundaries, and readiness conditions.
- `npm.cmd run test:e2e` passed in Microsoft Edge: 15 browser flows. The new flow imports two images and music, matches lengths, plays across the image boundary while music continues, pauses, switches to Source mode, then confirms reload blocks playback until relinking.
- [Desktop sequence capture](validation/sequence-1672x941.png), [1280 px capture](validation/sequence-1280x800.png), and [compact capture](validation/sequence-390x844.png) were inspected. The document has no horizontal overflow at those sizes; the timeline scrolls inside its own panel.

## Next milestone

Design durable local project/media access and a processing handoff so a later FFmpeg renderer can use the saved edit. Rendering must validate actual sources and produce an explicit file before Export is presented as available.
