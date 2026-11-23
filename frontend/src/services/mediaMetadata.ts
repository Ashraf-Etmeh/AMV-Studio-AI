import type { MediaKind } from '../features/media/types'

export interface MediaDetails {
  durationSeconds: number | null
  width: number | null
  height: number | null
}

// The browser reads only enough of the selected local file to report native
// dimensions/duration. No waveform, scene, lyric, or emotion inference occurs.
export async function readMediaDetails(url: string, kind: MediaKind): Promise<MediaDetails> {
  const unknown = { durationSeconds: null, width: null, height: null }
  if (kind === 'image') {
    return new Promise((resolve) => {
      const image = new Image()
      const timeout = window.setTimeout(() => finish(unknown), 8_000)
      function finish(details: MediaDetails) {
        window.clearTimeout(timeout)
        image.onload = null
        image.onerror = null
        resolve(details)
      }
      image.onload = () => finish({ durationSeconds: null, width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => finish(unknown)
      image.src = url
    })
  }
  return new Promise((resolve) => {
    const element = document.createElement(kind)
    element.preload = 'metadata'
    const timeout = window.setTimeout(() => finish(unknown), 8_000)
    function finish(details: MediaDetails) {
      window.clearTimeout(timeout)
      element.onloadedmetadata = null
      element.onerror = null
      element.removeAttribute('src')
      element.load()
      resolve(details)
    }
    element.onloadedmetadata = () => {
      const video = kind === 'video' ? element as HTMLVideoElement : null
      finish({
        durationSeconds: Number.isFinite(element.duration) ? element.duration : null,
        width: video?.videoWidth || null,
        height: video?.videoHeight || null,
      })
    }
    element.onerror = () => finish(unknown)
    element.src = url
  })
}
