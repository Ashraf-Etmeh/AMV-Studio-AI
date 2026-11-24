import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, AudioLines, Clapperboard, Film, Folder, Grid2X2, Heart, Layers3, List, Play, Search, SlidersHorizontal, Sparkles, Star, Upload } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { FeatureDialog } from '../features/projects/ProjectDialogs'
import type { Project } from '../features/projects/types'
import type { MediaAsset } from '../features/media/types'
import { formatBytes, formatMediaDuration } from '../features/media/types'
import { filterSampleScenes, sampleScenes } from '../features/scenes/sampleScenes'
import type { SampleScene } from '../features/scenes/sampleScenes'
import type { WorkspaceRepository } from '../services/localWorkspaceRepository'
import styles from './SceneLibrary.module.css'

function SceneCard({ scene, selected, favorite, onSelect, onFavorite, listView }: { scene: SampleScene; selected: boolean; favorite: boolean; onSelect: () => void; onFavorite: () => void; listView: boolean }) {
  return <article className={`${styles.sceneCard} ${selected ? styles.sceneSelected : ''} ${listView ? styles.sceneListCard : ''}`}>
    <button className={styles.scenePick} onClick={onSelect} aria-label={`Select sample scene ${scene.title}`} aria-pressed={selected}>
      <span className={styles.sceneImage}><img src={scene.image} alt="" /><small>{scene.start} – {scene.end}</small></span>
      <span className={styles.sceneBody}><strong>{scene.title}</strong><span className={styles.sceneTags}><em>{scene.emotion}</em>{scene.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</span><span className={styles.sceneTags}><span>{scene.action}</span><span>Character: {scene.characters.join(', ')}</span></span></span>
    </button>
    <button className={styles.favoriteButton} onClick={onFavorite} aria-label={`${favorite ? 'Remove' : 'Add'} ${scene.title} ${favorite ? 'from' : 'to'} demo favorites`} aria-pressed={favorite}><Star size={20} fill={favorite ? 'currentColor' : 'none'} /></button>
  </article>
}

function SceneDetail({ scene }: { scene: SampleScene }) {
  return <section className={styles.detailPanel} aria-label="Selected demo scene details">
    <div className={styles.detailImage}><img src={scene.image} alt={`Illustrative still for ${scene.title}`} /><span><Play size={18} fill="currentColor" /> Illustrative still · no playable clip</span></div>
    <div className={styles.detailText}><div className={styles.detailHeading}><div><span className={styles.eyebrow}>SELECTED SAMPLE SCENE</span><h3>{scene.title}</h3></div><span className={styles.demoBadge}>DEMO</span></div>
      <dl><div><dt>Time</dt><dd>{scene.start} – {scene.end} ({scene.duration})</dd></div><div><dt>Source</dt><dd>{scene.source} · illustrative</dd></div><div><dt>Characters</dt><dd>{scene.characters.join(', ')}</dd></div><div><dt>Emotion</dt><dd><span className={styles.emotionBadge}><Heart size={14} /> {scene.emotion}</span></dd></div><div><dt>Action</dt><dd>{scene.action}</dd></div><div><dt>Motion</dt><dd>{scene.motion.toFixed(2)} · sample label</dd></div><div><dt>Description</dt><dd>{scene.description}</dd></div></dl>
    </div>
  </section>
}

function LocalVideos({ videos, selectedId, onSelect, repository, onMedia }: { videos: MediaAsset[]; selectedId: string | null; onSelect: (id: string) => void; repository: WorkspaceRepository; onMedia: () => void }) {
  const selected = videos.find((item) => item.id === selectedId) ?? videos[0] ?? null
  const url = selected ? repository.previewUrl(selected.id) : null
  return <section className={styles.localPanel} aria-labelledby="local-videos-heading"><div className={styles.localHeader}><div><span className={styles.eyebrow}>YOUR LOCAL FILES</span><h2 id="local-videos-heading">Imported videos</h2><p>These are full files you added to this project. No scenes, tags, or search index have been extracted.</p></div><Button variant="primary" onClick={onMedia}><Upload size={18} /> Add or relink videos</Button></div>
    {videos.length ? <div className={styles.localGrid}><div className={styles.localList} aria-label="Imported video files">{videos.map((video) => <button key={video.id} className={selected?.id === video.id ? styles.localSelected : ''} onClick={() => onSelect(video.id)}><Film size={22} /><span><strong>{video.name}</strong><small>{formatBytes(video.sizeBytes)} · {video.durationSeconds === null ? 'Unknown duration' : formatMediaDuration(video.durationSeconds)}</small></span></button>)}</div><div className={styles.localPreview}>{selected && <>{url ? <video controls preload="metadata" src={url} aria-label={`Preview of ${selected.name}`} /> : <div className={styles.relinkState}><Film size={42} /><strong>Relink required</strong><p>The browser saved file details but cannot access the video after a reload. Relink it in Media to play it again.</p><Button onClick={onMedia}>Open Media</Button></div>}<dl><div><dt>File</dt><dd>{selected.name}</dd></div><div><dt>Duration</dt><dd>{selected.durationSeconds === null ? 'Unknown' : formatMediaDuration(selected.durationSeconds)}</dd></div><div><dt>Dimensions</dt><dd>{selected.width && selected.height ? `${selected.width} × ${selected.height}` : 'Unknown'}</dd></div><div><dt>Size</dt><dd>{formatBytes(selected.sizeBytes)}</dd></div></dl></>}</div></div> : <div className={styles.emptyLocal}><Film size={42} /><h3>No videos imported</h3><p>Add an anime video in the media workspace to preview it here.</p><Button variant="primary" onClick={onMedia}>Open Media Library</Button></div>}
    <p className={styles.localBoundary}><Sparkles size={18} /> Scene detection and natural-language retrieval will require a later processing milestone.</p>
  </section>
}

export function SceneLibraryPage({ projectId, repository, onHome, onProjects, onMedia, onAnalysis, onPlanner }: { projectId: string; repository: WorkspaceRepository; onHome: () => void; onProjects: () => void; onMedia: () => void; onAnalysis: () => void; onPlanner: () => void }) {
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'demo' | 'local'>('demo')
  const [selectedId, setSelectedId] = useState('crying')
  const [localId, setLocalId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [draftQuery, setDraftQuery] = useState('')
  const [query, setQuery] = useState('')
  const [emotion, setEmotion] = useState('')
  const [action, setAction] = useState('')
  const [character, setCharacter] = useState('')
  const [maxMotion, setMaxMotion] = useState(1)
  const [sort, setSort] = useState<'reference' | 'title'>('reference')
  const [listView, setListView] = useState(false)
  const [featureOpen, setFeatureOpen] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([repository.list(), repository.listMedia(projectId)]).then(([projects, media]) => {
      if (!active) return
      setProject(projects.find((item) => item.id === projectId) ?? null)
      setAssets(media)
      setLocalId(media.find((item) => item.kind === 'video')?.id ?? null)
      setLoading(false)
    }).catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Could not open the scene library.'); setLoading(false) } })
    return () => { active = false }
  }, [projectId, repository])

  const videos = assets.filter((item) => item.kind === 'video')
  const results = filterSampleScenes({ query, emotion, action, character, maxMotion, favoritesOnly, favorites, sort })
  const selected = results.find((scene) => scene.id === selectedId) ?? results[0] ?? null

  function toggleFavorite(id: string) {
    setFavorites((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  function resetFilters() { setDraftQuery(''); setQuery(''); setEmotion(''); setAction(''); setCharacter(''); setMaxMotion(1); setFavoritesOnly(false) }
  function submitSearch(event: FormEvent) { event.preventDefault(); setQuery(draftQuery.trim()) }

  return <div className={styles.page}>
    <a className="skip-link" href="#scene-main">Skip to content</a>
    <header className={styles.topbar}><button className={styles.brand} onClick={onHome}><Clapperboard size={29} /><strong>AMV Studio AI</strong></button><span className={styles.brandDivider} /><span className={styles.topContext}>Anime Scene Library</span><nav aria-label="Studio sections"><button className={styles.topActive} aria-current="page" onClick={() => setMode('demo')}><Grid2X2 size={20} /> Scene Library</button><button onClick={onAnalysis}><AudioLines size={20} /> Music Analysis</button><button onClick={onPlanner}><Film size={20} /> AMV Planner</button><button onClick={() => setFeatureOpen(true)}><Upload size={20} /> Export</button></nav></header>
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Project and media navigation"><button className={styles.projectButton} onClick={onProjects}><Folder size={19} /><span>{project?.name ?? 'Project'}</span></button><nav aria-label="Library navigation"><button onClick={onMedia}><Film size={20} /><span>Media</span></button><button className={styles.sideActive} aria-current="page" onClick={() => { setMode('demo'); setFavoritesOnly(false) }}><Layers3 size={20} /><span>Scene Library</span></button><button aria-pressed={favoritesOnly} onClick={() => { setMode('demo'); setFavoritesOnly((value) => !value) }}><Star size={20} /><span>Demo favorites</span><small>{favorites.size}</small></button></nav><div className={styles.sideDivider} /><div className={styles.mediaBrowser}><div className={styles.sideHeading}><h2>Media Browser</h2><button onClick={onMedia} aria-label="Open media workspace">+</button></div>{videos.length ? videos.map((video) => <button key={video.id} onClick={() => { setMode('local'); setLocalId(video.id) }}><Film size={18} /><span title={video.name}>{video.name}</span><small>{video.durationSeconds === null ? '—' : formatMediaDuration(video.durationSeconds)}</small></button>) : <p>No imported videos yet. Add them in Media.</p>}</div><div className={styles.processingStatus}><span><SlidersHorizontal size={20} /> Scene processing</span><strong>Not started</strong><p>0 scenes detected from your videos.</p></div></aside>
      <main id="scene-main" className={styles.main} tabIndex={-1}>{loading ? <p role="status">Opening scene library…</p> : !project ? <div className={styles.missing}><h1>Project unavailable</h1><p>{error ?? 'This project was not found in this browser.'}</p><Button onClick={onProjects}>Back to projects</Button></div> : <><div className={styles.pageHeading}><div><span className={styles.eyebrow}>{project.name}</span><h1>Scene Library</h1></div><Button onClick={onMedia}><ArrowLeft size={17} /> Back to Media</Button></div><div className={styles.modeSwitch} role="group" aria-label="Scene source"><button className={mode === 'demo' ? styles.modeActive : ''} aria-pressed={mode === 'demo'} onClick={() => setMode('demo')}>Demo scenes <small>{sampleScenes.length}</small></button><button className={mode === 'local' ? styles.modeActive : ''} aria-pressed={mode === 'local'} onClick={() => setMode('local')}>Your videos <small>{videos.length}</small></button><span>Sample scene labels are unrelated to imported files.</span></div>
        {mode === 'demo' ? <div className={styles.demoLayout}><div className={styles.centerColumn}><div className={styles.libraryHeading}><div><h2>Sample scenes</h2><span>{results.length} of {sampleScenes.length} illustrative clips</span></div><div className={styles.viewControls}><div role="group" aria-label="Scene layout"><button aria-label="Grid view" aria-pressed={!listView} onClick={() => setListView(false)}><Grid2X2 size={19} /></button><button aria-label="List view" aria-pressed={listView} onClick={() => setListView(true)}><List size={19} /></button></div><label>Sort <select aria-label="Sort sample scenes" value={sort} onChange={(event) => setSort(event.target.value as 'reference' | 'title')}><option value="reference">Reference order</option><option value="title">Title</option></select></label></div></div><div className={`${styles.sceneGrid} ${listView ? styles.listGrid : ''}`}>{results.map((scene) => <SceneCard key={scene.id} scene={scene} selected={selected?.id === scene.id} favorite={favorites.has(scene.id)} onSelect={() => setSelectedId(scene.id)} onFavorite={() => toggleFavorite(scene.id)} listView={listView} />)}{results.length === sampleScenes.length && <div className={styles.allScenesTile}><Layers3 size={30} /><span>All demo scenes shown</span></div>}</div>{selected ? <SceneDetail scene={selected} /> : <div className={styles.noResults}><Search size={35} /><h3>No sample scenes match</h3><p>Try another keyword or clear a filter.</p><Button onClick={resetFilters}>Reset filters</Button></div>}</div><aside className={styles.searchPanel} aria-label="Sample scene search and results"><div className={styles.searchTitle}><Search size={27} /><div><h2>Sample scene search</h2><p>Keyword matching only · no semantic index</p></div></div><form onSubmit={submitSearch}><label htmlFor="scene-query">Search sample descriptions and tags</label><div className={styles.searchInput}><Search size={19} /><input id="scene-query" type="search" placeholder="e.g. loss and longing" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} /></div><div className={styles.filtersHeading}><strong>Filters</strong><button type="button" onClick={resetFilters}>Reset</button></div><div className={styles.filterField}><label htmlFor="scene-emotion"><Heart size={18} /> Emotion</label><select id="scene-emotion" value={emotion} onChange={(event) => setEmotion(event.target.value)}><option value="">Any</option>{['Sadness', 'Intensity', 'Melancholy', 'Desperation', 'Joy'].map((value) => <option key={value}>{value}</option>)}</select></div><div className={styles.filterField}><label htmlFor="scene-action"><Sparkles size={18} /> Action</label><select id="scene-action" value={action} onChange={(event) => setAction(event.target.value)}><option value="">Any</option>{['Crying', 'Fight', 'Still', 'Reaching', 'Embrace'].map((value) => <option key={value}>{value}</option>)}</select></div><div className={styles.filterField}><label htmlFor="scene-character"><Film size={18} /> Character</label><select id="scene-character" value={character} onChange={(event) => setCharacter(event.target.value)}><option value="">Any</option><option value="A">A</option><option value="B">B</option></select></div><div className={styles.motionFilter}><label htmlFor="scene-motion"><AudioLines size={18} /> Maximum motion <output>{maxMotion.toFixed(2)}</output></label><input id="scene-motion" type="range" min="0" max="1" step="0.01" value={maxMotion} onChange={(event) => setMaxMotion(Number(event.target.value))} /><div><span>Still</span><span>Fast</span></div></div><Button variant="primary" type="submit"><Search size={19} /> Search samples</Button></form><div className={styles.resultsHeading}><h3>Matches</h3><span>{results.length} demo scenes</span></div><div className={styles.resultList}>{results.map((scene, index) => <button key={scene.id} className={selected?.id === scene.id ? styles.resultActive : ''} onClick={() => setSelectedId(scene.id)}><img src={scene.image} alt="" /><span><strong>{index + 1}. {scene.title}</strong><small>{scene.start} – {scene.end}</small></span><span className={styles.resultArrow}>›</span></button>)}{!results.length && <p>No matches in the five sample records.</p>}</div></aside></div> : <LocalVideos videos={videos} selectedId={localId} onSelect={setLocalId} repository={repository} onMedia={onMedia} />}</>}</main>
    </div>{featureOpen && <FeatureDialog feature="export" onClose={() => setFeatureOpen(false)} closeLabel="Close" />}
  </div>
}
