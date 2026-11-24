import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, AudioLines, Clapperboard, Film, Folder, Image as ImageIcon, Layers3, Music2, Sparkles } from 'lucide-react'
import { demoArt } from '../assets/demo/manifest'
import { Button } from '../components/ui/Button'
import { FeatureDialog } from '../features/projects/ProjectDialogs'
import type { FeatureKey } from '../features/projects/ProjectDialogs'
import type { Project } from '../features/projects/types'
import type { MediaAsset } from '../features/media/types'
import { formatBytes, formatMediaDuration } from '../features/media/types'
import { sampleSegments, sampleSong, sampleTime, waveformHeight } from '../features/song-analysis/sampleAnalysis'
import type { SampleSegment } from '../features/song-analysis/sampleAnalysis'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import styles from './SongAnalysis.module.css'

type AnalysisTab = 'lyrics' | 'structure' | 'beats' | 'emotion'

const tabs = [
  { id: 'lyrics', label: 'Lyric Segments', Icon: Layers3 },
  { id: 'structure', label: 'Structure', Icon: Film },
  { id: 'beats', label: 'Beats', Icon: Activity },
  { id: 'emotion', label: 'Emotion Curve', Icon: AudioLines },
] as const

function EnergyBar({ energy }: { energy: number }) {
  return <span className={styles.energyBar}><span style={{ width: `${energy * 100}%` }} /></span>
}

function SampleWaveform({ selected, onSelect, showBeats, sensitivity }: { selected: SampleSegment; onSelect: (id: string) => void; showBeats: boolean; sensitivity: number }) {
  const beatStep = sensitivity > 0.8 ? 5 : sensitivity > 0.55 ? 8 : 12
  return <div className={styles.wavePanel}>
    <div className={styles.waveTitle}><span><Music2 size={18} /> {sampleSong.title} <small>illustrative audio</small></span><strong>{sampleTime(sampleSong.duration)}</strong></div>
    <div className={styles.waveTrack} aria-label="Illustrative sample waveform">
      <div className={styles.waveBars} aria-hidden="true">{Array.from({ length: 112 }, (_, index) => <span key={index} style={{ height: `${waveformHeight(index)}%`, background: index > 75 ? '#52c6ee' : index > 42 ? '#a66ef6' : '#c064f1' }} />)}</div>
      {showBeats && <div className={styles.beatMarkers} aria-hidden="true">{Array.from({ length: Math.ceil(112 / beatStep) }, (_, index) => <i key={index} style={{ left: `${index * beatStep / 112 * 100}%` }} />)}</div>}
      <div className={styles.playhead} style={{ left: `${selected.start / sampleSong.duration * 100}%` }}><span>{sampleTime(selected.start)}</span></div>
    </div>
    <div className={styles.sectionStrip} aria-label="Sample song sections">{sampleSegments.map((segment) => <button key={segment.id} aria-pressed={selected.id === segment.id} onClick={() => onSelect(segment.id)} style={{ flex: segment.end - segment.start, '--segment-color': segment.color } as React.CSSProperties}>{segment.name}</button>)}</div>
    <div className={styles.waveRuler}><span>0:00</span><span>0:45</span><span>1:29</span><span>2:10</span><span>3:42</span></div>
  </div>
}

function AnalysisContent({ tab, selected, onSelect, showBeats, sensitivity }: { tab: AnalysisTab; selected: SampleSegment; onSelect: (id: string) => void; showBeats: boolean; sensitivity: number }) {
  if (tab === 'lyrics') return <>
    <div className={styles.tableHead}><span>#</span><span>Time Range</span><span>Section</span><span>Lyrics (excerpt)</span><span>Emotion</span><span>Energy</span></div>
    <div className={styles.segmentRows}>{sampleSegments.map((segment, index) => <button key={segment.id} className={`${styles.segmentRow} ${selected.id === segment.id ? styles.selectedRow : ''}`} onClick={() => onSelect(segment.id)} aria-current={selected.id === segment.id ? 'true' : undefined}>
      <span>{index + 1}</span><span>{sampleTime(segment.start)} – {sampleTime(segment.end)}</span><span><em style={{ backgroundColor: `${segment.color}55`, borderColor: `${segment.color}66` }}>{segment.name}</em></span><span className={styles.lyrics}>{segment.lyrics.map((line) => <i key={line}>{line}</i>)}</span><span><em className={styles.emotionPill}>{segment.emotion}</em></span><span className={styles.energyCell}><EnergyBar energy={segment.energy} />{segment.energy.toFixed(2)}</span>
    </button>)}</div>
  </>
  if (tab === 'structure') return <div className={styles.structureView}><h3>Sample song structure</h3><p>The colored sections are example timings from the supplied design.</p><div className={styles.structureTiles}>{sampleSegments.map((segment) => <button key={segment.id} onClick={() => onSelect(segment.id)} aria-pressed={selected.id === segment.id} style={{ '--segment-color': segment.color } as React.CSSProperties}><strong>{segment.name}</strong><span>{sampleTime(segment.start)} – {sampleTime(segment.end)}</span><small>{segment.end - segment.start} seconds</small></button>)}</div></div>
  if (tab === 'beats') return <div className={styles.beatsView}><h3>Illustrative beat markers</h3><p>128 BPM is sample data. Marker density below follows the display sensitivity control; it is not beat detection.</p><div className={styles.beatGrid}>{Array.from({ length: showBeats ? (sensitivity > 0.8 ? 32 : sensitivity > 0.55 ? 20 : 12) : 0 }, (_, index) => <span key={index} style={{ height: `${22 + (index % 4) * 16}px` }} />)}{!showBeats && <span className={styles.noBeats}>Markers are hidden. Turn on “Show demo markers” in Song Intelligence.</span>}</div></div>
  return <div className={styles.emotionView}><h3>Illustrative emotion curve</h3><p>Energy and emotion labels are sample values. Select a point to inspect its section.</p><div className={styles.curveCanvas}><svg viewBox="0 0 650 200" preserveAspectRatio="none" role="img" aria-label="Illustrative sample energy curve"><defs><linearGradient id="sample-curve" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#aa57e9" stopOpacity=".55"/><stop offset="100%" stopColor="#5d81ed" stopOpacity=".02"/></linearGradient></defs><path d="M0 146 C50 142 70 100 120 112 S200 92 270 44 S340 60 390 98 S485 65 520 105 S600 125 650 143 L650 200 L0 200Z" fill="url(#sample-curve)"/><path d="M0 146 C50 142 70 100 120 112 S200 92 270 44 S340 60 390 98 S485 65 520 105 S600 125 650 143" fill="none" stroke="#b16cf2" strokeWidth="3"/></svg></div><div className={styles.curvePoints}>{sampleSegments.map((segment) => <button key={segment.id} onClick={() => onSelect(segment.id)} aria-pressed={selected.id === segment.id}>{segment.name}<strong>{segment.energy.toFixed(2)}</strong></button>)}</div></div>
}

export function SongAnalysisPage({ projectId, repository, onHome, onProjects, onMedia, onScenes, onPlanner }: { projectId: string; repository: WorkspaceRepository; onHome: () => void; onProjects: () => void; onMedia: () => void; onScenes: () => void; onPlanner: () => void }) {
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'sample' | 'local'>('sample')
  const [localId, setLocalId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('chorus')
  const [tab, setTab] = useState<AnalysisTab>('lyrics')
  const [showBeats, setShowBeats] = useState(true)
  const [sensitivity, setSensitivity] = useState(0.7)
  const [feature, setFeature] = useState<FeatureKey | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([repository.list(), repository.listMedia(projectId)]).then(([projects, media]) => {
      if (!active) return
      setProject(projects.find((item) => item.id === projectId) ?? null)
      setAssets(media)
      setLocalId(media.find((item) => item.kind === 'audio')?.id ?? null)
      setLoading(false)
    }).catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not open song analysis.'); setLoading(false) } })
    return () => { active = false }
  }, [projectId, repository])

  const selected = sampleSegments.find((segment) => segment.id === selectedId) ?? sampleSegments[2]
  const audioAssets = assets.filter((item) => item.kind === 'audio')
  const localTrack = audioAssets.find((item) => item.id === localId) ?? audioAssets[0] ?? null
  const localUrl = localTrack ? repository.previewUrl(localTrack.id) : null
  const counts = { audio: audioAssets.length, video: assets.filter((item) => item.kind === 'video').length, image: assets.filter((item) => item.kind === 'image').length }

  return <div className={styles.page}>
    <a className="skip-link" href="#analysis-main">Skip to content</a>
    <header className={styles.topbar}><button className={styles.topBrand} onClick={onHome}><Clapperboard size={28} /> AMV Studio AI <span>AI</span></button><span className={styles.topDivider} /><button className={styles.breadcrumb} onClick={onProjects}>Projects</button><span className={styles.crumbArrow}>›</span><strong className={styles.crumbName}>{project?.name ?? 'Song Analysis'}</strong><Button onClick={onMedia}><ArrowLeft size={17} /> Back to Media</Button></header>
    <div className={styles.layout}>
      <aside className={styles.rail} aria-label="Project workflow"><button className={styles.railProject} onClick={onProjects}><Folder size={19} /> <span>{project?.name ?? 'Project'}</span></button><nav aria-label="Project steps"><button className={styles.railActive} aria-current="step" onClick={() => setMode('sample')}><Music2 size={21} /> <span>1&nbsp; Song Analysis</span></button><button onClick={onScenes}><Film size={21} /> <span>2&nbsp; Anime Library</span></button><button onClick={onPlanner}><Layers3 size={21} /> <span>3&nbsp; AMV Planner</span></button><button onClick={() => setFeature('generate')}><Activity size={21} /> <span>4&nbsp; Timeline & Edit</span></button><button onClick={() => setFeature('export')}><Clapperboard size={21} /> <span>5&nbsp; Render</span></button></nav><div className={styles.railAssets}><p>Project Assets</p><span><Music2 size={18} /> Music <b>{counts.audio}</b></span><span><Film size={18} /> Anime Videos <b>{counts.video}</b></span><span><ImageIcon size={18} /> Images <b>{counts.image}</b></span><button onClick={onMedia}><Folder size={18} /> Open media workspace</button></div></aside>
      <main id="analysis-main" className={styles.main} tabIndex={-1}>{loading ? <p role="status">Loading project…</p> : !project ? <div className={styles.missing}><h1>Project unavailable</h1><p>{error ?? 'This project was not found in this browser.'}</p><Button onClick={onProjects}>Back to projects</Button></div> : <>
        <div className={styles.heading}><div className={styles.headingImage}><img src={demoArt.songPreview} alt="" /></div><div><span className={styles.kicker}>SONG ANALYSIS</span><h1>{project.name}</h1><p>Explore music structure, lyrics, and emotion in a clearly labeled demo.</p></div></div>
        <div className={styles.modeSwitch} role="group" aria-label="Analysis source"><button className={mode === 'sample' ? styles.modeActive : ''} aria-pressed={mode === 'sample'} onClick={() => setMode('sample')}><Sparkles size={17} /> Demo analysis</button><button className={mode === 'local' ? styles.modeActive : ''} aria-pressed={mode === 'local'} onClick={() => setMode('local')}><Music2 size={17} /> Your music ({audioAssets.length})</button><span>Demo values are illustrative and unrelated to imported files.</span></div>
        {mode === 'local' ? <section className={styles.localView} aria-labelledby="local-heading"><div className={styles.localIntro}><span className={styles.localIcon}><Music2 size={36} /></span><div><h2 id="local-heading">Your imported music</h2><p>Play a selected local track here. Music analysis is not available yet.</p></div></div>{localTrack ? <><label htmlFor="local-song">Choose a track</label><select id="local-song" value={localTrack.id} onChange={(event) => setLocalId(event.target.value)}>{audioAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select>{localUrl ? <audio controls src={localUrl} aria-label={`Play ${localTrack.name}`} /> : <div className={styles.relinkNotice}>This track needs relinking before it can play. Open the media workspace and choose the original file.</div>}<dl><div><dt>File</dt><dd>{localTrack.name}</dd></div><div><dt>Duration</dt><dd>{localTrack.durationSeconds === null ? 'Unknown' : formatMediaDuration(localTrack.durationSeconds)}</dd></div><div><dt>Size</dt><dd>{formatBytes(localTrack.sizeBytes)}</dd></div></dl></> : <p className={styles.noMusic}>No music has been added to this project yet.</p>}<Button variant="primary" onClick={onMedia}>{localTrack && !localUrl ? 'Relink in Media' : 'Open Media Library'}</Button><div className={styles.localBoundary}><strong>Analysis status</strong><p>No BPM, lyrics, emotion, waveform, or sections have been inferred from your file. Switch to Demo analysis to explore the interface with sample data.</p></div></section> : <div className={styles.analysisGrid}>
          <div className={styles.centerColumn}><div className={styles.topPanels}><div className={styles.visualPanel}><img src={demoArt.songPreview} alt="Illustrative anime sunset scene from the supplied design reference" /><span>Illustrative visual · no playable video</span></div><SampleWaveform selected={selected} onSelect={setSelectedId} showBeats={showBeats} sensitivity={sensitivity} /></div><section className={styles.dataPanel} aria-label="Sample analysis details"><div className={styles.tabBar} role="tablist" aria-label="Sample analysis views">{tabs.map(({ id, label, Icon }) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}><Icon size={17} /> {label}</button>)}<span>Reference sample</span></div>{tab === 'lyrics' && <p className={styles.tableScrollHint}>Scroll sideways to see lyrics, emotion, and energy →</p>}<div role="tabpanel" className={styles.tabContent}><AnalysisContent tab={tab} selected={selected} onSelect={setSelectedId} showBeats={showBeats} sensitivity={sensitivity} /></div><div className={styles.selectedDetail} role="status"><strong>Selected: {selected.name}</strong><span>{sampleTime(selected.start)} – {sampleTime(selected.end)} · {selected.emotion} · energy {selected.energy.toFixed(2)}</span></div></section></div>
          <aside className={styles.inspector} aria-label="Sample song insights"><section className={styles.inspectorCard}><div className={styles.inspectorTitle}><Sparkles size={22} /><h2>Song Intelligence</h2><span>DEMO</span></div><div className={styles.intelRow}><AudioLines size={20} /><span>BPM</span><strong>{sampleSong.bpm}</strong></div><div className={styles.intelRow}><Activity size={20} /><span>Energy</span><strong>{sampleSong.energy.toFixed(2)}</strong><EnergyBar energy={sampleSong.energy} /></div><div className={styles.emotionScores}><h3>Overall Emotion</h3><div>{sampleSong.emotions.map((item) => <span key={item.name}>{item.name} <b>{item.value.toFixed(2)}</b></span>)}</div></div><div className={styles.beatSettings}><label><input type="checkbox" checked={showBeats} onChange={(event) => setShowBeats(event.target.checked)} /> Show demo markers</label><p>Display only. No cuts or beat detection occur.</p><label htmlFor="demo-sensitivity">Marker density <output>{sensitivity.toFixed(2)}</output></label><input id="demo-sensitivity" type="range" min="0" max="1" step="0.01" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} /></div></section><section className={styles.inspectorCard}><div className={styles.inspectorTitle}><Layers3 size={22} /><h2>Music Structure</h2><span>DEMO</span></div><div className={styles.structureList}>{sampleSegments.map((segment) => <button key={segment.id} className={selected.id === segment.id ? styles.structureSelected : ''} onClick={() => setSelectedId(segment.id)}><i style={{ backgroundColor: segment.color }} /><strong>{segment.name}</strong><span>{sampleTime(segment.start)} – {sampleTime(segment.end)}</span></button>)}</div></section></aside>
        </div>}
      </>}</main>
    </div>
    {feature && <FeatureDialog feature={feature} onClose={() => setFeature(null)} closeLabel="Close" />}
  </div>
}
