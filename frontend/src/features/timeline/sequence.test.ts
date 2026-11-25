import { describe, expect, it } from 'vitest'
import type { MediaAsset } from '../media/types'
import type { TimelineClip } from './editing'
import { exportReadiness, sequenceDurations, sequenceFrameAt } from './sequence'

const asset = (id: string, kind: MediaAsset['kind']): MediaAsset => ({ id, projectId: 'project', name: id, kind, mimeType: '', sizeBytes: 4, lastModified: 1, durationSeconds: kind === 'image' ? null : 5, width: null, height: null, addedAt: '2026-01-01' })
const clip = (id: string, track: TimelineClip['track'], duration: number): TimelineClip => ({ id, mediaId: id, track, sourceIn: 0, sourceOut: duration })

describe('sequence composition and readiness', () => {
  const clips = [clip('music', 'audio', 5), clip('video', 'video', 2), clip('still', 'image', 3)]
  const assets = [asset('music', 'audio'), asset('video', 'video'), asset('still', 'image')]

  it('plays video then stills while music runs across both', () => {
    expect(sequenceDurations(clips)).toEqual({ visual: 5, audio: 5, total: 5 })
    const first = sequenceFrameAt(clips, assets, 1.5)
    expect(first.visual?.clip.id).toBe('video')
    expect(first.audio?.sourceTime).toBe(1.5)
    const second = sequenceFrameAt(clips, assets, 2)
    expect(second.visual?.clip.id).toBe('still')
    expect(second.visual?.sourceTime).toBe(0)
    expect(sequenceFrameAt(clips, assets, 5).visual).toBeNull()
  })

  it('requires sources, aligned durations, and a linked picture and music track', () => {
    expect(exportReadiness(clips, assets, () => true).ready).toBe(true)
    const unlinked = exportReadiness(clips, assets, (id) => id !== 'still')
    expect(unlinked.ready).toBe(false)
    expect(unlinked.canPreview).toBe(false)
    expect(unlinked.checks.find((check) => check.id === 'access')?.detail).toContain('Relink 1')
    expect(exportReadiness(clips.slice(1), assets, () => true).checks.find((check) => check.id === 'music')?.passed).toBe(false)
    expect(exportReadiness([...clips, clip('extra', 'image', 2)], [...assets, asset('extra', 'image')], () => true).checks.find((check) => check.id === 'timing')?.passed).toBe(false)
  })
})
