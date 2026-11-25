import type { MediaAsset } from '../media/types'

export type TimelineTrack = 'video' | 'image' | 'audio'

export interface TimelineClip {
  id: string
  mediaId: string
  track: TimelineTrack
  sourceIn: number
  sourceOut: number
}

export interface TimelineHistory {
  past: TimelineClip[][]
  present: TimelineClip[]
  future: TimelineClip[][]
}

export const trackOrder: readonly { id: TimelineTrack; title: string }[] = [
  { id: 'audio', title: 'Music' },
  { id: 'video', title: 'Video Clips' },
  { id: 'image', title: 'Still Images' },
]

export function clipDuration(clip: TimelineClip): number {
  return clip.sourceOut - clip.sourceIn
}

export function createTimelineClip(asset: MediaAsset, id: string): TimelineClip {
  if (asset.kind === 'image') return { id, mediaId: asset.id, track: 'image', sourceIn: 0, sourceOut: 5 }
  if (asset.durationSeconds === null || !Number.isFinite(asset.durationSeconds) || asset.durationSeconds < 0.1) {
    throw new Error(`${asset.name} has no readable duration. Choose a supported file before adding it to the timeline.`)
  }
  return { id, mediaId: asset.id, track: asset.kind, sourceIn: 0, sourceOut: asset.durationSeconds }
}

export function trimTimelineClip(clips: TimelineClip[], id: string, sourceIn: number, sourceOut: number, asset: MediaAsset): TimelineClip[] {
  const clip = clips.find((item) => item.id === id)
  if (!clip) throw new Error('Select a timeline clip to trim.')
  if (clip.mediaId !== asset.id) throw new Error('The selected media record changed.')
  if (!Number.isFinite(sourceIn) || !Number.isFinite(sourceOut)) throw new Error('Enter valid trim times.')
  if (asset.kind === 'image') {
    if (sourceIn !== 0 || sourceOut < 0.5 || sourceOut > 300) throw new Error('Still duration must be between 0.5 and 300 seconds.')
  } else if (asset.durationSeconds === null || sourceIn < 0 || sourceOut - sourceIn < 0.1 || sourceOut > asset.durationSeconds + 0.001) {
    throw new Error('Trim must stay within the source file and last at least 0.1 seconds.')
  }
  if (clip.sourceIn === sourceIn && clip.sourceOut === sourceOut) return clips
  return clips.map((item) => item.id === id ? { ...item, sourceIn, sourceOut } : item)
}

export function moveTimelineClip(clips: TimelineClip[], id: string, direction: -1 | 1): TimelineClip[] {
  const index = clips.findIndex((item) => item.id === id)
  if (index < 0) return clips
  const track = clips[index].track
  let adjacent = -1
  for (let itemIndex = index + direction; itemIndex >= 0 && itemIndex < clips.length; itemIndex += direction) {
    if (sameSequence(clips[itemIndex].track, track)) { adjacent = itemIndex; break }
  }
  if (adjacent < 0) return clips
  const next = [...clips]
  const previous = next[index]
  next[index] = next[adjacent]
  next[adjacent] = previous
  return next
}

export function reorderTimelineClip(clips: TimelineClip[], id: string, targetId: string, after: boolean): TimelineClip[] {
  if (id === targetId) return clips
  const dragged = clips.find((clip) => clip.id === id)
  const target = clips.find((clip) => clip.id === targetId)
  if (!dragged || !target || !sameSequence(dragged.track, target.track)) return clips
  const rest = clips.filter((clip) => clip.id !== id)
  const targetIndex = rest.findIndex((clip) => clip.id === targetId)
  rest.splice(targetIndex + (after ? 1 : 0), 0, dragged)
  return rest.every((clip, index) => clip.id === clips[index].id) ? clips : rest
}

export function removeTimelineClip(clips: TimelineClip[], id: string): TimelineClip[] {
  return clips.some((item) => item.id === id) ? clips.filter((item) => item.id !== id) : clips
}

export function trackDuration(clips: TimelineClip[], track: TimelineTrack): number {
  return clips.filter((clip) => clip.track === track).reduce((total, clip) => total + clipDuration(clip), 0)
}

export function sameSequence(left: TimelineTrack, right: TimelineTrack): boolean {
  return left === right || (left !== 'audio' && right !== 'audio')
}

export function clipStart(clips: TimelineClip[], id: string): number {
  const target = clips.find((clip) => clip.id === id)
  if (!target) return 0
  let start = 0
  for (const clip of clips) {
    if (clip.id === id) break
    if (sameSequence(clip.track, target.track)) start += clipDuration(clip)
  }
  return start
}

export function newHistory(clips: TimelineClip[] = []): TimelineHistory {
  return { past: [], present: clips, future: [] }
}

export function recordEdit(history: TimelineHistory, next: TimelineClip[]): TimelineHistory {
  if (next === history.present) return history
  return { past: [...history.past, history.present].slice(-50), present: next, future: [] }
}

export function undoEdit(history: TimelineHistory): TimelineHistory {
  if (!history.past.length) return history
  return { past: history.past.slice(0, -1), present: history.past.at(-1)!, future: [history.present, ...history.future] }
}

export function redoEdit(history: TimelineHistory): TimelineHistory {
  if (!history.future.length) return history
  return { past: [...history.past, history.present].slice(-50), present: history.future[0], future: history.future.slice(1) }
}

export function isTimelineClip(value: unknown): value is TimelineClip {
  if (!value || typeof value !== 'object') return false
  const clip = value as Partial<TimelineClip>
  return typeof clip.id === 'string' && clip.id.length > 0 && typeof clip.mediaId === 'string' &&
    (clip.track === 'audio' || clip.track === 'video' || clip.track === 'image') &&
    typeof clip.sourceIn === 'number' && Number.isFinite(clip.sourceIn) && clip.sourceIn >= 0 &&
    typeof clip.sourceOut === 'number' && Number.isFinite(clip.sourceOut) && clip.sourceOut > clip.sourceIn
}

export function formatTimelineTime(seconds: number): string {
  const totalTenths = Math.round(seconds * 10)
  const minutes = Math.floor(totalTenths / 600)
  const wholeSeconds = Math.floor((totalTenths % 600) / 10).toString().padStart(2, '0')
  const tenths = totalTenths % 10
  return `${minutes}:${wholeSeconds}${tenths ? `.${tenths}` : ''}`
}
