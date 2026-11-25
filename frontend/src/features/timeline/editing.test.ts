import { describe, expect, it } from 'vitest'
import type { MediaAsset } from '../media/types'
import { clipStart, createTimelineClip, moveTimelineClip, newHistory, recordEdit, redoEdit, reorderTimelineClip, trackDuration, trimTimelineClip, undoEdit } from './editing'

const still: MediaAsset = { id: 'still', projectId: 'project', name: 'frame.png', kind: 'image', mimeType: 'image/png', sizeBytes: 10, lastModified: 1, durationSeconds: null, width: 2, height: 2, addedAt: '2026-01-01' }
const video: MediaAsset = { ...still, id: 'video', name: 'scene.webm', kind: 'video', mimeType: 'video/webm', durationSeconds: 12 }

describe('timeline edits', () => {
  it('interleaves video and stills in one visual order while music stays independent', () => {
    const first = createTimelineClip(still, 'first')
    const second = createTimelineClip(still, 'second')
    const motion = createTimelineClip(video, 'motion')
    const reordered = moveTimelineClip([first, motion, second], 'second', -1)
    expect(reordered.map((clip) => clip.id)).toEqual(['first', 'second', 'motion'])
    expect(reorderTimelineClip(reordered, 'motion', 'first', false).map((clip) => clip.id)).toEqual(['motion', 'first', 'second'])
    expect(clipStart(reordered, 'second')).toBe(5)
    expect(clipStart(reordered, 'motion')).toBe(10)
    const trimmed = trimTimelineClip(reordered, 'second', 0, 2.5, still)
    expect(trackDuration(trimmed, 'image')).toBe(7.5)
    expect(trackDuration(trimmed, 'video')).toBe(12)
    expect(() => trimTimelineClip(trimmed, 'motion', 8, 13, video)).toThrow('within the source')
  })

  it('undoes and redoes a saved edit sequence', () => {
    const first = createTimelineClip(still, 'first')
    const second = createTimelineClip(still, 'second')
    const afterFirst = recordEdit(newHistory(), [first])
    const afterSecond = recordEdit(afterFirst, [first, second])
    const undone = undoEdit(afterSecond)
    expect(undone.present.map((clip) => clip.id)).toEqual(['first'])
    expect(redoEdit(undone).present.map((clip) => clip.id)).toEqual(['first', 'second'])
    expect(recordEdit(undone, [first, createTimelineClip(still, 'third')]).future).toEqual([])
  })
})
