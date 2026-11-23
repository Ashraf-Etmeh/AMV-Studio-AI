export type MediaKind = 'audio' | 'video' | 'image'

export interface MediaAsset {
  id: string
  projectId: string
  name: string
  kind: MediaKind
  mimeType: string
  sizeBytes: number
  lastModified: number
  durationSeconds: number | null
  width: number | null
  height: number | null
  addedAt: string
}

export function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatMediaDuration(seconds: number): string {
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(2, '0')
  const remaining = (total % 60).toString().padStart(2, '0')
  return hours ? `${hours}:${minutes}:${remaining}` : `${minutes}:${remaining}`
}
