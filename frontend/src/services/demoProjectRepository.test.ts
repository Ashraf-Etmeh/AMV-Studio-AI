import { describe, expect, it } from 'vitest'
import { createDemoProjectRepository } from './demoProjectRepository'

describe('in-memory project repository used by component tests', () => {
  it('creates a trimmed draft without inventing media or analysis', async () => {
    const repository = createDemoProjectRepository()
    const draft = await repository.create('  Midnight Reverie  ')
    expect(draft).toMatchObject({ name: 'Midnight Reverie', source: 'local', durationSeconds: null, thumbnail: null })
    expect(await repository.list()).toHaveLength(4)
    expect((await repository.list())[0].id).toBe(draft.id)
  })

  it('rejects blank or overlong names without creating a project', async () => {
    const repository = createDemoProjectRepository()
    await expect(repository.create('   ')).rejects.toThrow('Give your project a name.')
    await expect(repository.create('x'.repeat(81))).rejects.toThrow('80 characters')
    expect(await repository.list()).toHaveLength(3)
  })

  it('renames only the requested project and retains its sample provenance', async () => {
    const repository = createDemoProjectRepository()
    await repository.rename('demo-sky', '  Another Sky ')
    const items = await repository.list()
    expect(items[0]).toMatchObject({ name: 'Another Sky', durationSeconds: 222, source: 'sample' })
    expect(items[1].name).toBe('Fragments of Us')
    await expect(repository.rename('missing', 'Title')).rejects.toThrow('no longer available')
    await expect(repository.rename('demo-sky', ' ')).rejects.toThrow('Give your project')
  })

  it('isolates sessions and protects stored data from accidental external mutation', async () => {
    const first = createDemoProjectRepository()
    const items = await first.list()
    items[0].name = 'Accidental mutation'
    expect((await first.list())[0].name).toBe('Beneath the Sky')
    await first.create('Only in session one')
    expect(await createDemoProjectRepository().list()).toHaveLength(3)
  })
})
