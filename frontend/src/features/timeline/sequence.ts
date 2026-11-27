import type { MediaAsset } from '../media/types'
import { clipDuration, sameSequence } from './editing'
import type { TimelineClip } from './editing'

export interface PlacedClip {
  clip: TimelineClip
  asset: MediaAsset | null
  start: number
  end: number
  sourceTime: number
}

export interface SequenceFrame {
  position: number
  duration: number
  visual: PlacedClip | null
  audio: PlacedClip | null
}

function durationOf(clips: TimelineClip[], type: 'audio' | 'visual'): number {
  return clips.filter((clip) => type === 'audio' ? clip.track === 'audio' : clip.track !== 'audio').reduce((total, clip) => total + clipDuration(clip), 0)
}

export function sequenceDurations(clips: TimelineClip[]) {
  const visual = durationOf(clips, 'visual')
  const audio = durationOf(clips, 'audio')
  return { visual, audio, total: Math.max(visual, audio) }
}

function placedAt(clips: TimelineClip[], assets: MediaAsset[], position: number, type: 'audio' | 'visual'): PlacedClip | null {
  let start = 0
  for (const clip of clips) {
    if (type === 'audio' ? clip.track !== 'audio' : clip.track === 'audio') continue
    const end = start + clipDuration(clip)
    if (position >= start && position < end) {
      return { clip, asset: assets.find((asset) => asset.id === clip.mediaId) ?? null, start, end, sourceTime: clip.sourceIn + position - start }
    }
    start = end
  }
  return null
}

export function sequenceFrameAt(clips: TimelineClip[], assets: MediaAsset[], time: number): SequenceFrame {
  const duration = sequenceDurations(clips).total
  const position = Math.max(0, Math.min(Number.isFinite(time) ? time : 0, duration))
  return { position, duration, visual: placedAt(clips, assets, position, 'visual'), audio: placedAt(clips, assets, position, 'audio') }
}

export interface ReadinessCheck {
  id: 'visual' | 'music' | 'access' | 'timing'
  label: string
  passed: boolean
  detail: string
}

export function exportReadiness(clips: TimelineClip[], assets: MediaAsset[], hasFile: (id: string) => boolean): { checks: ReadinessCheck[]; ready: boolean; canPreview: boolean } {
  const durations = sequenceDurations(clips)
  const missing = clips.filter((clip) => !assets.some((asset) => asset.id === clip.mediaId) || !hasFile(clip.mediaId))
  const drift = Math.abs(durations.visual - durations.audio)
  const checks: ReadinessCheck[] = [
    { id: 'visual', label: 'Visual sequence', passed: durations.visual > 0, detail: durations.visual > 0 ? `${clips.filter((clip) => clip.track !== 'audio').length} placed video or still clips` : 'Place at least one video or still image.' },
    { id: 'music', label: 'Music track', passed: durations.audio > 0, detail: durations.audio > 0 ? `${clips.filter((clip) => clip.track === 'audio').length} placed music clips` : 'Place at least one music clip.' },
    { id: 'access', label: 'Local file access', passed: clips.length > 0 && missing.length === 0, detail: missing.length ? `Relink ${missing.length} source ${missing.length === 1 ? 'file' : 'files'} in Media.` : clips.length ? 'All placed sources are available.' : 'Place media to check file access.' },
    { id: 'timing', label: 'Full-length picture and sound', passed: durations.visual > 0 && durations.audio > 0 && drift < 0.1, detail: durations.visual && durations.audio ? drift < 0.1 ? 'Visual and music durations match.' : `Visual ${durations.visual.toFixed(1)}s · music ${durations.audio.toFixed(1)}s. Trim or extend clips to match.` : 'Add picture and music to compare durations.' },
  ]
  return { checks, ready: checks.every((check) => check.passed), canPreview: clips.length > 0 && missing.length === 0 }
}

export function clipsInSequence(clips: TimelineClip[], clip: TimelineClip): TimelineClip[] {
  return clips.filter((item) => sameSequence(item.track, clip.track))
}
