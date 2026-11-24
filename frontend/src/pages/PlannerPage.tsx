import { useEffect, useState } from 'react'
import { ArrowRight, AudioLines, Check, Clapperboard, Film, Folder, Layers3, Music2, RotateCcw, Sparkles, Upload, WandSparkles } from 'lucide-react'
import { demoArt } from '../assets/demo/manifest'
import { Button } from '../components/ui/Button'
import { FeatureDialog } from '../features/projects/ProjectDialogs'
import type { Project } from '../features/projects/types'
import type { MediaAsset } from '../features/media/types'
import { samplePlans, sampleAlternatives, sampleScene, changedBeatCount } from '../features/planner/samplePlans'
import type { SamplePlan } from '../features/planner/samplePlans'
import { sampleSegments, sampleSong, sampleTime } from '../features/song-analysis/sampleAnalysis'
import type { SampleSegment } from '../features/song-analysis/sampleAnalysis'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import styles from './Planner.module.css'

type PlannerMode = 'director' | 'copilot'

function Storyboard({ sceneBySegment, selectedId, onSelect, mode }: { sceneBySegment: Record<string, string>; selectedId: string; onSelect: (id: string) => void; mode: PlannerMode }) {
  return <section className={styles.storyboard} aria-labelledby="storyboard-heading">
    <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>ILLUSTRATIVE SEQUENCE</span><h2 id="storyboard-heading">{mode === 'director' ? 'Director preview' : 'Copilot draft'}</h2></div><span>One example visual moment per song section · no cuts placed</span></div>
    <p className={styles.railHint}>Scroll sideways to see all six sample beats →</p>
    <div className={styles.beatRail} aria-label="Sample story beats">{sampleSegments.map((segment, index) => {
      const scene = sampleScene(sceneBySegment[segment.id])
      return <button key={segment.id} className={`${styles.beatCard} ${selectedId === segment.id ? styles.beatSelected : ''}`} aria-pressed={selectedId === segment.id} aria-label={`Select beat ${index + 1}, ${segment.name}`} onClick={() => onSelect(segment.id)}>
        <span className={styles.beatImage}><img src={scene.image} alt="" /><small>{index + 1}</small></span>
        <span className={styles.beatInfo}><strong>{segment.name}</strong><span>{sampleTime(segment.start)} – {sampleTime(segment.end)}</span><em>{scene.title}</em></span>
      </button>
    })}</div>
  </section>
}

function DirectorPanel({ selectedPlan, selectedId, onChoose, onApply, segment }: { selectedPlan: SamplePlan; selectedId: string; onChoose: (id: string) => void; onApply: () => void; segment: SampleSegment }) {
  return <><div className={styles.assistantTitle}><WandSparkles size={22} /><div><h2>AI Director</h2><p>Two hand-authored example story arcs</p></div><span>DEMO</span></div><div className={styles.assistantBody}><p className={styles.assistantBoundary}>Select an example to preview its sequence. Applying it only changes the in-memory sample draft.</p><div className={styles.planOptions}>{samplePlans.map((plan) => <button key={plan.id} className={`${styles.planOption} ${selectedId === plan.id ? styles.planSelected : ''}`} aria-pressed={selectedId === plan.id} onClick={() => onChoose(plan.id)}><span className={styles.planImages}>{sampleSegments.slice(0, 3).map((item) => <img key={item.id} src={sampleScene(plan.sceneBySegment[item.id]).image} alt="" />)}</span><strong>{plan.name}</strong><small>{plan.tone}</small><span>{plan.premise}</span></button>)}</div><div className={styles.planReason}><span className={styles.eyebrow}>WHY THIS SAMPLE BEAT?</span><p>{selectedPlan.noteBySegment[segment.id]}</p></div><Button variant="primary" onClick={onApply}><Check size={18} /> Use this sample plan</Button></div></>
}

function CopilotPanel({ segment, currentSceneId, onReplace, onReset, changedCount }: { segment: SampleSegment; currentSceneId: string; onReplace: (id: string) => void; onReset: () => void; changedCount: number }) {
  return <><div className={styles.assistantTitle}><Sparkles size={22} /><div><h2>AI Copilot</h2><p>Review one sample beat at a time</p></div><span>DEMO</span></div><div className={styles.assistantBody}><p className={styles.assistantBoundary}>These alternatives and explanations were written for the prototype. No model ranked your clips or analyzed your media.</p><div className={styles.copilotContext}><span className={styles.eyebrow}>SELECTED SONG SECTION</span><strong>{segment.name} · {sampleTime(segment.start)} – {sampleTime(segment.end)}</strong><small>Illustrative energy {segment.energy.toFixed(2)} · {segment.emotion}</small></div><h3>Sample alternatives</h3><div className={styles.alternatives}>{sampleAlternatives[segment.id].map((alternative) => {
    const scene = sampleScene(alternative.sceneId)
    const current = scene.id === currentSceneId
    return <article key={scene.id} className={current ? styles.alternativeCurrent : ''}><img src={scene.image} alt="" /><div><strong>{scene.title}</strong><p>{alternative.note}</p><span>{scene.emotion} · {scene.action}</span></div>{current ? <small className={styles.currentBadge}>Current</small> : <button onClick={() => onReplace(scene.id)} aria-label={`Use ${scene.title} for ${segment.name}`}>Use</button>}</article>
  })}</div><div className={styles.draftStatus}><span>{changedCount} {changedCount === 1 ? 'beat' : 'beats'} changed from the applied example</span><button onClick={onReset} disabled={changedCount === 0}><RotateCcw size={15} /> Reset draft</button></div></div></>
}

export function PlannerPage({ projectId, repository, onHome, onProjects, onMedia, onAnalysis, onScenes }: { projectId: string; repository: WorkspaceRepository; onHome: () => void; onProjects: () => void; onMedia: () => void; onAnalysis: () => void; onScenes: () => void }) {
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<PlannerMode>('director')
  const [selectedPlanId, setSelectedPlanId] = useState(samplePlans[0].id)
  const [appliedPlanId, setAppliedPlanId] = useState(samplePlans[0].id)
  const [draft, setDraft] = useState<Record<string, string>>(() => ({ ...samplePlans[0].sceneBySegment }))
  const [selectedSegmentId, setSelectedSegmentId] = useState('chorus')
  const [notice, setNotice] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([repository.list(), repository.listMedia(projectId)]).then(([projects, media]) => {
      if (!active) return
      setProject(projects.find((item) => item.id === projectId) ?? null)
      setAssets(media)
      setLoading(false)
    }).catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not open the planner.'); setLoading(false) } })
    return () => { active = false }
  }, [projectId, repository])

  const selectedPlan = samplePlans.find((plan) => plan.id === selectedPlanId) ?? samplePlans[0]
  const appliedPlan = samplePlans.find((plan) => plan.id === appliedPlanId) ?? samplePlans[0]
  const segment = sampleSegments.find((item) => item.id === selectedSegmentId) ?? sampleSegments[0]
  const visibleScenes = mode === 'director' ? selectedPlan.sceneBySegment : draft
  const scene = sampleScene(visibleScenes[segment.id])
  const changedCount = changedBeatCount(draft, appliedPlan)
  const musicCount = assets.filter((item) => item.kind === 'audio').length
  const videoCount = assets.filter((item) => item.kind === 'video').length

  function applyPlan() {
    setDraft({ ...selectedPlan.sceneBySegment })
    setAppliedPlanId(selectedPlan.id)
    setMode('copilot')
    setNotice(`${selectedPlan.name} loaded into the sample draft. No media or timeline was changed.`)
  }

  function replaceScene(sceneId: string) {
    setDraft((current) => ({ ...current, [segment.id]: sceneId }))
    setNotice(`${sampleScene(sceneId).title} selected for the sample ${segment.name} beat. No media or timeline was changed.`)
  }

  function resetDraft() {
    setDraft({ ...appliedPlan.sceneBySegment })
    setNotice('Sample draft reset to the applied example.')
  }

  return <div className={styles.page}>
    <a className="skip-link" href="#planner-main">Skip to content</a>
    <header className={styles.topbar}><button className={styles.brand} onClick={onHome}><Clapperboard size={28} /><strong>AMV Studio AI</strong></button><span className={styles.topDivider} /><span className={styles.topContext}>AI-Assisted Editor</span><nav aria-label="Studio sections"><button onClick={onProjects}><Folder size={19} /> Projects</button><button onClick={onMedia}><Film size={19} /> Media</button><button onClick={onAnalysis}><AudioLines size={19} /> Analyze</button><button onClick={onScenes}><Layers3 size={19} /> Scenes</button><button className={styles.topActive} aria-current="page"><Sparkles size={19} /> Planner</button></nav><Button variant="primary" onClick={() => setExportOpen(true)}><Upload size={17} /> Export</Button></header>
    <div className={styles.layout}><aside className={styles.sidebar} aria-label="Project navigation"><button className={styles.projectButton} onClick={onProjects}><Folder size={20} /><span>{project?.name ?? 'Project'}</span></button><nav aria-label="Project sections"><button onClick={onMedia}><Film size={20} /><span>Project Media</span></button><button onClick={onAnalysis}><Music2 size={20} /><span>Song Analysis</span></button><button onClick={onScenes}><Layers3 size={20} /><span>Scene Library</span></button><button className={styles.sideActive} aria-current="page"><Sparkles size={20} /><span>AMV Planner</span></button></nav><div className={styles.assetSummary}><h2>Project assets</h2><p><Music2 size={17} /> Music <strong>{musicCount}</strong></p><p><Film size={17} /> Videos <strong>{videoCount}</strong></p><button onClick={onMedia}>Open media workspace →</button></div><div className={styles.sideNotice}><strong>Sample storyboard</strong><p>Your imported files are not used in these examples.</p></div></aside>
      <main id="planner-main" className={styles.main} tabIndex={-1}>{loading ? <p role="status">Opening planner…</p> : !project ? <div className={styles.missing}><h1>Project unavailable</h1><p>{error ?? 'This project was not found in this browser.'}</p><Button onClick={onProjects}>Back to projects</Button></div> : <>
        <div className={styles.hero}><img src={demoArt.plannerPreview} alt="" /><div><span className={styles.eyebrow}>AMV STUDIO AI · PROTOTYPE</span><h1>AMV Planner</h1><p>Shape a visual story from illustrative song and scene fixtures.</p></div><span className={styles.heroBadge}>NO AI INFERENCE</span></div>
        <div className={styles.modeBar}><div role="group" aria-label="Planner mode"><button className={mode === 'director' ? styles.modeActive : ''} aria-pressed={mode === 'director'} onClick={() => { setMode('director'); setNotice('') }}><WandSparkles size={18} /> AI Director</button><button className={mode === 'copilot' ? styles.modeActive : ''} aria-pressed={mode === 'copilot'} onClick={() => { setMode('copilot'); setNotice('') }}><Sparkles size={18} /> AI Copilot</button></div><span>Hand-authored sample plans · no imported media analyzed</span></div>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        <div className={styles.workGrid}><div className={styles.centerColumn}><section className={styles.previewPanel} aria-label="Selected sample story beat"><div className={styles.previewImage}><img src={scene.image} alt={`Illustrative still for ${scene.title}`} /><span>Illustrative still · no playable timeline</span></div><div className={styles.previewDetails}><span className={styles.eyebrow}>{mode === 'director' ? 'DIRECTOR PREVIEW' : 'COPILOT DRAFT'} · {segment.name.toUpperCase()}</span><h2>{scene.title}</h2><p>{mode === 'director' ? selectedPlan.noteBySegment[segment.id] : sampleAlternatives[segment.id].find((item) => item.sceneId === scene.id)?.note ?? scene.description}</p><dl><div><dt>Example song</dt><dd>{sampleSong.title} · {sampleTime(segment.start)} – {sampleTime(segment.end)}</dd></div><div><dt>Scene source</dt><dd>{scene.source} · demo fixture</dd></div><div><dt>Story emotion</dt><dd>{scene.emotion} → {segment.emotion}</dd></div></dl><button onClick={onScenes}>Inspect sample scene <ArrowRight size={15} /></button></div></section><Storyboard sceneBySegment={visibleScenes} selectedId={segment.id} onSelect={setSelectedSegmentId} mode={mode} /></div><aside className={styles.assistantPanel} aria-label="Planner example choices">{mode === 'director' ? <DirectorPanel selectedPlan={selectedPlan} selectedId={selectedPlan.id} onChoose={setSelectedPlanId} onApply={applyPlan} segment={segment} /> : <CopilotPanel segment={segment} currentSceneId={draft[segment.id]} onReplace={replaceScene} onReset={resetDraft} changedCount={changedCount} />}</aside></div>
        <p className={styles.footerBoundary}>This storyboard describes example visual moments only. It does not place cuts, alter imported media, create a timeline, or export an AMV.</p>
      </>}</main></div>
    {exportOpen && <FeatureDialog feature="export" onClose={() => setExportOpen(false)} closeLabel="Close" />}
  </div>
}
