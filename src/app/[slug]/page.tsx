import { getArticleData, getAllArticleSlugs } from '@/lib/articles'
import { notFound } from 'next/navigation'
import { Ticket, ArrowUpRight } from 'lucide-react'
import SpecsDashboard from '@/components/SpecsDashboard'
import { isShoeReview } from '@/lib/specsData'
import { extractBestTop4RunningLink } from '@/lib/affiliate'

export async function generateStaticParams() {
  const slugs = getAllArticleSlugs()
  return slugs
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const articleData = await getArticleData(params.slug)
  if (!articleData) return {}

  return {
    title: `${articleData.title} | RunPassion`,
    description: articleData.excerpt,
    alternates: {
      canonical: `https://runpassion.fr/${params.slug}`,
    },
    openGraph: {
      title: `${articleData.title} | RunPassion`,
      description: articleData.excerpt,
      url: `https://runpassion.fr/${params.slug}`,
      images: [articleData.image],
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleData = await getArticleData(params.slug)

  if (!articleData) {
    notFound()
  }

  const shoeReview = isShoeReview(articleData.title, articleData.category)
  const t4rLink = shoeReview
    ? extractBestTop4RunningLink(articleData.contentHtml, articleData.title)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleData.title,
    description: articleData.excerpt,
    image: articleData.image,
    datePublished: articleData.date,
    author: {
      '@type': 'Person',
      name: 'Vincent Buisson',
      url: 'https://vincentbuisson.fr',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RunPassion',
      url: 'https://runpassion.fr',
    },
  }

  return (
    <article className="max-w-[800px] mx-auto px-6 mt-12 mb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mb-10 text-center">
        {articleData.category && (
          <span className="text-brand-yellow font-bold uppercase tracking-widest text-xs mb-4 block">
            {articleData.category}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6 leading-tight">
          {articleData.title}
        </h1>
        <div className="flex justify-center items-center gap-4 text-brand-metaGray text-sm font-semibold">
          <span>
            {new Date(articleData.date).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </header>

      {articleData.image && (
        <div className="mb-12 rounded-2xl overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] border border-white/5 relative aspect-video">
          <img
            src={articleData.image}
            alt={articleData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Dashboard des Caractéristiques en haut de l'article pour les tests de chaussures */}
      {shoeReview && <SpecsDashboard title={articleData.title} />}

      {/* Premier CTA Haut de Page (ciblé sur la paire testée avec a_box=sc3esau3) */}
      {shoeReview && t4rLink && (
        <div className="mt-8 mb-12 w-full text-center bg-gradient-to-br from-brand-cardGray to-black p-10 rounded-[32px] border border-brand-yellow/10 shadow-2xl relative overflow-hidden group">
          <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-3 relative z-10">
            Convaincu par ce modèle ?
          </h3>
          <p className="text-brand-yellow font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-8 relative z-10">
            -5% supplémentaires chez Top4Running avec le code RUNPASSION
          </p>
          <a
            href={t4rLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center justify-center w-full md:w-auto gap-4 bg-brand-yellow text-black font-black py-4 px-10 rounded-xl hover:bg-white hover:scale-105 transition-all uppercase text-sm tracking-[0.2em] shadow-lg"
          >
            Acheter la paire
          </a>
        </div>
      )}

      {/* Tests Pratiques Header */}
      {shoeReview && (
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-8 border-l-4 border-brand-yellow pl-4 mt-12">
          Tests Pratiques
        </h2>
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: articleData.contentHtml || '' }}
      />

      {/* CTA Partenaire Dynamique à la fin (Uniquement tests chaussures) */}
      {shoeReview && t4rLink && (
        <div className="mt-16 bg-gradient-to-br from-[#1a1a1a] to-black border border-brand-yellow/20 p-8 md:p-12 rounded-3xl text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110"></div>
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic mb-4 relative z-10">
            Envie de craquer pour cette paire ?
          </h3>
          <p className="text-gray-300 mb-8 font-medium text-lg max-w-2xl mx-auto relative z-10 leading-relaxed">
            Soutenez RunPassion et bénéficiez de <strong>-5% de réduction supplémentaire</strong> chez notre partenaire Top4Running avec le code{' '}
            <span className="bg-brand-yellow/20 text-brand-yellow px-2 py-1 rounded border border-brand-yellow/30 font-bold ml-1">
              RUNPASSION
            </span>{' '}
            !
          </p>
          <a
            href={t4rLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center justify-center gap-3 bg-brand-yellow text-black font-black px-8 py-4 rounded-xl hover:bg-white hover:scale-105 transition-all text-lg shadow-xl shadow-brand-yellow/20 mx-auto w-full md:w-auto"
          >
            <Ticket className="w-6 h-6" />
            Acheter ma paire sur Top4Running
          </a>
        </div>
      )}

      {/* Encart Auteur & Coaching externe */}
      <div className="mt-12 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <img
          src="/Paris_Half_Race_Story-08.jpg"
          alt="Vincent Buisson"
          className="w-20 h-20 rounded-full object-cover border-2 border-brand-yellow shrink-0"
        />
        <div className="text-center md:text-left">
          <div className="text-brand-yellow font-black uppercase tracking-widest text-xs mb-1">
            Testé par Vincent Buisson
          </div>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            Fondateur de RunPassion, enseignant d&apos;EPS et coach running diplômé STAPS. Besoin d&apos;un plan sur-mesure sur Nolio (10 km, semi, marathon, trail) ?
          </p>
          <a
            href="https://vincentbuisson.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-yellow hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
          >
            <span>Découvrir son coaching sur vincentbuisson.fr</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  )
}
