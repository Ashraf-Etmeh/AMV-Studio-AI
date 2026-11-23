import { ArrowRight, Folder, Plus } from 'lucide-react'
import { demoArt } from '../../assets/demo/manifest'
import { Button } from '../../components/ui/Button'
import styles from './Dashboard.module.css'

export function Hero({ onCreate, onOpen }: { onCreate: () => void; onOpen: () => void }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <img className={styles.heroArt} src={demoArt.hero} alt="" fetchPriority="high" />
      <div className={styles.heroContent}>
        <h1 id="hero-title">AI-Powered<br /><span>Anime Music Video Creator</span></h1>
        <p>Turn your songs and anime footage into cinematic AMVs with AI.<br className={styles.desktopBreak} /> Understand the music, find the right scenes, and craft a compelling visual story.</p>
        <div className={styles.heroActions}>
          <Button variant="primary" onClick={onCreate}><Plus size={28} strokeWidth={1.7} /><span>Create New Project</span><ArrowRight size={23} /></Button>
          <Button onClick={onOpen}><Folder size={26} strokeWidth={1.7} /><span>Open Project</span></Button>
        </div>
      </div>
    </section>
  )
}
