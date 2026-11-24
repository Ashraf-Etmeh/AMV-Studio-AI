import { sampleScenes } from '../scenes/sampleScenes'
import { sampleSegments } from '../song-analysis/sampleAnalysis'
import type { SampleScene } from '../scenes/sampleScenes'

export interface SamplePlan {
  id: string
  name: string
  premise: string
  tone: string
  sceneBySegment: Record<string, string>
  noteBySegment: Record<string, string>
}

// Editorial examples combining the supplied song and scene fixtures. No plan is
// generated from, matched to, or saved as analysis of a user's imported media.
export const samplePlans: SamplePlan[] = [
  {
    id: 'rain-to-reunion', name: 'From Rain to Reunion', tone: 'Reflective → hopeful',
    premise: 'Begin with isolation, move through a difficult choice, and close on connection.',
    sceneBySegment: { intro: 'sunset', 'verse-one': 'crying', chorus: 'reaching', 'verse-two': 'confrontation', bridge: 'reunion', outro: 'sunset' },
    noteBySegment: {
      intro: 'An open landscape establishes distance before the story becomes personal.',
      'verse-one': 'The quiet rain image echoes the example verse’s nostalgic mood.',
      chorus: 'An outstretched hand gives the hopeful example chorus a visible goal.',
      'verse-two': 'The confrontation raises the stakes after the first moment of hope.',
      bridge: 'The reunion answers the earlier reaching gesture with connection.',
      outro: 'Return to the sunset as a calm visual echo of the opening.',
    },
  },
  {
    id: 'stand-and-return', name: 'Stand and Return', tone: 'Intense → resolved',
    premise: 'Start close to the emotion, build toward conflict, and finish with relief.',
    sceneBySegment: { intro: 'crying', 'verse-one': 'sunset', chorus: 'confrontation', 'verse-two': 'reaching', bridge: 'reunion', outro: 'reunion' },
    noteBySegment: {
      intro: 'Open on a face so the audience meets the emotional conflict immediately.',
      'verse-one': 'A wider sunset view creates breathing room after the close-up.',
      chorus: 'The action still makes the example chorus the visual high point.',
      'verse-two': 'Reaching out turns conflict toward an attempt to reconnect.',
      bridge: 'The embrace offers a clear answer to the previous gesture.',
      outro: 'Hold on the reunion to end with resolution rather than a new question.',
    },
  },
]

export interface SampleAlternative { sceneId: string; note: string }

// Hand-written alternatives for each sample song section. The order is editorial,
// not a ranking or confidence score.
export const sampleAlternatives: Record<string, SampleAlternative[]> = {
  intro: [
    { sceneId: 'sunset', note: 'Use a wide establishing image.' },
    { sceneId: 'crying', note: 'Open directly on the character’s emotion.' },
    { sceneId: 'reunion', note: 'Begin with a warm image, then tell the story in reverse.' },
  ],
  'verse-one': [
    { sceneId: 'crying', note: 'Keep the verse intimate and still.' },
    { sceneId: 'sunset', note: 'Give the character space and emphasize reflection.' },
    { sceneId: 'reaching', note: 'Introduce a desire for connection earlier.' },
  ],
  chorus: [
    { sceneId: 'reaching', note: 'Make hope visible through a clear gesture.' },
    { sceneId: 'confrontation', note: 'Use motion to make this section feel urgent.' },
    { sceneId: 'reunion', note: 'Bring the emotional payoff forward.' },
  ],
  'verse-two': [
    { sceneId: 'confrontation', note: 'Raise tension before the bridge.' },
    { sceneId: 'reaching', note: 'Turn the second verse toward reconciliation.' },
    { sceneId: 'crying', note: 'Return to the emotional close-up.' },
    { sceneId: 'sunset', note: 'Let the story pause before resolving.' },
  ],
  bridge: [
    { sceneId: 'reunion', note: 'Answer the story’s search for connection.' },
    { sceneId: 'reaching', note: 'Delay the payoff and hold anticipation.' },
    { sceneId: 'crying', note: 'Keep the bridge bittersweet.' },
  ],
  outro: [
    { sceneId: 'sunset', note: 'Echo the opening with a calm landscape.' },
    { sceneId: 'reunion', note: 'End on the character relationship.' },
    { sceneId: 'crying', note: 'Leave the ending unresolved.' },
  ],
}

export function sampleScene(sceneId: string): SampleScene {
  const scene = sampleScenes.find((item) => item.id === sceneId)
  if (!scene) throw new Error(`Unknown sample scene: ${sceneId}`)
  return scene
}

export function changedBeatCount(draft: Record<string, string>, plan: SamplePlan): number {
  return sampleSegments.filter((segment) => draft[segment.id] !== plan.sceneBySegment[segment.id]).length
}
