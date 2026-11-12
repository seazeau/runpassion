import { getSortedArticlesData } from '@/lib/articles'
import { Zap, Ticket, ExternalLink, BookOpen, Radio, ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'
import { ensureTop4RunningAffiliateUrl } from '@/lib/affiliate'

// Bons Plans statiques (tous sécurisés avec a_box=sc3esau3)
const bonsPlansData = [
  { brand: "Nike", model: "Vomero Plus", image: "/image_047be3.jpg", oldPrice: "169,95€", newPrice: "158,30€", discount: "-7%", link: ensureTop4RunningAffiliateUrl("https://top4running.fr/p/nike-vomero-plus-running-shoe-hv8150-008?a_box=sc3esau3") },
  { brand: "Asics", model: "SonicBlast", image: "/image_047c04.jpg", oldPrice: "190,00€", newPrice: "134,90€", discount: "-29%", link: ensureTop4RunningAffiliateUrl("https://top4running.fr/p/asics-sonicblast-1012b862-100#p0") },
  { brand: "Asics", model: "Metaspeed Sky Tokyo", image: "/image_046882.jpg", oldPrice: "270,00€", newPrice: "213,90€", discount: "-21%", link: ensureTop4RunningAffiliateUrl("https://top4running.fr/p/asics-metaspeed-sky-tokyo-1013a162-600?a_box=sc3esau3") },
  { brand: "Saucony", model: "Endorphin Elite 2", image: "/image_047b67.jpg", oldPrice: "300,00€", newPrice: "219,00€", discount: "-27%", link: ensureTop4RunningAffiliateUrl("https://top4running.fr/c/soldes-top4running-fr/type-2/page-10") },
  { brand: "Adidas", model: "Adios Pro 4", image: "https://i1.t4s.cz//products/js2579/adidas-adizero-adios-pro-4-1054720-js25791-960.webp", oldPrice: "250,00€", newPrice: "215,40€", discount: "-14%", link: ensureTop4RunningAffiliateUrl("https://top4running.fr/p/adidas-adizero-adios-pro-4-running-shoe-js2579?a_box=sc3esau3") }
];

export default function Home() {
  const allArticles = getSortedArticlesData()
  
  const isActu = (a: any) => a.category && a.category.toLowerCase().includes('actu')
  const isGuide = (a: any) => a.category && a.category.toLowerCase().includes('guide')

  const hero = allArticles.find(a => !isGuide(a) && !isActu(a)) || allArticles[0]
  const sideFeatured = allArticles.filter(a => a.slug !== hero?.slug && !isGuide(a) && !isActu(a)).slice(0, 2)
  
  const newsArticles = allArticles.filter(isActu).slice(0, 4)
  const guidesArticles = allArticles.filter(isGuide).slice(0, 3)
  
  const listArticles = allArticles
    .filter(a => !isActu(a) && !isGuide(a) && a.slug !== hero?.slug)
    .filter(a => !sideFeatured.find(sf => sf.slug === a.slug))
    .slice(0, 8)

  return (
    <div className="max-w-[1200px] mx-auto px-6">
      
      {hero && (
        <section id="hero-section" className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
              <Link href={`/${hero.slug}`} className="lg:col-span-2 relative h-[500px] lg:h-[550px] rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 shadow-2xl block">
                  <img src={hero.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:bg-gradient-to-r md:from-black/90 md:to-transparent"></div>
                  <div className="absolute bottom-0 p-8 md:p-12 w-full">
                      <span className="bg-brand-yellow text-black text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block italic">À la une</span>
                      <h2 className="text-3xl md:text-5xl font-black leading-[1.1] group-hover:text-brand-yellow transition-colors italic uppercase tracking-tighter text-white">{hero.title}</h2>
                  </div>
              </Link>
              <div className="flex flex-col gap-6 h-full">
                  {sideFeatured.map(art => (
                    <Link href={`/${art.slug}`} key={art.slug} className="flex-1 relative rounded-[24px] overflow-hidden cursor-pointer group shadow-xl border border-white/5 min-h-[200px] block">
                        <img src={art.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 p-6 w-full">
                          <h3 className="text-lg md:text-xl font-black text-white group-hover:text-brand-yellow transition-colors leading-tight italic uppercase">{art.title}</h3>
                        </div>
                    </Link>
                  ))}
              </div>
          </div>
        </section>
      )}

      <section id="bons-plans-section" className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Zap className="text-brand-yellow w-5 h-5" /> Bons Plans Flash
              </h2>
          </div>
          <div className="flex overflow-x-auto hide-scroll lg:grid lg:grid-cols-5 md:grid-cols-3 gap-6 pb-4">
            {bonsPlansData.map((item, idx) => (
              <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="min-w-[260px] md:min-w-0 w-full bg-brand-cardGray border border-white/5 rounded-2xl p-5 flex flex-col group hover:border-brand-yellow/30 transition-all cursor-pointer shadow-lg relative block">
                  <div className="relative w-full aspect-square bg-white rounded-xl mb-5 overflow-hidden p-4 flex items-center justify-center">
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-md z-10">{item.discount}</span>
                      <img src={item.image} className="w-full h-full object-contain grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 rounded" />
                  </div>
                  <div className="text-center flex-grow flex flex-col">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">{item.brand}</span>
                      <h4 className="text-white font-black text-lg mb-4 leading-tight">{item.model}</h4>
                      <div className="flex items-end justify-center gap-3 mb-6 mt-auto">
                          <span className="text-brand-yellow font-black text-2xl leading-none">{item.newPrice}</span>
                          <span className="text-gray-500 line-through text-sm font-medium mb-0.5">{item.oldPrice}</span>
                      </div>
                      <span className="w-full flex justify-center items-center gap-2 bg-white/10 group-hover:bg-brand-yellow text-white group-hover:text-black font-black py-3 rounded-xl transition-colors uppercase text-[10px] tracking-widest">
                          Profiter de l'offre <ArrowRight className="w-4 h-4" />
                      </span>
                  </div>
              </a>
            ))}
          </div>
      </section>

      {/* SECTION PARTENAIRES */}
      <section id="promo-section" className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Ticket className="text-brand-yellow w-5 h-5" /> Partenaires officiels
              </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top4Running */}
              <div className="bg-brand-card border border-white/5 p-8 rounded-3xl relative overflow-hidden flex flex-col">
                  <a href="https://top4running.fr?a_box=sc3esau3" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 mb-6 group/link">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg shrink-0 transition-transform group-hover/link:scale-105">
                          <img src="/image_808e21.png" alt="Top4Running" className="w-full h-full object-contain" />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover/link:text-brand-yellow transition-colors">
                              Top4Running <ExternalLink className="w-4 h-4 inline-block ml-1 opacity-50 mb-1" />
                          </h3>
                          <p className="text-brand-yellow text-xs font-bold uppercase">-5% SUPPLÉMENTAIRES</p>
                      </div>
                  </a>
                  <div className="flex gap-2 mt-auto">
                      <div className="bg-black border border-white/10 px-4 py-3 rounded-lg flex-grow font-mono font-bold text-white text-center tracking-widest uppercase italic">RUNPASSION</div>
                      <CopyButton code="RUNPASSION" className="bg-brand-yellow text-black font-bold px-4 py-3 rounded-lg hover:bg-brand-yellow/80 transition" />
                  </div>
              </div>
              {/* Nutripure */}
              <div className="bg-brand-card border border-white/5 p-8 rounded-3xl relative overflow-hidden flex flex-col">
                  <a href="https://www.nutripure.fr/fr/?s=RUNPASSION" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 mb-6 group/link">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg shrink-0 transition-transform group-hover/link:scale-105">
                          <img src="/image_808dff.png" alt="Nutripure" className="w-full h-full object-contain" />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover/link:text-brand-yellow transition-colors">
                              Nutripure <ExternalLink className="w-4 h-4 inline-block ml-1 opacity-50 mb-1" />
                          </h3>
                          <p className="text-brand-yellow text-xs font-bold uppercase">-10% 1ÈRE COMMANDE</p>
                      </div>
                  </a>
                  <div className="flex gap-2 mt-auto">
                      <div className="bg-black border border-white/10 px-4 py-3 rounded-lg flex-grow font-mono font-bold text-white text-center tracking-widest uppercase text-sm flex items-center justify-center italic">RUNPASSION</div>
                      <CopyButton code="RUNPASSION" className="bg-white text-black font-bold px-4 py-3 rounded-lg hover:bg-gray-200 transition" />
                  </div>
              </div>
          </div>
      </section>

      {/* GUIDES D'ACHAT */}
      {guidesArticles.length > 0 && (
        <section id="guides-section" className="mb-20">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <BookOpen className="text-brand-yellow w-5 h-5" /> Guides d'Achat 2026
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {guidesArticles.map(g => (
                <Link href={`/${g.slug}`} key={g.slug} className="group relative rounded-2xl overflow-hidden cursor-pointer h-[200px] shadow-lg border border-white/5 hover:scale-[1.02] transition-transform block w-full">
                    <img src={g.image} className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-5 w-full">
                        <span className="inline-block bg-brand-yellow/20 text-brand-yellow text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 border border-brand-yellow/30">Guide Complet</span>
                        <h3 className="text-lg font-bold text-white group-hover:text-brand-yellow transition-colors italic leading-tight">{g.title}</h3>
                    </div>
                </Link>
              ))}
            </div>
        </section>
      )}

      {/* ENCART PROMO COACHING EXTERNE (vincentbuisson.fr) */}
      <section id="coaching-section" className="mb-20">
        <div className="relative bg-gradient-to-r from-brand-card via-[#16161f] to-black rounded-[32px] p-8 md:p-12 border border-brand-yellow/20 shadow-2xl overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 group">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-brand-yellow shrink-0 shadow-xl">
              <img
                src="/Paris_Half_Race_Story-08.jpg"
                alt="Vincent Buisson Coach Running"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <span className="bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                  Coaching Sur-Mesure
                </span>
                <span className="bg-white/5 text-gray-400 border border-white/10 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
                  Suivi Nolio 7j/7
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-2">
                Préparez vos objectifs avec Vincent Buisson
              </h2>
              <p className="text-gray-400 text-sm max-w-xl font-medium">
                Diplômé STAPS &amp; Enseignant EPS. Programmes 100% individualisés du 10 km au marathon et trail. Échanges quotidiens et premier bilan visio offert.
              </p>
            </div>
          </div>
          <div className="z-10 shrink-0 w-full lg:w-auto">
            <a
              href="https://vincentbuisson.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full lg:w-auto bg-brand-yellow text-black font-black py-4 px-8 rounded-xl hover:bg-white hover:scale-105 transition-all uppercase text-xs tracking-widest shadow-xl italic"
            >
              Découvrir le coaching <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FIL ACTU */}
      {newsArticles.length > 0 && (
        <section id="actu-section" className="mb-24">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Radio className="text-brand-yellow w-5 h-5" /> Le Fil Actu
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {newsArticles.map(a => (
                <Link href={`/${a.slug}`} key={a.slug} className="bg-brand-cardGray border-l-4 border-brand-yellow rounded-r-xl p-5 hover:bg-white/5 flex flex-col cursor-pointer border-y border-r border-white/5 shadow-lg block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-brand-yellow text-[10px] font-black uppercase bg-brand-yellow/10 px-2 py-1 rounded">Actu</span>
                    <span className="text-gray-500 text-[10px] font-medium uppercase">
                      {new Date(a.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold leading-snug text-sm">{a.title}</h3>
                </Link>
              ))}
            </div>
        </section>
      )}

      {/* ARTICLES GRILLE */}
      <section id="tests-materiel" className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">Nos Tests & Conseils</h2>
              <Link href="/chaussures" className="inline-flex items-center gap-2 bg-brand-yellow text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg">
                Explorer l&apos;Archive 3D <ArrowRight className="w-4 h-4" />
              </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 mb-12">
            {listArticles.map(art => (
              <Link href={`/${art.slug}`} key={art.slug} className="flex flex-col group cursor-pointer block">
                <div className="aspect-[16/10] rounded-[24px] overflow-hidden mb-6 bg-brand-card border border-white/5 shadow-lg relative">
                  <img src={art.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 bg-brand-yellow/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase text-black tracking-widest">
                    {art.category}
                  </div>
                </div>
                <h3 className="text-xl font-bold leading-tight group-hover:text-brand-yellow transition-colors italic uppercase tracking-tighter">
                  {art.title}
                </h3>
              </Link>
            ))}
          </div>
      </section>

    </div>
  )
}
