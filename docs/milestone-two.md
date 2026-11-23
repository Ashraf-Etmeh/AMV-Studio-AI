# Milestone 2: projects and local media intake

## Delivered behavior

- Project metadata persists in browser `localStorage`, including new projects and renames. A dedicated Projects page supports search, opening a workspace, and deleting user-created project records after an in-app confirmation.
- The project workspace accepts locally selected or dropped audio, video, and image files. It groups files by kind, supports name search, and previews supported formats while the selected `File` remains available in the current page session.
- The browser reads the file's actual name, MIME type, byte size, modified timestamp, and native media duration or image/video dimensions when decodable. Missing or unreadable duration/dimensions are shown as unknown.
- Metadata records persist after reload. Since browser file input grants temporary access, previews show **Relink required** after reload. Relinking asks for the original file and checks its name, size, modified timestamp, and media kind before restoring preview access. These checks identify likely matches, though they are not a cryptographic content hash.
- Removing a media record or deleting a local project changes only the browser workspace. The source files are untouched. Reference sample projects cannot be deleted.

## Architecture

`App.tsx` uses a small hash route selector for Dashboard, Projects, and a project media workspace. This keeps direct reloads on a project URL working without a server router or new dependency. The project UI continues to depend on the async `ProjectRepository` interface. `WorkspaceRepository` adds media operations; the browser-local implementation is isolated in `localWorkspaceRepository.ts`.

The storage document uses a versioned key, `amv-studio-ai:workspace:v1`. It contains plain JSON for projects and media details. The repository validates loaded records, commits changes to storage before updating its in-memory state, and returns copies to callers. If saved data cannot be read, the app displays a recovery message and leaves it untouched.

Selected `File` objects are represented by object URLs only in memory. Import and relink create them; record removal or project deletion revokes them. The browser releases the remainder on page exit. No large media blobs are copied into `localStorage`.

`mediaMetadata.ts` loads image or native audio/video metadata from object URLs, with an eight-second fallback if the browser cannot decode a format. The product does not claim scene detection, music understanding, or inferred tags at this stage.

## Validation

- ESLint, TypeScript, Vite production build, and 15 Vitest tests pass.
- Six Playwright tests pass in Edge. They cover the Dashboard, browser-local persistence, project creation/rename/search/delete, file selection, accurate image dimensions, native audio duration, relinking after reload, mismatch rejection, record removal, and narrow-window overflow.
- [Projects capture](validation/projects-page.png) and [media workspace capture](validation/media-workspace.png) were visually inspected against the dark navy, purple, cyan, bordered-panel language of the references. The media screenshot uses an approved local crop as a test-selected file; the app never presents that image as if it were imported by a real user.

## Limits for the next milestone

Browser storage is local to one browser profile and can be cleared. Media files need relinking after each reload. The app has no native filesystem permission, project archive format, SQLite persistence, media processing service, or Electron host yet. A later milestone should decide how those capabilities replace or migrate the versioned browser record without losing local project data.
