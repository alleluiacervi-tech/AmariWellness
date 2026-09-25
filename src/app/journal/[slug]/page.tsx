import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "@/components/Link"
import { Arrow, ArrowLeft } from "@/components/icons"
import { ARTICLES, isoDate } from "@/data/journal"
import { SESSIONS } from "@/data/sessions"
import { OPEN_GRAPH_BASE } from "@/lib/metadata"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  const path = `/journal/${article.slug}`
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "article",
      title: article.title,
      description: article.description,
      url: path,
      publishedTime: isoDate(article.date),
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const index = ARTICLES.findIndex((a) => a.slug === slug)
  if (index === -1) notFound()
  const article = ARTICLES[index]
  const next = ARTICLES[(index + 1) % ARTICLES.length]

  return (
    <main id="main-content">
      <article className="article">
        <Link className="tlink" href="/journal">
          <ArrowLeft /> The journal
        </Link>
        <p className="article__meta">
          <time dateTime={isoDate(article.date)}>{article.date}</time>
          <span>{article.readTime}</span>
        </p>
        <h1 className="h1">{article.title}</h1>
        <p className="article__standfirst">{article.lead}</p>

        <div className="article__body">
          {article.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <footer className="article__end">
          <div className="article__cta">
            <div className="stack--tight">
              <p className="h4">Make time for nothing.</p>
              <p className="meta">
                A private suite, from{" "}
                <span className="data">{SESSIONS[0].price}</span> for fifteen
                minutes.
              </p>
            </div>
            <Link className="btn" href="/book">
              Book a session <Arrow />
            </Link>
          </div>
          <Link className="row-link" href={`/journal/${next.slug}`}>
            <span className="stack--tight">
              <span className="label">Read next</span>
              <span className="h3">{next.title}</span>
            </span>
            <Arrow />
          </Link>
        </footer>
      </article>
    </main>
  )
}
