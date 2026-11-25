import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clapperboard, Film, Image as ImageIcon, Link2, Music2, Pause, Play, Plus, Redo2, Scissors, Trash2, Undo2, XCircle, ZoomIn } from 'lucide-react'
import { Button } from '../components/ui/Button'
import type { MediaAsset } from '../features/media/types'
import type { Project } from '../features/projects/types'
import { clipDuration, clipStart, createTimelineClip, formatTimelineTime, moveTimelineClip, newHistory, recordEdit, redoEdit, removeTimelineClip, reorderTimelineClip, trackOrder, trimTimelineClip, undoEdit } from '../features/timeline/editing'
import type { TimelineClip, TimelineHistory } from '../features/timeline/editing'
import { SequenceMonitor } from '../features/timeline/SequenceMonitor'
import { clipsInSequence, exportReadiness, sequenceDurations, sequenceFrameAt } from '../features/timeline/sequence'
import { useSequencePlayback } from '../features/timeline/useSequencePlayback'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import styles from './Timeline.module.css'

type Props = {
  projectId: string
  repository: WorkspaceRepository
  onHome: () => void
  onProjects: () => void
  onMedia: () => void
  onAnalysis: () => void
  onScenes: () => void
  onPlanner: () => void
}

export function TimelinePage({ projectId, repository, onHome, onProjects, onMedia, onAnalysis, onScenes, onPlanner }: Props) {
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [history, setHistory] = useState<TimelineHistory>(newHistory())
  const historyRef = useRef(history)
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sourceIn, setSourceIn] = useState('0')
  const [sourceOut, setSourceOut] = useState('0')
  const [zoom, setZoom] = useState(48)
  const [previewMode, setPreviewMode] = useState<'sequence' | 'source'>('sequence')
  const previewRef = useRef<HTMLMediaElement>(null)
  const draggedId = useRef<string | null>(null)

  useEffect(() => {
    let current = true
    Promise.all([repository.list(), repository.listMedia(projectId), repository.listTimeline(projectId)]).then(([projects, media, clips]) => {
      if (!current) return
      setProject(projects.find((item) => item.id === projectId) ?? null)
      setAssets(media)
      const initial = newHistory(clips)
      historyRef.current = initial
      setHistory(initial)
      setSelectedId(clips[0]?.id ?? null)
      setSourceIn(clips[0] ? String(clips[0].sourceIn) : '0')
      setSourceOut(clips[0] ? String(clips[0].sourceOut) : '0')
      setLoading(false)
    }).catch((cause) => { if (current) { setError(cause instanceof Error ? cause.message : 'Could not load timeline.'); setLoading(false) } })
    return () => { current = false }
  }, [projectId, repository])

  const clips = history.present
  const selected = clips.find((clip) => clip.id === selectedId) ?? null
  const selectedAsset = selected ? assets.find((asset) => asset.id === selected.mediaId) ?? null : null
  const selectedTrackClips = selected ? clipsInSequence(clips, selected) : []
  const selectedTrackIndex = selectedTrackClips.findIndex((clip) => clip.id === selectedId)
  const previewUrl = selectedAsset ? repository.previewUrl(selectedAsset.id) : null
  const durations = sequenceDurations(clips)
  const playback = useSequencePlayback(durations.total)
  const frame = sequenceFrameAt(clips, assets, playback.position)
  const readiness = exportReadiness(clips, assets, (id) => Boolean(repository.previewUrl(id)))
  const maxDuration = Math.max(15, durations.total)
  const laneWidth = Math.max(720, Math.ceil(maxDuration * zoom) + 90)
  const tickStep = zoom >= 55 ? 5 : 10
  const ticks = Array.from({ length: Math.floor(maxDuration / tickStep) + 1 }, (_, index) => index * tickStep)

  function selectClip(id: string | null, sourceClips: TimelineClip[] = historyRef.current.present) {
    const clip = sourceClips.find((item) => item.id === id)
    playback.pause()
    playback.seek(clip ? clipStart(sourceClips, clip.id) : 0)
    setSelectedId(id)
    setSourceIn(clip ? String(clip.sourceIn) : '0')
    setSourceOut(clip ? String(clip.sourceOut) : '0')
  }

  async function persist(next: TimelineHistory, selection: string | null = selectedId) {
    if (busyRef.current || next === historyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError(null)
    try {
      await repository.saveTimeline(projectId, next.present)
      historyRef.current = next
      setHistory(next)
      selectClip(selection, next.present)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save timeline.')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function edit(nextClips: TimelineClip[], selection: string | null = selectedId) {
    void persist(recordEdit(historyRef.current, nextClips), selection)
  }

  function add(asset: MediaAsset) {
    try {
      const clip = createTimelineClip(asset, crypto.randomUUID())
      edit([...historyRef.current.present, clip], clip.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add clip.') }
  }

  function trim() {
    if (!selected || !selectedAsset) return
    try {
      if (!sourceIn.trim() || !sourceOut.trim()) throw new Error('Enter valid trim times.')
      edit(trimTimelineClip(historyRef.current.present, selected.id, Number(sourceIn), Number(sourceOut), selectedAsset))
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not trim clip.') }
  }

  function changeHistory(direction: 'undo' | 'redo') {
    const next = direction === 'undo' ? undoEdit(historyRef.current) : redoEdit(historyRef.current)
      const nextSelection = next.present.some((clip) => clip.id === selectedId) ? selectedId : next.present.at(-1)?.id ?? null
    void persist(next, nextSelection)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return
      const key = event.key.toLowerCase()
      if (key === 'z' || key === 'y') {
        event.preventDefault()
        const next = key === 'y' || event.shiftKey ? redoEdit(historyRef.current) : undoEdit(historyRef.current)
        const selection = next.present.some((clip) => clip.id === selectedId) ? selectedId : next.present.at(-1)?.id ?? null
        void persist(next, selection)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function seekToIn() {
    if (previewRef.current && selected) previewRef.current.currentTime = selected.sourceIn
  }

  function stopAtOut() {
    if (previewRef.current && selected && previewRef.current.currentTime >= selected.sourceOut) {
      previewRef.current.pause()
      previewRef.current.currentTime = selected.sourceIn
    }
  }

  return <div className={styles.page}>
    <a className="skip-link" href="#timeline-main">Skip to timeline</a>
    <header className={styles.topbar}><button className={styles.brand} onClick={onHome}><Clapperboard size={29} /><strong>AMV Studio AI</strong></button><span className={styles.context}>Timeline Editor</span><nav aria-label="Studio sections"><button onClick={onProjects}>Projects</button><button onClick={onMedia}>Media</button><button onClick={onAnalysis}>Analyze</button><button onClick={onScenes}>Scenes</button><button onClick={onPlanner}>Planner</button><button className={styles.active} aria-current="page">Timeline</button></nav></header>
    <main id="timeline-main" className={styles.main} tabIndex={-1}>{loading ? <p role="status">Opening timeline…</p> : !project ? <div className={styles.missing}><h1>Project unavailable</h1><p>{error ?? 'This project was not found in this browser.'}</p><Button onClick={onProjects}>Back to projects</Button></div> : <>
      <div className={styles.heading}><div><span className={styles.eyebrow}>LOCAL PROJECT EDIT · {project.source === 'sample' ? 'REFERENCE PROJECT' : 'YOUR PROJECT'}</span><h1>{project.name}</h1><p>Arrange imported music, videos, and stills. Edits are saved in this browser.</p></div><Button onClick={onMedia}><Link2 size={17} /> Import or relink media</Button></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.workbench}>
        <aside className={styles.library} aria-label="Project media"><div className={styles.panelTitle}><h2>Media Library</h2><span>{assets.length} files</span></div><p className={styles.panelHint}>Add a file to its matching track. Video and music need a readable duration.</p>{assets.length ? <div className={styles.assetList}>{assets.map((asset) => { const Icon = asset.kind === 'audio' ? Music2 : asset.kind === 'video' ? Film : ImageIcon; const url = repository.previewUrl(asset.id); return <div className={styles.asset} key={asset.id}><div className={styles.assetThumb}>{asset.kind === 'image' && url ? <img src={url} alt="" /> : <Icon size={23} />}</div><div className={styles.assetName}><strong title={asset.name}>{asset.name}</strong><small>{asset.kind} · {asset.durationSeconds === null ? asset.kind === 'image' ? 'still' : 'duration unknown' : formatTimelineTime(asset.durationSeconds)}</small></div><button onClick={() => add(asset)} disabled={busy} aria-label={`Add ${asset.name} to timeline`} title="Add to timeline"><Plus size={20} /></button></div> })}</div> : <div className={styles.emptyLibrary}><Film size={32} /><strong>No imported media</strong><p>Choose files from your computer to begin a real edit.</p><Button variant="primary" onClick={onMedia}>Open Media Library</Button></div>}<div className={styles.libraryFooter}>Media bytes remain on your computer. Relink files in Media after a reload to preview them again.</div></aside>
        <section className={styles.previewPanel} aria-label="Project preview">
          <div className={styles.panelTitle}><h2>{previewMode === 'sequence' ? 'Sequence monitor' : 'Source preview'}</h2><div className={styles.previewTabs} role="group" aria-label="Preview mode"><button className={previewMode === 'sequence' ? styles.previewTabActive : ''} aria-pressed={previewMode === 'sequence'} onClick={() => setPreviewMode('sequence')}>Sequence</button><button className={previewMode === 'source' ? styles.previewTabActive : ''} aria-pressed={previewMode === 'source'} onClick={() => { playback.pause(); setPreviewMode('source') }}>Source</button></div></div>
          <div className={styles.previewStage}>{previewMode === 'sequence' ? <SequenceMonitor frame={frame} playing={playback.playing} repository={repository} onMedia={onMedia} onBlocked={() => { playback.pause(); setError('Playback could not start in this browser. Check the source files and try again.') }} /> : selected && selectedAsset ? previewUrl ? selectedAsset.kind === 'image' ? <img src={previewUrl} alt={`Preview of ${selectedAsset.name}`} /> : selectedAsset.kind === 'video' ? <video key={selected.id} ref={previewRef as React.RefObject<HTMLVideoElement>} src={previewUrl} controls preload="metadata" aria-label={`Preview of ${selectedAsset.name}`} onLoadedMetadata={seekToIn} onPlay={() => { if (previewRef.current && (previewRef.current.currentTime < selected.sourceIn || previewRef.current.currentTime >= selected.sourceOut)) seekToIn() }} onTimeUpdate={stopAtOut} /> : <div className={styles.audioPreview}><Music2 size={56} /><audio key={selected.id} ref={previewRef as React.RefObject<HTMLAudioElement>} src={previewUrl} controls preload="metadata" aria-label={`Preview of ${selectedAsset.name}`} onLoadedMetadata={seekToIn} onPlay={() => { if (previewRef.current && (previewRef.current.currentTime < selected.sourceIn || previewRef.current.currentTime >= selected.sourceOut)) seekToIn() }} onTimeUpdate={stopAtOut} /></div> : <div className={styles.previewEmpty}><Link2 size={39} /><strong>File needs relinking</strong><p>The timeline edit is saved. Relink the original file in Media to preview this clip.</p><Button onClick={onMedia}>Open Media</Button></div> : <div className={styles.previewEmpty}><Clapperboard size={42} /><strong>Select a timeline clip</strong><p>Add a project file, then select its clip to preview and trim it.</p></div>}</div>
          {previewMode === 'sequence' ? <div className={styles.transport}><button className={styles.playButton} aria-label={playback.playing ? 'Pause sequence' : 'Play sequence'} onClick={() => { if (playback.playing) playback.pause(); else playback.play() }} disabled={!readiness.canPreview}>{playback.playing ? <Pause size={19} /> : <Play size={19} />}</button><span className={styles.timecode}>{formatTimelineTime(playback.position)} / {formatTimelineTime(durations.total)}</span><input type="range" aria-label="Sequence position" min="0" max={Math.max(durations.total, 0.01)} step="0.01" value={playback.position} onChange={(event) => playback.seek(Number(event.target.value))} disabled={!durations.total} /><span className={styles.transportHint}>{readiness.canPreview ? 'Local sequence preview · video source sound muted' : clips.length ? 'Relink placed media to play' : 'Place media to play'}</span></div> : <div className={styles.previewCaption}><strong>{selectedAsset?.name ?? 'No clip selected'}</strong><span>{selected ? `Source ${formatTimelineTime(selected.sourceIn)} – ${formatTimelineTime(selected.sourceOut)} · ${formatTimelineTime(clipDuration(selected))} placed` : 'Select a clip to inspect its original file'}</span></div>}
        </section>
        <aside className={styles.inspector} aria-label="Clip inspector">
          <div className={styles.panelTitle}><h2>Clip Details</h2><Scissors size={19} /></div>
          {selected && selectedAsset ? <div className={styles.inspectorBody}>
            <span className={styles.clipKind}>{selected.track === 'image' ? 'STILL IMAGE' : selected.track === 'video' ? 'VIDEO CLIP' : 'MUSIC CLIP'}</span>
            <h3 title={selectedAsset.name}>{selectedAsset.name}</h3>
            <dl><div><dt>Track</dt><dd>{trackOrder.find((track) => track.id === selected.track)?.title}</dd></div><div><dt>Timeline start</dt><dd>{formatTimelineTime(clipStart(clips, selected.id))}</dd></div><div><dt>Placed length</dt><dd>{formatTimelineTime(clipDuration(selected))}</dd></div></dl>
            <form onSubmit={(event) => { event.preventDefault(); trim() }}>
              <h4>{selected.track === 'image' ? 'Still duration' : 'Trim source'}</h4>
              {selected.track !== 'image' && <label>In (seconds)<input type="number" min="0" step="any" value={sourceIn} onChange={(event) => setSourceIn(event.target.value)} /></label>}
              <label>{selected.track === 'image' ? 'Duration (seconds)' : 'Out (seconds)'}<input type="number" min={selected.track === 'image' ? '0.5' : '0.1'} max={selected.track === 'image' ? '300' : selectedAsset.durationSeconds ?? undefined} step="any" value={sourceOut} onChange={(event) => setSourceOut(event.target.value)} /></label>
              <Button variant="primary" type="submit" disabled={busy}><Scissors size={16} /> Apply trim</Button>
            </form>
            <div className={styles.editActions}><Button onClick={() => edit(moveTimelineClip(clips, selected.id, -1))} disabled={busy || selectedTrackIndex <= 0}><ArrowLeft size={16} /> Move earlier</Button><Button onClick={() => edit(moveTimelineClip(clips, selected.id, 1))} disabled={busy || selectedTrackIndex >= selectedTrackClips.length - 1}>Move later <ArrowRight size={16} /></Button></div>
            <Button variant="quiet" onClick={() => edit(removeTimelineClip(clips, selected.id), null)} disabled={busy}><Trash2 size={16} /> Remove clip</Button>
          </div> : <div className={styles.inspectorEmpty}><p>Select a clip on a track to edit its source range, change order, or remove it.</p></div>}
        </aside>
      </div>
      <section className={styles.readinessPanel} aria-labelledby="readiness-heading"><div><span className={styles.eyebrow}>PRE-RENDER CHECK</span><h2 id="readiness-heading">Export readiness</h2><p>{readiness.ready ? 'The edit passes the available checks for a future renderer.' : 'Resolve these items before this edit could be rendered.'} Rendering and file export are not implemented yet.</p></div><ul>{readiness.checks.map((check) => <li key={check.id} className={check.passed ? styles.checkPassed : styles.checkBlocked}>{check.passed ? <CheckCircle2 size={17} /> : <XCircle size={17} />}<span><strong>{check.label}</strong><small>{check.detail}</small></span></li>)}</ul></section>
      <section className={styles.timelinePanel} aria-labelledby="tracks-heading">
        <div className={styles.timelineToolbar}>
          <div><h2 id="tracks-heading">Timeline</h2><span>{clips.length} placed clips · sequential tracks</span></div>
          <div className={styles.toolbarControls}>
            <Button onClick={() => changeHistory('undo')} disabled={busy || !history.past.length} aria-label="Undo edit"><Undo2 size={17} /> Undo</Button>
            <Button onClick={() => changeHistory('redo')} disabled={busy || !history.future.length} aria-label="Redo edit"><Redo2 size={17} /> Redo</Button>
            <label><ZoomIn size={18} /> Zoom <input type="range" min="24" max="100" step="4" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          </div>
        </div>
        <div className={styles.trackScroller}>
          <div className={styles.rulerRow}><span className={styles.trackLabel}>TRACKS</span><div className={styles.ruler} style={{ width: laneWidth, backgroundSize: `${zoom}px 100%` }}>{ticks.map((time) => <span key={time} style={{ left: time * zoom }}>{formatTimelineTime(time)}</span>)}<i className={styles.rulerPlayhead} style={{ left: playback.position * zoom }} aria-hidden="true" /></div></div>
          {trackOrder.map((track) => {
            const trackClips = clips.filter((clip) => clip.track === track.id)
            const Icon = track.id === 'audio' ? Music2 : track.id === 'video' ? Film : ImageIcon
            return <div className={styles.trackRow} key={track.id}>
              <div className={styles.trackLabel}><Icon size={19} /><span>{track.title}</span></div>
              <div className={`${styles.lane} ${styles[track.id]}`} style={{ width: laneWidth, backgroundSize: `${zoom}px 100%` }}>
                <i className={styles.lanePlayhead} style={{ left: playback.position * zoom }} aria-hidden="true" />
                {trackClips.length ? trackClips.map((clip) => {
                  const asset = assets.find((item) => item.id === clip.mediaId)
                  const start = clipStart(clips, clip.id)
                  const url = asset ? repository.previewUrl(asset.id) : null
                  return <button key={clip.id} draggable={!busy} onDragStart={(event) => { draggedId.current = clip.id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', clip.id) }} onDragEnd={() => { draggedId.current = null }} onDragOver={(event) => { if (draggedId.current && draggedId.current !== clip.id) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const dragId = draggedId.current; draggedId.current = null; if (dragId) edit(reorderTimelineClip(historyRef.current.present, dragId, clip.id, event.clientX > event.currentTarget.getBoundingClientRect().left + event.currentTarget.offsetWidth / 2)) }} className={`${styles.timelineClip} ${selectedId === clip.id ? styles.clipSelected : ''}`} style={{ left: start * zoom, width: Math.max(12, clipDuration(clip) * zoom) }} onClick={() => selectClip(clip.id)} aria-pressed={selectedId === clip.id} aria-label={`Select ${asset?.name ?? 'missing media'} clip on ${track.title}`} title={`${asset?.name ?? 'Missing media'} · ${formatTimelineTime(start)}–${formatTimelineTime(start + clipDuration(clip))}`}>
                    {track.id === 'image' && url && <img src={url} alt="" />}<span>{asset?.name ?? 'Missing media'}</span><small>{formatTimelineTime(clipDuration(clip))}</small>
                  </button>
                }) : <span className={styles.emptyLane}>Add {track.title.toLowerCase()} from Media Library</span>}
              </div>
            </div>
          })}
        </div>
        <p className={styles.timelineNote}>Video and stills form one visual sequence in their saved order; music runs alongside it. Drag a clip onto another visual clip or use Move earlier/later to reorder. The sequence monitor plays local files; rendering, gaps, transitions, and effects remain future work.</p>
      </section>
    </>}</main>
  </div>
}
