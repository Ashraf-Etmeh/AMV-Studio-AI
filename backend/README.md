# Backend

Reserved for a later FastAPI and FFmpeg media-processing milestone. No backend service is implemented yet.

Milestone 8 defines the browser-side input contract in
`frontend/src/features/timeline/processingHandoff.ts`. `ProcessingManifest` version 1
contains the project ID/name, placed visual and music durations, one entry per used
source, and ordered clips with source in/out times and sequence start times. The
companion `ProcessingBundle` holds the actual source `Blob`s. `processingFormData`
serializes both as multipart fields (`manifest` JSON and repeated `media` files named
by media ID). The Timeline's **Verify saved media package** action builds and reads
this bundle locally; it does not send it to a server.

A renderer must independently validate the manifest and uploaded bytes, probe and
decode sources, enforce resource limits, compose the visual and music streams, write
an output file, and report its path or download URL before the UI can offer Export.
