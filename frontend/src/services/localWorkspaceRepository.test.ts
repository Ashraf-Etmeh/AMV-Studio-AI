import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalWorkspaceRepository } from './localWorkspaceRepository'
import { readMediaDetails } from './mediaMetadata'
import { createSessionMediaFileStore } from './mediaFileStore'
import { processingFormData } from '../features/timeline/processingHandoff'

vi.mock('./mediaMetadata', () => ({ readMediaDetails: vi.fn() }))

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

beforeEach(() => {
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() })
  vi.mocked(readMediaDetails).mockResolvedValue({ durationSeconds: null, width: 2, height: 3 })
})

describe('browser-local workspace repository', () => {
  it('saves created and renamed projects across repository instances', async () => {
    const storage = new MemoryStorage()
    const first = createLocalWorkspaceRepository(storage)
    const created = await first.create('  Neon Dawn  ')
    await first.rename(created.id, 'Neon Dusk')
    const second = createLocalWorkspaceRepository(storage)
    expect((await second.list())[0]).toMatchObject({ id: created.id, name: 'Neon Dusk', source: 'local' })
    expect(await second.list()).toHaveLength(4)
  })

  it('retains media details while requiring relink in a new session', async () => {
    const storage = new MemoryStorage()
    const first = createLocalWorkspaceRepository(storage)
    const project = await first.create('My edit')
    const file = new File(['data'], 'sunset.png', { type: 'image/png', lastModified: 1000 })
    const { imported } = await first.importMedia(project.id, [file])
    expect(imported[0]).toMatchObject({ name: 'sunset.png', kind: 'image', sizeBytes: 4, width: 2, height: 3 })
    expect(first.previewUrl(imported[0].id)).toBe('blob:test')
    const second = createLocalWorkspaceRepository(storage)
    expect(second.previewUrl(imported[0].id)).toBeNull()
    expect((await second.listMedia(project.id))[0]).toMatchObject({ id: imported[0].id, width: 2, height: 3 })
    await expect(second.relinkMedia(imported[0].id, new File(['wrong bytes'], 'sunset.png', { type: 'image/png', lastModified: 1000 }))).rejects.toThrow('same name, size')
    await second.relinkMedia(imported[0].id, file)
    expect(second.previewUrl(imported[0].id)).toBe('blob:test')
  })

  it('keeps file bytes out of metadata and rejects duplicates and unsupported files', async () => {
    const storage = new MemoryStorage()
    const repository = createLocalWorkspaceRepository(storage)
    const project = await repository.create('Scene set')
    const file = new File(['secret frames'], 'scene.mp4', { type: 'video/mp4', lastModified: 1000 })
    const result = await repository.importMedia(project.id, [file, file, new File(['x'], 'notes.txt', { type: 'text/plain' })])
    expect(result.imported).toHaveLength(1)
    expect(result.rejected).toHaveLength(2)
    expect(storage.getItem('amv-studio-ai:workspace:v1')).not.toContain('secret frames')
    expect(await repository.listMedia(project.id)).toHaveLength(1)
  })

  it('removes only browser records and refuses to delete samples', async () => {
    const storage = new MemoryStorage()
    const repository = createLocalWorkspaceRepository(storage)
    const project = await repository.create('Temp')
    await repository.importMedia(project.id, [new File(['x'], 'clip.png', { type: 'image/png' })])
    await expect(repository.remove('demo-sky')).rejects.toThrow('Sample projects cannot')
    await repository.remove(project.id)
    expect(await repository.list()).toHaveLength(3)
    await expect(repository.listMedia(project.id)).rejects.toThrow('no longer available')
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('preserves saved data if a storage write fails', async () => {
    const storage = new MemoryStorage()
    const repository = createLocalWorkspaceRepository(storage)
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await expect(repository.create('Unsaved')).rejects.toThrow('Browser storage could not save')
    expect(await repository.list()).toHaveLength(3)
  })

  it('migrates older browser records and saves only valid timeline references', async () => {
    const storage = new MemoryStorage()
    const first = createLocalWorkspaceRepository(storage)
    const project = await first.create('Cut one')
    const original = JSON.parse(storage.getItem('amv-studio-ai:workspace:v1')!)
    delete original.timelines
    storage.setItem('amv-studio-ai:workspace:v1', JSON.stringify(original))
    const repository = createLocalWorkspaceRepository(storage)
    expect(await repository.listTimeline(project.id)).toEqual([])
    const { imported } = await repository.importMedia(project.id, [new File(['pixels'], 'shot.png', { type: 'image/png' })])
    const clip = { id: 'clip-1', mediaId: imported[0].id, track: 'image' as const, sourceIn: 0, sourceOut: 5 }
    await repository.saveTimeline(project.id, [clip])
    expect(await createLocalWorkspaceRepository(storage).listTimeline(project.id)).toEqual([clip])
    await expect(repository.saveTimeline(project.id, [{ ...clip, mediaId: 'other' }])).rejects.toThrow('no longer matches')
    expect(await repository.listTimeline(project.id)).toEqual([clip])
    await repository.removeMedia(imported[0].id)
    expect(await repository.listTimeline(project.id)).toEqual([])
  })

  it('removes a deleted project timeline with its media records', async () => {
    const storage = new MemoryStorage()
    const repository = createLocalWorkspaceRepository(storage)
    const project = await repository.create('Temporary cut')
    const { imported } = await repository.importMedia(project.id, [new File(['image'], 'frame.png', { type: 'image/png' })])
    await repository.saveTimeline(project.id, [{ id: 'clip', mediaId: imported[0].id, track: 'image', sourceIn: 0, sourceOut: 5 }])
    await repository.remove(project.id)
    expect(JSON.parse(storage.getItem('amv-studio-ai:workspace:v1')!).timelines[project.id]).toBeUndefined()
  })

  it('restores retained file bytes and prepares a validated processing handoff', async () => {
    const storage = new MemoryStorage()
    const files = createSessionMediaFileStore()
    vi.mocked(readMediaDetails).mockImplementation(async (_url, kind) => ({ durationSeconds: kind === 'audio' ? 5 : null, width: null, height: null }))
    const first = createLocalWorkspaceRepository(storage, files)
    const project = await first.create('Durable cut')
    const { imported } = await first.importMedia(project.id, [new File(['pixels'], 'frame.png', { type: 'image/png' }), new File(['music'], 'song.wav', { type: 'audio/wav' })])
    const image = imported.find((asset) => asset.kind === 'image')!
    const audio = imported.find((asset) => asset.kind === 'audio')!
    await first.saveTimeline(project.id, [{ id: 'image-clip', mediaId: image.id, track: 'image', sourceIn: 0, sourceOut: 5 }, { id: 'audio-clip', mediaId: audio.id, track: 'audio', sourceIn: 0, sourceOut: 5 }])
    const second = createLocalWorkspaceRepository(storage, files)
    await second.listMedia(project.id)
    expect(second.previewUrl(image.id)).toBe('blob:test')
    const bundle = await second.prepareProcessingBundle(project.id)
    expect(bundle.manifest).toMatchObject({ schemaVersion: 1, visualDurationSeconds: 5, audioDurationSeconds: 5, clips: [{ sequenceStart: 0 }, { sequenceStart: 0 }] })
    expect(bundle.files.map((file) => file.blob.size)).toEqual([6, 5])
    expect(processingFormData(bundle).getAll('media')).toHaveLength(2)
    await files.put(audio.id, new Blob(['bad']))
    await expect(second.prepareProcessingBundle(project.id)).rejects.toThrow('song.wav needs relinking')
    await files.put(audio.id, bundle.files.find((file) => file.mediaId === audio.id)!.blob)
    await second.removeMedia(image.id)
    expect(await files.get(image.id)).toBeNull()
    await expect(second.prepareProcessingBundle(project.id)).rejects.toThrow('Place at least one video or still image')
  })

  it('does not create a media record when file storage fails', async () => {
    const storage = new MemoryStorage()
    const files = createSessionMediaFileStore()
    files.put = async () => { throw new Error('quota') }
    const repository = createLocalWorkspaceRepository(storage, files)
    const project = await repository.create('No space')
    await expect(repository.importMedia(project.id, [new File(['data'], 'shot.png', { type: 'image/png' })])).rejects.toThrow('could not save this file')
    expect(await repository.listMedia(project.id)).toEqual([])
  })
})
