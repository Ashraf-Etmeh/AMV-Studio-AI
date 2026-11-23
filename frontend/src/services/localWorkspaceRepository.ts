import { demoProjects } from '../features/projects/fixtures'
import { validateProjectName } from '../features/projects/types'
import type { Project } from '../features/projects/types'
import { mediaKind } from '../features/media/types'
import type { MediaAsset } from '../features/media/types'
import { readMediaDetails } from './mediaMetadata'
import type { ProjectRepository } from './projectRepository'

const STORAGE_KEY = 'amv-studio-ai:workspace:v1'

interface WorkspaceState {
  version: 1
  projects: Project[]
  media: MediaAsset[]
}

export interface WorkspaceRepository extends ProjectRepository {
  listMedia(projectId: string): Promise<MediaAsset[]>
  importMedia(projectId: string, files: File[]): Promise<{ imported: MediaAsset[]; rejected: string[] }>
  relinkMedia(id: string, file: File): Promise<MediaAsset>
  removeMedia(id: string): Promise<void>
  previewUrl(id: string): string | null
}

function initialState(): WorkspaceState {
  return { version: 1, projects: demoProjects.map((project) => ({ ...project })), media: [] }
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
      !state.projects.every(isProject) || !state.media.every(isMedia)) throw new Error('Invalid workspace data')
    return { version: 1, projects: state.projects, media: state.media }
  } catch {
    throw new Error('Saved workspace metadata could not be read. Your browser data was left untouched.')
  }
}

function checkedName(name: string): string {
  const error = validateProjectName(name)
  if (error) throw new Error(error)
  return name.trim()
}

export function createLocalWorkspaceRepository(storage: Storage = window.localStorage): WorkspaceRepository {
  let state = loadState(storage)
  const urls = new Map<string, string>()
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
      const project = state.projects.find((item) => item.id === id)
      if (!project) throw new Error('This project is no longer available.')
      if (project.source === 'sample') throw new Error('Sample projects cannot be removed.')
      const removed = state.media.filter((item) => item.projectId === id)
      commit({ ...state, projects: state.projects.filter((item) => item.id !== id), media: state.media.filter((item) => item.projectId !== id) })
      removed.forEach((item) => { const url = urls.get(item.id); if (url) URL.revokeObjectURL(url); urls.delete(item.id) })
    },
    async listMedia(projectId) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
      return state.media.filter((item) => item.projectId === projectId).map(copy)
    },
    async importMedia(projectId, files) {
      if (!hasProject(projectId)) throw new Error('This project is no longer available.')
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
          commit({ ...state, media: [asset, ...state.media] })
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
      const asset = state.media.find((item) => item.id === id)
      if (!asset) throw new Error('This media item is no longer available.')
      if (file.name !== asset.name || file.size !== asset.sizeBytes || file.lastModified !== asset.lastModified || mediaKind(file) !== asset.kind) {
        throw new Error('Choose the original file with the same name, size, and modified date.')
      }
      const url = URL.createObjectURL(file)
      const details = await readMediaDetails(url, asset.kind)
      const updated = { ...asset, ...details }
      try { commit({ ...state, media: state.media.map((item) => item.id === id ? updated : item) }) }
      catch (error) { URL.revokeObjectURL(url); throw error }
      const previous = urls.get(id)
      if (previous) URL.revokeObjectURL(previous)
      urls.set(id, url)
      return copy(updated)
    },
    async removeMedia(id) {
      if (!state.media.some((item) => item.id === id)) throw new Error('This media item is no longer available.')
      commit({ ...state, media: state.media.filter((item) => item.id !== id) })
      const url = urls.get(id)
      if (url) URL.revokeObjectURL(url)
      urls.delete(id)
    },
    previewUrl(id) { return urls.get(id) ?? null },
  }
}
