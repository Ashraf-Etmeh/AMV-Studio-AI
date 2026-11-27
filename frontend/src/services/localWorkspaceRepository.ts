import { demoProjects } from '../features/projects/fixtures'
import { validateProjectName } from '../features/projects/types'
import type { Project } from '../features/projects/types'
import { mediaKind } from '../features/media/types'
import type { MediaAsset } from '../features/media/types'
import { isTimelineClip } from '../features/timeline/editing'
import type { TimelineClip } from '../features/timeline/editing'
import { buildProcessingManifest } from '../features/timeline/processingHandoff'
import type { ProcessingBundle } from '../features/timeline/processingHandoff'
import { createBrowserMediaFileStore } from './mediaFileStore'
import type { MediaFileStore } from './mediaFileStore'
import { readMediaDetails } from './mediaMetadata'
import type { ProjectRepository } from './projectRepository'

const STORAGE_KEY = 'amv-studio-ai:workspace:v1'

interface WorkspaceState {
  version: 1
  projects: Project[]
  media: MediaAsset[]
  timelines: Record<string, TimelineClip[]>
}

export interface WorkspaceRepository extends ProjectRepository {
  listMedia(projectId: string): Promise<MediaAsset[]>
  importMedia(projectId: string, files: File[]): Promise<{ imported: MediaAsset[]; rejected: string[] }>
  relinkMedia(id: string, file: File): Promise<MediaAsset>
  removeMedia(id: string): Promise<void>
  previewUrl(id: string): string | null
  mediaStorageStatus(): 'browser' | 'session' | 'unavailable'
  listTimeline(projectId: string): Promise<TimelineClip[]>
  saveTimeline(projectId: string, clips: TimelineClip[]): Promise<TimelineClip[]>
  prepareProcessingBundle(projectId: string): Promise<ProcessingBundle>
}

function initialState(): WorkspaceState {
  return { version: 1, projects: demoProjects.map((project) => ({ ...project })), media: [], timelines: {} }
}

function isTimelineCollection(value: unknown): value is Record<string, TimelineClip[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value).every((clips) => Array.isArray(clips) && clips.every(isTimelineClip) && new Set(clips.map((clip) => clip.id)).size === clips.length)
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Project>
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    (item.source === 'sample' || item.source === 'local') &&
    (item.thumbnail === null || item.thumbnail === 'sky' || item.thumbnail === 'blossoms' || item.thumbnail === 'summer') &&
    (item.durationSeconds === null || typeof item.durationSeconds === 'number') &&
    typeof item.editedLabel === 'string'
}

function isMedia(value: unknown): value is MediaAsset {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<MediaAsset>
  return typeof item.id === 'string' && typeof item.projectId === 'string' &&
    typeof item.name === 'string' && ['audio', 'video', 'image'].includes(item.kind ?? '') &&
    typeof item.mimeType === 'string' && typeof item.sizeBytes === 'number' &&
    typeof item.lastModified === 'number' && typeof item.addedAt === 'string' &&
    (item.durationSeconds === null || typeof item.durationSeconds === 'number') &&
    (item.width === null || typeof item.width === 'number') &&
    (item.height === null || typeof item.height === 'number')
}

function loadState(storage: Storage): WorkspaceState {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return initialState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid workspace data')
    const state = parsed as Partial<WorkspaceState>
    if (state.version !== 1 || !Array.isArray(state.projects) || !Array.isArray(state.media) ||
      !state.projects.every(isProject) || !state.media.every(isMedia) ||
      (state.timelines !== undefined && !isTimelineCollection(state.timelines))) throw new Error('Invalid workspace data')
    return { version: 1, projects: state.projects, media: state.media, timelines: state.timelines ?? {} }
  } catch {
    throw new Error('Saved workspace metadata could not be read. Your browser data was left untouched.')
  }
}

function checkedName(name: string): string {
  const error = validateProjectName(name)
  if (error) throw new Error(error)
  return name.trim()
}

export function createLocalWorkspaceRepository(storage: Storage = window.localStorage, fileStore: MediaFileStore = createBrowserMediaFileStore()): WorkspaceRepository {
  let state = loadState(storage)
  const urls = new Map<string, string>()
  let mediaStorageStatus: 'browser' | 'session' | 'unavailable' = fileStore.persistence
  const ready = (async () => {
    try {
      await fileStore.ready()
      for (const asset of state.media) {
        const file = await fileStore.get(asset.id)
        if (file && file.size === asset.sizeBytes) urls.set(asset.id, URL.createObjectURL(file))
      }
    } catch { mediaStorageStatus = 'unavailable' }
  })()
  const requireMediaStore = async () => {
    await ready
    if (mediaStorageStatus === 'unavailable') throw new Error('Browser media storage is unavailable. Check browser storage settings and try again.')
  }
  const commit = (next: WorkspaceState) => {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(next)) }
    catch { throw new Error('Browser storage could not save your changes. Check available storage and browser settings.') }
    state = next
  }
  const copy = <T extends object>(item: T): T => ({ ...item })
  const hasProject = (id: string) => state.projects.some((project) => project.id === id)

  return {
    async list() { return state.projects.map(copy) },
    async create(name) {
      const project: Project = {
        id: crypto.randomUUID(), name: checkedName(name), thumbnail: null,
        durationSeconds: null, editedLabel: 'Created locally', source: 'local',
      }
      commit({ ...state, projects: [project, ...state.projects] })
      return copy(project)
    },
    async rename(id, name) {
      if (!hasProject(id)) throw new Error('This project is no longer available.')
      const updated = state.projects.find((project) => project.id === id)!
      const project = { ...updated, name: checkedName(name), editedLabel: 'Edited locally' }
      commit({ ...state, projects: state.projects.map((item) => item.id === id ? project : item) })
      return copy(project)
    },
    async remove(id) {
      await ready
      const project = state.projects.find((item) => item.id === id)
      if (!project) throw new Error('This project is no longer available.')
      if (project.source === 'sample') throw new Error('Sample projects cannot be removed.')
      const removed = state.media.filter((item) => item.projectId === id)
      commit({ ...state, projects: state.projects.filter((item) => item.id !== id), media: state.media.filter((item) => item.projectId !== id), timelines: Object.fromEntries(Object.entries(state.timelines).filter(([projectId]) => projectId !== id)) })
      removed.forEach((item) => { const url = urls.get(item.id); if (url) URL.revokeObjectURL(url); urls.delete(item.id) })
      await Promise.allSettled(removed.map((item) => fileStore.remove(item.id)))
    },
    async listMedia(projectId) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
      await ready
      return state.media.filter((item) => item.projectId === projectId).map(copy)
    },
    async importMedia(projectId, files) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
      await requireMediaStore()
      const imported: MediaAsset[] = []
      const rejected: string[] = []
      for (const file of files) {
        const kind = mediaKind(file)
        if (!kind) { rejected.push(`${file.name}: unsupported file type`); continue }
        if (state.media.some((asset) => asset.projectId === projectId && asset.name === file.name && asset.sizeBytes === file.size && asset.lastModified === file.lastModified)) {
          rejected.push(`${file.name}: already in this project`)
          continue
        }
        const url = URL.createObjectURL(file)
        try {
          const details = await readMediaDetails(url, kind)
          const asset: MediaAsset = {
            id: crypto.randomUUID(), projectId, name: file.name, kind, mimeType: file.type,
            sizeBytes: file.size, lastModified: file.lastModified, addedAt: new Date().toISOString(), ...details,
          }
          try { await fileStore.put(asset.id, file) }
          catch { throw new Error('Browser media storage could not save this file. Check available space and browser settings.') }
          try { commit({ ...state, media: [asset, ...state.media] }) }
          catch (cause) { await fileStore.remove(asset.id).catch(() => {}); throw cause }
          urls.set(asset.id, url)
          imported.push(copy(asset))
        } catch (error) {
          URL.revokeObjectURL(url)
          throw error
        }
      }
      return { imported, rejected }
    },
    async relinkMedia(id, file) {
      await requireMediaStore()
      const asset = state.media.find((item) => item.id === id)
      if (!asset) throw new Error('This media item is no longer available.')
      if (file.name !== asset.name || file.size !== asset.sizeBytes || file.lastModified !== asset.lastModified || mediaKind(file) !== asset.kind) {
        throw new Error('Choose the original file with the same name, size, and modified date.')
      }
      const url = URL.createObjectURL(file)
      let details: Awaited<ReturnType<typeof readMediaDetails>>
      try { details = await readMediaDetails(url, asset.kind) }
      catch (error) { URL.revokeObjectURL(url); throw error }
      const updated = { ...asset, ...details }
      try {
        const previousFile = await fileStore.get(id)
        await fileStore.put(id, file)
        try { commit({ ...state, media: state.media.map((item) => item.id === id ? updated : item) }) }
        catch (cause) { if (previousFile) await fileStore.put(id, previousFile).catch(() => {}); else await fileStore.remove(id).catch(() => {}); throw cause }
      } catch (error) { URL.revokeObjectURL(url); throw error }
      const previous = urls.get(id)
      if (previous) URL.revokeObjectURL(previous)
      urls.set(id, url)
      return copy(updated)
    },
    async removeMedia(id) {
      await ready
      if (!state.media.some((item) => item.id === id)) throw new Error('This media item is no longer available.')
      const timelines = Object.fromEntries(Object.entries(state.timelines).map(([projectId, clips]) => [projectId, clips.filter((clip) => clip.mediaId !== id)]))
      commit({ ...state, media: state.media.filter((item) => item.id !== id), timelines })
      const url = urls.get(id)
      if (url) URL.revokeObjectURL(url)
      urls.delete(id)
      await fileStore.remove(id).catch(() => {})
    },
    previewUrl(id) { return urls.get(id) ?? null },
    mediaStorageStatus() { return mediaStorageStatus },
    async listTimeline(projectId) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
      return (state.timelines[projectId] ?? []).map(copy)
    },
    async saveTimeline(projectId, clips) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
      if (!Array.isArray(clips) || clips.length > 500 || !clips.every(isTimelineClip) || new Set(clips.map((clip) => clip.id)).size !== clips.length) {
        throw new Error('Timeline clip data is invalid.')
      }
      const projectMedia = new Map(state.media.filter((asset) => asset.projectId === projectId).map((asset) => [asset.id, asset]))
      for (const clip of clips) {
        const asset = projectMedia.get(clip.mediaId)
        if (!asset || clip.track !== asset.kind || (asset.kind === 'image' && (clip.sourceIn !== 0 || clip.sourceOut < 0.5 || clip.sourceOut > 300)) ||
          (asset.kind !== 'image' && (asset.durationSeconds === null || clip.sourceOut - clip.sourceIn < 0.1 || clip.sourceOut > asset.durationSeconds + 0.001))) {
          throw new Error('A timeline clip no longer matches its project media.')
        }
      }
      const saved = clips.map(copy)
      commit({ ...state, timelines: { ...state.timelines, [projectId]: saved } })
      return saved.map(copy)
    },
    async prepareProcessingBundle(projectId) {
      await requireMediaStore()
      const project = state.projects.find((item) => item.id === projectId)
      if (!project) throw new Error('This project is no longer available.')
      const assets = state.media.filter((item) => item.projectId === projectId)
      const manifest = buildProcessingManifest(project, assets, state.timelines[projectId] ?? [])
      const files: ProcessingBundle['files'] = []
      for (const media of manifest.media) {
        const blob = await fileStore.get(media.id)
        if (!blob || blob.size !== media.sizeBytes) throw new Error(`${media.name} needs relinking before processing.`)
        files.push({ mediaId: media.id, blob })
      }
      return { manifest, files }
    },
  }
}
