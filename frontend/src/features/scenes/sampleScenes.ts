import { demoArt } from '../../assets/demo/manifest'

export interface SampleScene {
  id: string
  title: string
  image: string
  source: string
  start: string
  end: string
  duration: string
  emotion: string
  action: string
  characters: string[]
  motion: number
  description: string
  tags: string[]
  keywords: string[]
}

// Hand-authored demonstration metadata based on the supplied Scene Library image.
// These records are never attached to a user's imported videos or described as inference.
export const sampleScenes: SampleScene[] = [
  { id: 'crying', title: 'Crying in the Rain', image: demoArt.sceneCrying, source: 'Episode 01.mp4', start: '00:12:34', end: '00:12:42', duration: '8 sec', emotion: 'Sadness', action: 'Crying', characters: ['A'], motion: 0.22, description: 'Character A cries alone in the rain, expressing a deep sense of loss and longing.', tags: ['Loss', 'Longing', 'Close-up'], keywords: ['tears', 'rain', 'alone', 'grief'] },
  { id: 'confrontation', title: 'Final Confrontation', image: demoArt.sceneConfrontation, source: 'Episode 02.mp4', start: '00:15:08', end: '00:15:18', duration: '10 sec', emotion: 'Intensity', action: 'Fight', characters: ['A', 'B'], motion: 0.94, description: 'A dramatic sword fight reaches its decisive moment.', tags: ['Conflict', 'Determination', 'Action'], keywords: ['battle', 'sword', 'power'] },
  { id: 'sunset', title: 'Alone at Sunset', image: demoArt.sceneSunset, source: 'Episode 01.mp4', start: '00:18:27', end: '00:18:40', duration: '13 sec', emotion: 'Melancholy', action: 'Still', characters: ['A'], motion: 0.12, description: 'Character A stands above the city at sunset, reflecting on a farewell.', tags: ['Loneliness', 'Reflection', 'Landscape'], keywords: ['alone', 'sky', 'sunset', 'quiet'] },
  { id: 'reaching', title: 'Reaching Out', image: demoArt.sceneReaching, source: 'Episode 02.mp4', start: '00:20:11', end: '00:20:19', duration: '8 sec', emotion: 'Desperation', action: 'Reaching', characters: ['A', 'B'], motion: 0.61, description: 'Character A reaches toward someone just out of frame, hoping to reconnect.', tags: ['Connection', 'Hope', 'Emotional'], keywords: ['hand', 'reach', 'rescue'] },
  { id: 'reunion', title: 'Reunion', image: demoArt.sceneReunion, source: 'Movie Clip.mp4', start: '00:22:03', end: '00:22:16', duration: '13 sec', emotion: 'Joy', action: 'Embrace', characters: ['A', 'B'], motion: 0.38, description: 'Two characters meet again and embrace beneath a warm evening sky.', tags: ['Relief', 'Emotional', 'Together'], keywords: ['hug', 'comfort', 'hope'] },
]

export interface SceneFilters {
  query: string
  emotion: string
  action: string
  character: string
  maxMotion: number
  favoritesOnly: boolean
  favorites: ReadonlySet<string>
  sort: 'reference' | 'title'
}

export function filterSampleScenes(filters: SceneFilters): SampleScene[] {
  const terms = filters.query.toLocaleLowerCase().replace(/[“”"']/g, '').split(/\s+/).filter((word) => word && word !== 'and' && word !== 'or')
  const result = sampleScenes.filter((scene) => {
    const searchable = [scene.title, scene.emotion, scene.action, scene.description, ...scene.tags, ...scene.keywords].join(' ').toLocaleLowerCase()
    return terms.every((term) => searchable.includes(term)) &&
      (!filters.emotion || scene.emotion === filters.emotion) &&
      (!filters.action || scene.action === filters.action) &&
      (!filters.character || scene.characters.includes(filters.character)) &&
      scene.motion <= filters.maxMotion &&
      (!filters.favoritesOnly || filters.favorites.has(scene.id))
  })
  return filters.sort === 'title' ? result.sort((a, b) => a.title.localeCompare(b.title)) : result
}
