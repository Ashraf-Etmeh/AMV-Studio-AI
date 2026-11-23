import { ArrowRight, Film, Music2, Sparkles } from 'lucide-react'
import { demoArt } from '../../assets/demo/manifest'
import styles from './Dashboard.module.css'

export type WorkflowFeature = 'analyze' | 'scenes' | 'generate'

const workflows = [
  { id: 'analyze', title: 'Analyze Song', description: 'Extract beats, structure, mood, and lyric meaning from your music.', image: demoArt.song, Icon: Music2, tone: 'purple' },
  { id: 'scenes', title: 'Build Scene Library', description: 'Turn anime videos into a searchable library of scenes, actions, and emotions.', image: demoArt.scenes, Icon: Film, tone: 'cyan' },
  { id: 'generate', title: 'Generate AMV', description: 'Match song and scenes, arrange clips with a narrative, and render your AMV.', image: demoArt.generate, Icon: Sparkles, tone: 'cyan' },
] as const

export function WorkflowCards({ onSelect }: { onSelect: (feature: WorkflowFeature) => void }) {
  return (
    <section className={styles.workflowGrid} aria-label="Creative workflow">
      {workflows.map(({ id, title, description, image, Icon, tone }) => (
        <button key={id} className={styles.workflowCard} onClick={() => onSelect(id)} aria-label={title}>
          <img src={image} alt="" className={styles.workflowImage} />
          <span className={styles.workflowBody}>
            <span className={`${styles.workflowIcon} ${styles[tone]}`}><Icon size={29} strokeWidth={1.8} /></span>
            <span className={styles.workflowText}><strong>{title}</strong><span>{description}</span></span>
            <ArrowRight className={styles.workflowArrow} size={23} strokeWidth={1.7} />
          </span>
        </button>
      ))}
    </section>
  )
}
