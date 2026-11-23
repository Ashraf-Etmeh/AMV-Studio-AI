import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalWorkspaceRepository } from './localWorkspaceRepository'
import { readMediaDetails } from './mediaMetadata'

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

  it('does not store file bytes, rejects duplicates and unsupported files', async () => {
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
})
