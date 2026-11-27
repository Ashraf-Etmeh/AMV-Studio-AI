import type { MediaAsset } from '../media/types'
import type { Project } from '../projects/types'
import { clipStart } from './editing'
import type { TimelineClip } from './editing'
import { exportReadiness, sequenceDurations } from './sequence'

export interface ProcessingManifest {
  schemaVersion: 1
  project: { id: string; name: string }
  visualDurationSeconds: number
  audioDurationSeconds: number
  media: { id: string; name: string; kind: MediaAsset['kind']; mimeType: string; sizeBytes: number }[]
  clips: { id: string; mediaId: string; track: TimelineClip['track']; sourceIn: number; sourceOut: number; sequenceStart: number }[]
}

export interface ProcessingBundle {
  manifest: ProcessingManifest
  files: { mediaId: string; blob: Blob }[]
}

export function buildProcessingManifest(project: Project, assets: MediaAsset[], clips: TimelineClip[]): ProcessingManifest {
  const readiness = exportReadiness(clips, assets, () => true)
  if (!readiness.ready) throw new Error(readiness.checks.filter((check) => !check.passed).map((check) => check.detail).join(' '))
  const byId = new Map(assets.map((asset) => [asset.id, asset]))
  const usedMedia = [...new Set(clips.map((clip) => clip.mediaId))].map((id) => byId.get(id)!)
  for (const clip of clips) {
    const asset = byId.get(clip.mediaId)
    if (!asset || asset.projectId !== project.id || asset.kind !== clip.track || !Number.isFinite(clip.sourceIn) || !Number.isFinite(clip.sourceOut) ||
      clip.sourceIn < 0 || clip.sourceOut <= clip.sourceIn || (asset.kind === 'image' && (clip.sourceIn !== 0 || clip.sourceOut > 300)) ||
      (asset.kind !== 'image' && (asset.durationSeconds === null || clip.sourceOut > asset.durationSeconds + 0.001))) {
      throw new Error('A timeline clip does not match its saved project media.')
    }
  }
  const duration = sequenceDurations(clips)
  return {
    schemaVersion: 1,
    project: { id: project.id, name: project.name },
    visualDurationSeconds: duration.visual,
    audioDurationSeconds: duration.audio,
    media: usedMedia.map((asset) => ({ id: asset.id, name: asset.name, kind: asset.kind, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes })),
    clips: clips.map((clip) => ({ id: clip.id, mediaId: clip.mediaId, track: clip.track, sourceIn: clip.sourceIn, sourceOut: clip.sourceOut, sequenceStart: clipStart(clips, clip.id) })),
  }
}

export function processingFormData(bundle: ProcessingBundle): FormData {
  const form = new FormData()
  form.append('manifest', new Blob([JSON.stringify(bundle.manifest)], { type: 'application/json' }), 'manifest.json')
  for (const file of bundle.files) form.append('media', file.blob, file.mediaId)
  return form
}
