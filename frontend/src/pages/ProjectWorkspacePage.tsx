import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { AlertCircle, ArrowLeft, AudioLines, Film, Image as ImageIcon, Link2, Music2, Plus, Search, Trash2, UploadCloud } from 'lucide-react'
import { Sidebar } from '../features/dashboard/Sidebar'
import { FeatureDialog, ProjectNameDialog } from '../features/projects/ProjectDialogs'
import type { FeatureKey } from '../features/projects/ProjectDialogs'
import type { Project } from '../features/projects/types'
import type { MediaAsset, MediaKind } from '../features/media/types'
import { formatBytes, formatMediaDuration } from '../features/media/types'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import styles from './Workspace.module.css'

type Filter = 'all' | MediaKind

const kindIcon = { audio: Music2, video: Film, image: ImageIcon }

export function ProjectWorkspacePage({ projectId, repository, onHome, onProjects, onAnalysis }: { projectId: string; repository: WorkspaceRepository; onHome: () => void; onProjects: () => void; onAnalysis: () => void }) {
  const [project, setProject] = useState<Project | null>(null)
  const [projectCount, setProjectCount] = useState(0)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null)
  const [feature, setFeature] = useState<FeatureKey | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const relinkRef = useRef<HTMLInputElement>(null)
  const relinkId = useRef<string | null>(null)

  useEffect(() => {
    let current = true
    Promise.all([repository.list(), repository.listMedia(projectId)]).then(([projects, media]) => {
      if (!current) return
      setProject(projects.find((item) => item.id === projectId) ?? null)
      setProjectCount(projects.length)
      setAssets(media)
      setSelectedId(media[0]?.id ?? null)
      setLoading(false)
    }).catch((cause) => { if (current) { setError(cause instanceof Error ? cause.message : 'Could not load project.'); setLoading(false) } })
    return () => { current = false }
  }, [projectId, repository])

  const selected = assets.find((asset) => asset.id === selectedId) ?? null
  const selectedUrl = selected ? repository.previewUrl(selected.id) : null
  const matches = assets.filter((asset) => (filter === 'all' || asset.kind === filter) && asset.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const counts = { audio: assets.filter((item) => item.kind === 'audio').length, video: assets.filter((item) => item.kind === 'video').length, image: assets.filter((item) => item.kind === 'image').length }

  async function importFiles(files: File[]) {
    if (!files.length || busy) return
    setBusy(true); setError(null); setNotice(null)
    try {
      const result = await repository.importMedia(projectId, files)
      setAssets(await repository.listMedia(projectId))
      if (result.imported[0]) { setSelectedId(result.imported[0].id); setFilter('all'); setQuery('') }
      const message = `${result.imported.length} ${result.imported.length === 1 ? 'file' : 'files'} added. Files stay on your computer; relink after a reload.`
      setNotice(result.rejected.length ? `${message} Skipped: ${result.rejected.join('; ')}` : message)
    } catch (cause) { setAssets(await repository.listMedia(projectId)); setError(cause instanceof Error ? cause.message : 'Could not add media.') }
    finally { setBusy(false); if (importRef.current) importRef.current.value = '' }
  }

  async function relink(file: File) {
    if (!relinkId.current) return
    const id = relinkId.current
    setBusy(true); setError(null); setNotice(null)
    try { await repository.relinkMedia(id, file); setAssets(await repository.listMedia(projectId)); setSelectedId(id); setNotice(`${file.name} is available for preview in this session.`) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not relink file.') }
    finally { setBusy(false); relinkId.current = null; if (relinkRef.current) relinkRef.current.value = '' }
  }

  function startRelink(asset: MediaAsset) {
    relinkId.current = asset.id
    if (relinkRef.current) relinkRef.current.accept = `${asset.kind}/*`
    relinkRef.current?.click()
  }

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    void importFiles(Array.from(event.dataTransfer.files))
  }

  function showFeature(key: 'media' | 'songs' | 'settings') {
    if (key === 'media') { setFilter('all'); setFeature(null) }
    else if (key === 'songs') { setFilter('audio'); setFeature(null) }
    else setFeature(key)
  }

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#workspace-main">Skip to content</a>
      <Sidebar active="media" projectCount={projectCount} onHome={onHome} onProjects={onProjects} onFeature={showFeature} />
      <main className={styles.main} id="workspace-main" tabIndex={-1} onDrop={drop} onDragOver={(event) => event.preventDefault()}>
        <div className={styles.topline}><button className={styles.back} onClick={onProjects}><ArrowLeft size={18} /> Projects</button><span className={styles.kicker}>LOCAL MEDIA WORKSPACE</span></div>
        {loading ? <p role="status">Opening project…</p> : !project ? <div className={styles.emptyState}><h1>Project unavailable</h1><p>{error ?? 'This project was not found in this browser.'}</p><Button onClick={onProjects}>Back to projects</Button></div> : <>
          <header className={styles.pageHeader}><div><span className={styles.sampleBadge}>{project.source === 'sample' ? 'Reference sample' : 'Local project'}</span><h1>{project.name}</h1><p>Organize music, anime videos, and still images for your AMV.</p></div><div className={styles.headerActions}><Button onClick={() => setRenameOpen(true)}>Rename</Button><Button onClick={onAnalysis}><AudioLines size={20} /> Song Analysis</Button><Button variant="primary" onClick={() => importRef.current?.click()} disabled={busy}><Plus size={20} /> Add media</Button></div></header>
          <div className={styles.summaryStrip}><span><AudioLines size={20} /> {counts.audio} music</span><span><Film size={20} /> {counts.video} videos</span><span><ImageIcon size={20} /> {counts.image} images</span><span>{assets.length} media records</span></div>
          <p className={styles.storageNote}><Link2 size={18} /> Project names and file details are saved in this browser. Media files remain on your computer; relink them after a reload to preview again.</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {notice && <p className={styles.notice} role="status">{notice}</p>}
          <div className={styles.mediaLayout}>
            <section className={styles.mediaBrowser} aria-labelledby="media-heading">
              <div className={styles.panelHeading}><div><h2 id="media-heading">Project media</h2><span>{assets.length} items</span></div><button onClick={() => importRef.current?.click()} disabled={busy} aria-label="Import files"><Plus size={22} /></button></div>
              <div className={styles.filterBar}><label htmlFor="media-search"><Search size={18} /> Find media</label><input id="media-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search file names" /></div>
              <div className={styles.tabs} role="group" aria-label="Media type">{(['all', 'audio', 'video', 'image'] as const).map((kind) => <button key={kind} className={filter === kind ? styles.tabActive : ''} onClick={() => setFilter(kind)} aria-pressed={filter === kind}>{kind === 'all' ? 'All' : kind === 'audio' ? 'Music' : kind === 'video' ? 'Videos' : 'Images'}</button>)}</div>
              {matches.length ? <div className={styles.mediaList}>{matches.map((asset) => { const Icon = kindIcon[asset.kind]; const url = repository.previewUrl(asset.id); const linked = Boolean(url); return <button key={asset.id} className={`${styles.mediaRow} ${selectedId === asset.id ? styles.mediaSelected : ''}`} onClick={() => setSelectedId(asset.id)}><span className={styles.mediaRowIcon}>{url && asset.kind === 'image' ? <img src={url} alt="" /> : <Icon size={22} />}</span><span className={styles.mediaRowText}><strong title={asset.name}>{asset.name}</strong><small>{formatBytes(asset.sizeBytes)} · {asset.kind}</small></span><span className={`${styles.statusDot} ${linked ? styles.linked : ''}`} title={linked ? 'Ready to preview' : 'Relink required'} aria-label={linked ? 'Ready to preview' : 'Relink required'} /></button> })}</div> : <div className={styles.emptyMedia}><UploadCloud size={40} /><strong>{assets.length ? 'No matching files' : 'Your media library is ready'}</strong><p>{assets.length ? 'Adjust your search or media filter.' : 'Choose music, anime videos, or images from your computer. You can also drop files here.'}</p>{!assets.length && <Button variant="primary" onClick={() => importRef.current?.click()} disabled={busy}>Choose local files</Button>}</div>}
            </section>
            <section className={styles.previewPanel} aria-labelledby="preview-heading">
              <div className={styles.panelHeading}><div><h2 id="preview-heading">Preview & details</h2><span>{selected ? selected.kind.toUpperCase() : 'SELECT A FILE'}</span></div></div>
              {selected ? <>
                <div className={styles.previewStage}>{selectedUrl ? selected.kind === 'image' ? <img src={selectedUrl} alt={`Preview of ${selected.name}`} /> : selected.kind === 'video' ? <video src={selectedUrl} controls preload="metadata" aria-label={`Preview of ${selected.name}`} /> : <div className={styles.audioStage}><Music2 size={64} /><audio src={selectedUrl} controls preload="metadata" aria-label={`Preview of ${selected.name}`} /></div> : <div className={styles.unavailable}><AlertCircle size={42} /><strong>File needs relinking</strong><p>The file details were saved, but browsers do not keep access to the selected file after a reload.</p><Button variant="primary" onClick={() => startRelink(selected)} disabled={busy}><Link2 size={18} /> Relink file</Button></div>}</div>
                <div className={styles.assetDetails}><h3 title={selected.name}>{selected.name}</h3><dl><div><dt>Type</dt><dd>{selected.mimeType || selected.kind}</dd></div><div><dt>Size</dt><dd>{formatBytes(selected.sizeBytes)}</dd></div><div><dt>Duration</dt><dd>{selected.durationSeconds === null ? 'Unknown' : formatMediaDuration(selected.durationSeconds)}</dd></div><div><dt>Dimensions</dt><dd>{selected.width && selected.height ? `${selected.width} × ${selected.height}` : 'Unknown'}</dd></div><div><dt>Modified</dt><dd>{new Date(selected.lastModified).toLocaleDateString()}</dd></div><div><dt>Access</dt><dd>{selectedUrl ? 'Ready in this session' : 'Relink required'}</dd></div></dl></div>
                <div className={styles.assetActions}>{selectedUrl ? <Button onClick={() => startRelink(selected)} disabled={busy}><Link2 size={18} /> Choose file again</Button> : null}<Button variant="quiet" onClick={() => setDeleteAsset(selected)}><Trash2 size={18} /> Remove record</Button></div>
              </> : <div className={styles.unavailable}><ImageIcon size={44} /><strong>Select a media item</strong><p>Choose a file from your project library to see a preview and its details.</p></div>}
            </section>
          </div>
          <input ref={importRef} className="sr-only" tabIndex={-1} type="file" accept="audio/*,video/*,image/*" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => void importFiles(Array.from(event.target.files ?? []))} aria-label="Choose media files" />
          <input ref={relinkRef} className="sr-only" tabIndex={-1} type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) void relink(file) }} aria-label="Choose original file to relink" />
        </>}
      </main>
      {renameOpen && project && <ProjectNameDialog project={project} onClose={() => setRenameOpen(false)} onSubmit={async (name) => { setProject(await repository.rename(projectId, name)) }} />}
      {deleteAsset && <Modal title={`Remove ${deleteAsset.name}?`} description="This removes its saved record from this project. The original file stays on your computer." onClose={() => setDeleteAsset(null)}><div className={styles.dialogActions}><Button onClick={() => setDeleteAsset(null)}>Cancel</Button><Button variant="primary" onClick={async () => { try { await repository.removeMedia(deleteAsset.id); setAssets(await repository.listMedia(projectId)); if (selectedId === deleteAsset.id) setSelectedId(null); setDeleteAsset(null) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove record.'); setDeleteAsset(null) } }}>Remove record</Button></div></Modal>}
      {feature && <FeatureDialog feature={feature} onClose={() => setFeature(null)} />}
    </div>
  )
}
