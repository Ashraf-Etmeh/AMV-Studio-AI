import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Clapperboard, FolderOpen, Music2, Plus, Sparkles } from 'lucide-react'
import { demoArt } from '../../assets/demo/manifest'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { formatDuration, validateProjectName } from './types'
import type { Project } from './types'
import styles from './ProjectDialogs.module.css'

interface NameDialogProps {
  project?: Project
  onSubmit: (name: string) => Promise<unknown>
  onClose: () => void
}

export function ProjectNameDialog({ project, onSubmit, onClose }: NameDialogProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputId = useId()
  const errorId = useId()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const validation = validateProjectName(name)
    if (validation) { setError(validation); return }
    setSaving(true)
    setError(null)
    try { await onSubmit(name.trim()); onClose() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'); setSaving(false) }
  }

  return (
    <Modal title={project ? 'Rename project' : 'A new story starts here'}
      description={project ? 'Give this project a new name.' : 'Name your AMV and make room for your next idea.'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label htmlFor={inputId} className={styles.fieldLabel}>Project name</label>
        <input id={inputId} className={styles.input} value={name} onChange={(event) => { setName(event.target.value); setError(null) }}
          placeholder="e.g. Midnight Reverie" data-autofocus autoComplete="off" maxLength={80}
          aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
        {error && <p id={errorId} className={styles.error} role="alert">{error}</p>}
        <div className={styles.sessionInfo}><FolderOpen size={19} /><p><strong>Saved in this browser</strong><span>{project?.source === 'sample' ? 'This is a sample project. ' : ''}Project names and media details persist here. Selected media files need relinking after a reload.</span></p></div>
        <div className={styles.actions}><Button variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : project ? 'Save name' : 'Create Project'}</Button></div>
      </form>
    </Modal>
  )
}

export function ProjectListDialog({ projects, onOpen, onCreate, onClose }: { projects: Project[]; onOpen: (project: Project) => void; onCreate: () => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const matches = projects.filter((project) => project.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return (
    <Modal wide title="Your projects" description="Sample projects and local drafts. Select one to see its details." onClose={onClose}>
      <label className={styles.fieldLabel} htmlFor="project-search">Find a project</label>
      <input id="project-search" className={styles.input} type="search" placeholder="Search projects…" value={query} onChange={(event) => setQuery(event.target.value)} data-autofocus />
      <div className={styles.projectList}>
        {matches.map((project) => <button key={project.id} className={styles.listItem} onClick={() => onOpen(project)}>
          {project.thumbnail ? <img src={demoArt[project.thumbnail]} alt="" /> : <span className={styles.listPlaceholder}><Clapperboard size={24} /></span>}
          <span className={styles.listText}><strong>{project.name}</strong><span>{project.source === 'sample' ? 'Sample project' : 'Local project'} · {project.durationSeconds === null ? 'No project runtime' : formatDuration(project.durationSeconds)}</span></span>
          <FolderOpen size={21} className={styles.listAction} />
        </button>)}
        {matches.length === 0 && <p className={styles.empty}>No projects match “{query}”. Try another name or start a new project.</p>}
      </div>
      <div className={styles.actions}><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={onCreate}><Plus size={19} />New Project</Button></div>
    </Modal>
  )
}

export function ProjectSummaryDialog({ project, onRename, onOpen, onClose }: { project: Project; onRename: () => void; onOpen?: () => void; onClose: () => void }) {
  return (
    <Modal title={project.name} description={project.source === 'sample' ? 'A sample project from the Dashboard reference.' : 'Your local project is ready.'} onClose={onClose}>
      {project.thumbnail && <img className={styles.summaryImage} src={demoArt[project.thumbnail]} alt="" />}
      <dl className={styles.projectFacts}><div><dt>Workspace</dt><dd>{project.source === 'sample' ? 'Sample project' : 'Local project'}</dd></div><div><dt>Demo runtime</dt><dd>{project.durationSeconds === null ? 'None' : `${formatDuration(project.durationSeconds)} (sample)`}</dd></div><div><dt>Metadata</dt><dd>Saved in this browser</dd></div></dl>
      <p className={styles.boundary}>You can add music, videos, and images in this project’s media workspace. The timeline and processing features are still planned.</p>
      <div className={styles.actions}><Button onClick={onRename}>Rename project</Button><Button variant="primary" onClick={onOpen ?? onClose}>{onOpen ? 'Open workspace' : 'Back to Dashboard'}</Button></div>
    </Modal>
  )
}

export type FeatureKey = 'media' | 'songs' | 'settings' | 'analyze' | 'scenes' | 'generate' | 'export'

const features: Record<FeatureKey, { title: string; text: string; details: string[] }> = {
  analyze: { title: 'Understand the music', text: 'A Song Analysis demo is available in each project. Real music inference is planned for a later milestone.', details: ['Explore beats and song structure', 'Review lyrics and emotional changes', 'Use musical cues to guide your edit'] },
  scenes: { title: 'Find the right moment', text: 'A Scene Library demo is available in each project. Automatic scene indexing and matching are planned for later milestones.', details: ['Import and browse anime footage', 'Index scenes, actions, and emotions', 'Find moments that fit your story'] },
  generate: { title: 'Bring your story together', text: 'An AMV Planner demo and a local timeline editing prototype are available inside each project. Rendering is planned for a later milestone.', details: ['Explore example sequences with AI Director', 'Change a sample beat with AI Copilot', 'Arrange and trim imported media in the Timeline Editor'] },
  export: { title: 'Export is planned', text: 'The sample storyboard is a preview. No playable AMV or render file has been created.', details: ['Edit real media on a timeline in a later milestone', 'Render with a processing backend', 'Choose format and quality before saving locally'] },
  media: { title: 'Your media, in one place', text: 'Choose a project to add local media.', details: ['Organize anime footage and still images', 'Preview your locally selected files', 'Keep media records linked to your projects'] },
  songs: { title: 'Every story starts with a song', text: 'Choose a project to add local music.', details: ['Add music to your workspace', 'Preview supported local audio files', 'Connect a song to your AMV project'] },
  settings: { title: 'Make the studio yours', text: 'Workspace settings are coming in a later milestone.', details: ['Choose media and project locations', 'Configure processing preferences', 'Manage export defaults'] },
}

export function FeatureDialog({ feature, onClose, closeLabel = 'Back to Dashboard' }: { feature: FeatureKey; onClose: () => void; closeLabel?: string }) {
  const content = features[feature]
  return (
    <Modal title={content.title} description={content.text} onClose={onClose}>
      <div className={styles.featurePreview}><span className={styles.featureSymbol}>{feature === 'analyze' || feature === 'songs' ? <Music2 size={31} /> : <Sparkles size={31} />}</span><span>Planned capability</span></div>
      <ul className={styles.featureList}>{content.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
      <p className={styles.boundary}>This preview does not run AI analysis, process media, or generate videos.</p>
      <div className={styles.actions}><Button variant="primary" onClick={onClose}>{closeLabel}</Button></div>
    </Modal>
  )
}
