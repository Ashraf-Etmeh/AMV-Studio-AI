// A hand-authored fixture transcribed from the supplied design reference.
// None of these values are inferred from a user's imported music.
export interface SampleSegment {
  id: string
  name: 'Intro' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro'
  start: number
  end: number
  lyrics: string[]
  emotion: string
  energy: number
  color: string
}

export const sampleSong = {
  title: 'Neon Memories',
  duration: 222,
  bpm: 128,
  key: 'A minor',
  energy: 0.78,
  emotions: [
    { name: 'Nostalgic', value: 0.61 },
    { name: 'Hopeful', value: 0.48 },
    { name: 'Melancholic', value: 0.42 },
    { name: 'Epic', value: 0.37 },
  ],
} as const

export const sampleSegments: readonly SampleSegment[] = [
  { id: 'intro', name: 'Intro', start: 0, end: 14, lyrics: ['(Instrumental)'], emotion: 'Calm', energy: 0.28, color: '#62bccc' },
  { id: 'verse-one', name: 'Verse', start: 14, end: 45, lyrics: ['City lights are fading, another quiet night', 'Memories are calling, still within my mind'], emotion: 'Nostalgic', energy: 0.52, color: '#4f82d4' },
  { id: 'chorus', name: 'Chorus', start: 45, end: 89, lyrics: ['So let me stay in this moment a little longer', 'Where you and I still belong'], emotion: 'Hopeful', energy: 0.91, color: '#a752e0' },
  { id: 'verse-two', name: 'Verse', start: 89, end: 130, lyrics: ['The pages keep turning, but you’re still the same', 'A story unfinished, echoing your name'], emotion: 'Melancholic', energy: 0.56, color: '#4f82d4' },
  { id: 'bridge', name: 'Bridge', start: 130, end: 159, lyrics: ['Even if we’re drifting, even if it’s gone', 'Somewhere in time, you’re still my home'], emotion: 'Reflective', energy: 0.64, color: '#4ac9bd' },
  { id: 'outro', name: 'Outro', start: 159, end: 222, lyrics: ['So let it fade, into the night', 'A neon memory, still shining bright'], emotion: 'Bittersweet', energy: 0.4, color: '#9879cb' },
]

export function sampleTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function waveformHeight(index: number): number {
  const pulse = Math.abs(Math.sin(index * 1.37) * Math.cos(index * 0.37))
  const rise = index < 40 ? 0.4 + index / 85 : index < 80 ? 0.88 : 0.65
  return Math.round(12 + (pulse * 66 + Math.abs(Math.sin(index * 0.19)) * 20) * rise)
}
