import React from 'react';
import { getSpecsForArticle } from '@/lib/specsData';
import { Scale, ArrowDownUp, Layers, Tag, Activity, Target, PlusCircle, MinusCircle, Check, X } from 'lucide-react';

interface SpecsDashboardProps {
  title: string;
}

export default function SpecsDashboard({ title }: SpecsDashboardProps) {
  const { specs, notes, pForts, pFaibles } = getSpecsForArticle(title);

  return (
    <div className="mt-12">
      <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-8 border-l-4 border-brand-yellow pl-4">
        Caractéristiques & Verdict
      </h2>
      <div className="bg-brand-cardGray border border-white/5 rounded-[24px] p-8 my-8 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Spécifications */}
          <div>
            <h4 className="text-brand-yellow font-black uppercase tracking-[0.2em] text-[10px] mb-6">Spécifications</h4>
            <ul className="space-y-4 text-gray-300 font-medium">
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                  <Scale className="w-4 h-4 text-brand-yellow" /> Poids
                </span> 
                <strong className="text-white text-sm text-right">{specs.poids}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                  <ArrowDownUp className="w-4 h-4 text-brand-yellow" /> Drop
                </span> 
                <strong className="text-white text-sm text-right">{specs.drop}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                  <Layers className="w-4 h-4 text-brand-yellow" /> Stack
                </span> 
                <strong className="text-white text-sm text-right">{specs.stack}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                  <Tag className="w-4 h-4 text-brand-yellow" /> Prix
                </span> 
                <strong className="text-white text-sm text-right">{specs.prix}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
                  <Activity className="w-4 h-4 text-brand-yellow" /> Profil
                </span> 
                <strong className="text-white text-sm text-right">{specs.profil}</strong>
              </li>
              <li className="flex flex-col gap-2 pt-2">
                <span className="flex items-center gap-3 text-xs uppercase tracking-widest text-brand-yellow">
                  <Target className="w-4 h-4" /> Usage
                </span> 
                <strong className="text-gray-300 text-sm font-medium leading-relaxed">{specs.usage}</strong>
              </li>
            </ul>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-brand-yellow font-black uppercase tracking-[0.2em] text-[10px] mb-6">Nos Notes</h4>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-gray-400">Amorti</span> 
                  <strong className="text-white">{notes.amorti.toFixed(1)}<span className="text-gray-600">/10</span></strong>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${notes.amorti * 10}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-gray-400">Dynamisme</span> 
                  <strong className="text-white">{notes.dynamisme.toFixed(1)}<span className="text-gray-600">/10</span></strong>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${notes.dynamisme * 10}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-gray-400">Confort</span> 
                  <strong className="text-white">{notes.confort.toFixed(1)}<span className="text-gray-600">/10</span></strong>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${notes.confort * 10}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-gray-400">Stabilité</span> 
                  <strong className="text-white">{notes.stabilite.toFixed(1)}<span className="text-gray-600">/10</span></strong>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${notes.stabilite * 10}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* POINTS FORTS / FAIBLES DYNAMIQUES */}
        <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h4 className="text-green-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Points forts
            </h4>
            <ul className="space-y-3 text-gray-300 text-sm font-medium">
              {pForts.map((pt, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
            <h4 className="text-red-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4 flex items-center gap-2">
              <MinusCircle className="w-4 h-4" /> Points faibles
            </h4>
            <ul className="space-y-3 text-gray-300 text-sm font-medium">
              {pFaibles.map((pt, i) => (
                <li key={i} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
