export interface MediaFileStore {
  readonly persistence: 'browser' | 'session'
  ready(): Promise<void>
  get(id: string): Promise<Blob | null>
  put(id: string, file: Blob): Promise<void>
  remove(id: string): Promise<void>
}

export function createSessionMediaFileStore(): MediaFileStore {
  const files = new Map<string, Blob>()
  return {
    persistence: 'session',
    async ready() {},
    async get(id) { return files.get(id) ?? null },
    async put(id, file) { files.set(id, file) },
    async remove(id) { files.delete(id) },
  }
}

class IndexedDbMediaFileStore implements MediaFileStore {
  readonly persistence = 'browser' as const
  private database: Promise<IDBDatabase> | null = null

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open('amv-studio-ai:media:v1', 1)
      request.onupgradeneeded = () => { request.result.createObjectStore('files') }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Media database could not open.'))
      request.onblocked = () => reject(new Error('Media database upgrade is blocked by another tab.'))
    })
    return this.database
  }

  async ready() { await this.open() }

  async get(id: string): Promise<Blob | null> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      const request = database.transaction('files', 'readonly').objectStore('files').get(id)
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
      request.onerror = () => reject(request.error ?? new Error('Media file could not be read.'))
    })
  }

  private async write(mode: 'put' | 'delete', id: string, file?: Blob): Promise<void> {
    const database = await this.open()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('files', 'readwrite')
      const store = transaction.objectStore('files')
      if (mode === 'put' && file) store.put(file, id)
      else store.delete(id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Media database write failed.'))
      transaction.onabort = () => reject(transaction.error ?? new Error('Media database write was aborted.'))
    })
  }

  async put(id: string, file: Blob) { await this.write('put', id, file) }
  async remove(id: string) { await this.write('delete', id) }
}

export function createBrowserMediaFileStore(): MediaFileStore {
  return typeof indexedDB === 'undefined' ? createSessionMediaFileStore() : new IndexedDbMediaFileStore()
}
