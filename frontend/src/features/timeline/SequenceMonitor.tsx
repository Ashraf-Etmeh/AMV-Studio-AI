import { useEffect, useRef } from 'react'
import { Clapperboard, Link2, Music2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { WorkspaceRepository } from '../../services/localWorkspaceRepository'
import type { PlacedClip, SequenceFrame } from './sequence'
import styles from './SequenceMonitor.module.css'

function syncElement(element: HTMLMediaElement | null, placed: PlacedClip | null, playing: boolean, onBlocked: () => void) {
  if (!element || !placed) return
  if (element.readyState > 0 && Math.abs(element.currentTime - placed.sourceTime) > (playing ? 0.35 : 0.02)) element.currentTime = placed.sourceTime
  if (playing && element.paused) {
    void element.play().catch((cause: unknown) => { if (!(cause instanceof DOMException) || cause.name !== 'AbortError') onBlocked() })
  } else if (!playing && !element.paused) element.pause()
}

export function SequenceMonitor({ frame, playing, repository, onMedia, onBlocked }: { frame: SequenceFrame; playing: boolean; repository: WorkspaceRepository; onMedia: () => void; onBlocked: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const visual = frame.visual
  const audio = frame.audio
  const visualUrl = visual ? repository.previewUrl(visual.clip.mediaId) : null
  const audioUrl = audio ? repository.previewUrl(audio.clip.mediaId) : null

  useEffect(() => {
    syncElement(videoRef.current, visual?.clip.track === 'video' ? visual : null, playing, onBlocked)
    syncElement(audioRef.current, audio, playing, onBlocked)
  }, [visual, audio, playing, onBlocked])

  return <div className={styles.monitor}>
    {visual ? visualUrl && visual.asset ? visual.clip.track === 'image' ? <img className={styles.picture} src={visualUrl} alt={`Preview of ${visual.asset.name}`} /> : <video className={styles.picture} key={visual.clip.id} ref={videoRef} src={visualUrl} muted playsInline preload="auto" aria-label={`Preview of ${visual.asset.name}`} onLoadedMetadata={() => syncElement(videoRef.current, visual, playing, onBlocked)} onCanPlay={() => syncElement(videoRef.current, visual, playing, onBlocked)} /> : <div className={styles.unavailable}><Link2 size={36} /><strong>File needs relinking</strong><p>Relink this visual source in Media to preview the sequence.</p><Button onClick={onMedia}>Open Media</Button></div> : <div className={styles.unavailable}><Clapperboard size={38} /><strong>{frame.duration ? 'No picture at this time' : 'No visual clips placed'}</strong><p>{frame.duration ? 'Extend the visual sequence to cover the music.' : 'Add video or still images to begin a sequence.'}</p></div>}
    {audio && audioUrl && audio.asset && <audio key={audio.clip.id} ref={audioRef} src={audioUrl} preload="auto" aria-label={`Preview of ${audio.asset.name}`} onLoadedMetadata={() => syncElement(audioRef.current, audio, playing, onBlocked)} onCanPlay={() => syncElement(audioRef.current, audio, playing, onBlocked)} />}
    {audio && !audioUrl && <span className={styles.audioMissing}>Music file needs relinking</span>}
    <div className={styles.mediaInfo}><span>{visual?.asset?.name ?? 'No picture'}</span><span><Music2 size={14} /> {audio?.asset?.name ?? 'No music at this time'}</span></div>
  </div>
}
