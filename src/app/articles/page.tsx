import { getSortedArticlesData } from '@/lib/articles'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Tous les articles | RunPassion',
  description: 'Retrouvez l\'intégralité des tests chaussures, actu running et conseils de la rédaction de RunPassion.',
}

export default async function ArticlesPage() {
  const allArticles = await getSortedArticlesData()

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <header className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6">
          <span className="text-brand-yellow">Tous nos</span> Articles
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Plongez dans nos archives : {allArticles.length} tests, conseils et guides pour vous accompagner sereinement.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allArticles.map(({ slug, title, date, excerpt, image, category }) => (
          <Link href={`/${slug}`} key={slug} className="group block bg-brand-cardGray rounded-3xl overflow-hidden border border-white/5 hover:border-brand-yellow/30 transition-all shadow-xl hover:-translate-y-2 hover:shadow-2xl">
            <div className="aspect-[4/3] relative overflow-hidden bg-[#111]">
              {image ? (
                <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 font-black italic text-2xl">RunPassion</div>
              )}
              {category && (
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-brand-yellow text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full z-10 border border-brand-yellow/20">
                  {category}
                </div>
              )}
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <time>{new Date(date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</time>
              </div>
              
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-3 line-clamp-2">
                {title}
              </h3>
              
              <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                {excerpt}
              </p>
              
              <div className="flex items-center text-brand-yellow font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Lire la suite <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
