import { notFound } from "next/navigation"
import Link from "@/components/Link"
import { ARTICLES } from "@/data/journal"
import { SESSIONS } from "@/data/sessions"

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  return { title: article.title, description: article.description }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  return (
    <main id="main-content" className="surface-paper">
      <article className="article">
        <Link className="tlink" href="/journal" style={{ marginBottom: 28 }}>&larr; The journal</Link>
        <p className="data" style={{ margin: "0 0 16px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--s-meta)" }}>
          {article.date} · {article.readTime}
        </p>
        <h1 className="h1">{article.title}</h1>
        <p className="article__lead">{article.lead}</p>
        <div className="hairline" />
        {article.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div style={{ borderTop: "1px solid var(--s-rule)", marginTop: 20, paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <p className="meta">An hour of doing nothing, from {SESSIONS[0].price}.</p>
          <Link className="btn" href="/book">Book a chair</Link>
        </div>
      </article>
    </main>
  )
}
