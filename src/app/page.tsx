import Link from "next/link";
import { ArrowRight, Box, Compass, Search, Sparkles } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.badge}>
          <Sparkles size={14} className={styles.badgeIcon} />
          <span>VC Intelligence Platform V2</span>
        </div>
        <h1 className={styles.title}>
          Discover the Next <span className={styles.highlight}>Unicorn</span>.
        </h1>
        <p className={styles.subtitle}>
          The ultimate intelligence platform for modern venture capital.
          Source, enrich, and track high-potential startups seamlessly with AI-powered insights.
        </p>

        <div className={styles.actions}>
          <Link href="/companies" className={`${styles.btn} ${styles.btnPrimary}`}>
            Go to Directory <ArrowRight size={16} />
          </Link>
          <Link href="/saved" className={`${styles.btn} ${styles.btnSecondary}`}>
            Saved Searches
          </Link>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Compass size={24} />
          </div>
          <h3>Global Directory</h3>
          <p>Browse through hundreds of tracked startups and add your own custom targets instantly.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Sparkles size={24} />
          </div>
          <h3>Live AI Enrichment</h3>
          <p>Scrape and parse live startup websites on-demand using Google Gemini 2.5 Flash.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Box size={24} />
          </div>
          <h3>Curated Lists</h3>
          <p>Organize deal flow intuitively and export your startup collections to CSV or JSON format.</p>
        </div>
      </div>
    </div>
  );
}
