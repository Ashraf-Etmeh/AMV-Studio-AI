import { describe, expect, it } from 'vitest'
import { sampleSegments } from '../song-analysis/sampleAnalysis'
import { changedBeatCount, sampleAlternatives, samplePlans, sampleScene } from './samplePlans'

describe('sample planner fixtures', () => {
  it('covers every example song section with valid scenes and an editable alternative', () => {
    for (const plan of samplePlans) {
      for (const segment of sampleSegments) {
        const sceneId = plan.sceneBySegment[segment.id]
        expect(sampleScene(sceneId).id).toBe(sceneId)
        expect(plan.noteBySegment[segment.id]).toBeTruthy()
        expect(sampleAlternatives[segment.id].some((item) => item.sceneId === sceneId)).toBe(true)
      }
    }
  })

  it('counts changed beats against the applied example without mutating it', () => {
    const plan = samplePlans[0]
    const draft = { ...plan.sceneBySegment, chorus: 'reunion' }
    expect(changedBeatCount(draft, plan)).toBe(1)
    expect(plan.sceneBySegment.chorus).toBe('reaching')
  })
})
