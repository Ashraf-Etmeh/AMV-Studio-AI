export interface Project {
  id: string
  name: string
  thumbnail: 'sky' | 'blossoms' | 'summer' | null
  durationSeconds: number | null
  editedLabel: string
  source: 'sample' | 'local'
}

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function validateProjectName(value: string): string | null {
  if (!value.trim()) return 'Give your project a name.'
  if (value.trim().length > 80) return 'Use 80 characters or fewer.'
  return null
}
