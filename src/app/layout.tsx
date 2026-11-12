import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://runpassion.fr'),
  title: 'RunPassion | Blog Running, Trail & Tests de Chaussures',
  description: 'Découvrez nos tests indépendants de chaussures de running et de trail.',
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="bg-black text-white antialiased selection:bg-brand-yellow selection:text-black font-sans">
        <header className="fixed top-0 w-full bg-black/90 backdrop-blur-md z-50 border-b border-white/10">
          <div className="max-w-[1200px] mx-auto px-6 h-20 flex justify-between items-center">
            <a href="/" className="flex items-center gap-3 cursor-pointer group">
              <img src="/Vert et Orange Fluo Sci-Fi Jeu YouTube Chaîne Art.png" alt="RunPassion" className="h-10 w-auto invert brightness-150 mix-blend-screen group-hover:scale-105 transition-transform" />
              <div className="flex items-center">
                  <span className="text-xl font-black text-white uppercase italic tracking-tighter">RUN</span>
                  <span className="text-xl font-black text-brand-yellow uppercase italic tracking-tighter">PASSION</span>
              </div>
            </a>
            <nav className="flex gap-4 md:gap-8 font-bold text-xs uppercase tracking-widest items-center">
                <a href="/" className="hidden md:inline text-white hover:text-brand-yellow transition">Accueil</a>
                <a href="/chaussures" className="inline-flex items-center gap-2 bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/40 px-3.5 py-1.5 rounded-full hover:bg-brand-yellow hover:text-black transition">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
                  Archive 3D
                </a>
                <a href="/#tests-materiel" className="hidden md:inline text-gray-400 hover:text-brand-yellow transition">Tests</a>
                <a href="/#actu-section" className="hidden md:inline text-gray-400 hover:text-brand-yellow transition">Actualités</a>
                <a
                  href="https://vincentbuisson.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex items-center gap-1.5 text-brand-yellow border border-brand-yellow/40 px-4 py-2 rounded-lg hover:bg-brand-yellow hover:text-black transition font-black"
                >
                  Coaching ↗
                </a>
            </nav>
          </div>
        </header>

        <main className="pt-24 pb-12">
          {children}
        </main>

        <footer className="bg-brand-cardGray pt-10 pb-10 border-t border-white/10 mt-12 text-center text-gray-500 text-sm">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>RUNPASSION © {new Date().getFullYear()}</span>
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
              <a href="https://top4running.fr?a_box=sc3esau3" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition">
                Top4Running (-5% : RUNPASSION)
              </a>
              <a href="https://vincentbuisson.fr" target="_blank" rel="noopener noreferrer" className="text-brand-yellow hover:underline">
                Coaching vincentbuisson.fr ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
