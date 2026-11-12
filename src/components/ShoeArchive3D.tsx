'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ShoeArchiveItem } from '@/lib/shoeArchive';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Scale,
  ArrowDownUp,
  Layers,
  Tag,
  Check,
  Copy,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react';

interface ShoeArchive3DProps {
  items: ShoeArchiveItem[];
}

type DisciplineFilter = 'Toutes' | 'Carbone & Élite' | 'Daily & Tempo' | 'Trail';

export default function ShoeArchive3D({ items }: ShoeArchive3DProps) {
  const [discipline, setDiscipline] = useState<DisciplineFilter>('Toutes');
  const [lightMode, setLightMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [hoverCenter, setHoverCenter] = useState(false);

  const filteredItems = useMemo(() => {
    if (discipline === 'Toutes') return items;
    return items.filter((it) => it.discipline === discipline);
  }, [items, discipline]);

  // Brand markers for bottom timeline scrubber
  const brandMarkers = useMemo(() => {
    const map = new Map<string, number>();
    filteredItems.forEach((item, idx) => {
      if (!map.has(item.brand)) {
        map.set(item.brand, idx);
      }
    });
    return Array.from(map.entries()).map(([brand, startIndex]) => ({
      brand,
      startIndex,
      pct: filteredItems.length > 1 ? (startIndex / (filteredItems.length - 1)) * 100 : 0,
    }));
  }, [filteredItems]);

  // Physics & DOM refs (60/120fps zero-rerender loop)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const frontShadeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrubberThumbRef = useRef<HTMLDivElement | null>(null);
  const scrubberFillRef = useRef<HTMLDivElement | null>(null);
  const cursorPillRef = useRef<HTMLDivElement | null>(null);
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);

  const physicsRef = useRef({
    current: 0,
    target: 0,
    detailCurrent: 0,
    detailTarget: 0,
    isDragging: false,
    dragMoved: false,
    dragStartX: 0,
    dragStartTarget: 0,
    lastPointerX: 0,
    velocityX: 0,
    isScrubbing: false,
    mouseNormX: 0,
    mouseNormY: 0,
    cursorX: 0,
    cursorY: 0,
    cursorCurrentX: 0,
    cursorCurrentY: 0,
    viewportW: 1280,
  });

  // Start near an iconic flagship shoe on initial mount (e.g. Adidas Adios Pro 4)
  useEffect(() => {
    const initialIdx = Math.max(
      0,
      filteredItems.findIndex((s) => s.slug.includes('adios-pro-4'))
    );
    const startIdx = initialIdx >= 0 ? initialIdx : Math.min(4, Math.floor(filteredItems.length / 2));
    physicsRef.current.current = startIdx;
    physicsRef.current.target = startIdx;
    setActiveIndex(startIdx);
    setIsDetailOpen(false);
    physicsRef.current.detailTarget = 0;
  }, [discipline, filteredItems]);

  useEffect(() => {
    physicsRef.current.detailTarget = isDetailOpen ? 1 : 0;
  }, [isDetailOpen]);

  // Track viewport width for responsive 3D offsets
  useEffect(() => {
    const updateSize = () => {
      physicsRef.current.viewportW = window.innerWidth;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const clampIndex = useCallback(
    (val: number) => {
      if (filteredItems.length <= 1) return 0;
      return Math.max(0, Math.min(filteredItems.length - 1, val));
    },
    [filteredItems.length]
  );

  const goToIndex = useCallback(
    (idx: number) => {
      const clamped = clampIndex(idx);
      physicsRef.current.target = clamped;
    },
    [clampIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDetailOpen) {
        setIsDetailOpen(false);
        return;
      }
      if (isDetailOpen) {
        if (e.key === 'ArrowRight') {
          const next = clampIndex(Math.round(physicsRef.current.target) + 1);
          physicsRef.current.target = next;
          physicsRef.current.current = next;
          setActiveIndex(next);
        } else if (e.key === 'ArrowLeft') {
          const prev = clampIndex(Math.round(physicsRef.current.target) - 1);
          physicsRef.current.target = prev;
          physicsRef.current.current = prev;
          setActiveIndex(prev);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToIndex(Math.round(physicsRef.current.target) + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToIndex(Math.round(physicsRef.current.target) - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsDetailOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDetailOpen, clampIndex, goToIndex]);

  // Wheel / Trackpad handler on stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (physicsRef.current.detailTarget > 0.5) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = delta * 0.0045;
      physicsRef.current.target = clampIndex(physicsRef.current.target + step);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampIndex]);

  // Main 60/120fps animation loop
  useEffect(() => {
    let rafId = 0;
    let lastReportedIndex = -1;

    const renderFrame = () => {
      const p = physicsRef.current;
      const total = filteredItems.length;

      // Smooth spring-like lerp toward target
      if (!p.isDragging && !p.isScrubbing && p.detailTarget < 0.5) {
        // Gentle snap toward nearest integer when nearly settled
        const distToTarget = Math.abs(p.target - p.current);
        if (distToTarget < 0.08) {
          const nearest = Math.round(p.target);
          p.target += (nearest - p.target) * 0.14;
        }
      }

      p.current += (p.target - p.current) * 0.13;
      p.detailCurrent += (p.detailTarget - p.detailCurrent) * 0.12;

      // Magnetic cursor smoothing
      p.cursorCurrentX += (p.cursorX - p.cursorCurrentX) * 0.22;
      p.cursorCurrentY += (p.cursorY - p.cursorCurrentY) * 0.22;
      if (cursorPillRef.current) {
        cursorPillRef.current.style.transform = `translate3d(${p.cursorCurrentX - 44}px, ${p.cursorCurrentY - 44}px, 0)`;
      }

      const rounded = Math.max(0, Math.min(total - 1, Math.round(p.current)));
      if (rounded !== lastReportedIndex) {
        lastReportedIndex = rounded;
        setActiveIndex(rounded);
      }

      // Update bottom scrubber bar directly
      if (total > 1) {
        const pct = Math.max(0, Math.min(100, (p.current / (total - 1)) * 100));
        if (scrubberThumbRef.current) {
          scrubberThumbRef.current.style.left = `${pct}%`;
        }
        if (scrubberFillRef.current) {
          scrubberFillRef.current.style.width = `${pct}%`;
        }
      }

      const dp = p.detailCurrent;
      const isDesktop = p.viewportW >= 1024;
      const mobileFactor = p.viewportW < 640 ? 0.68 : p.viewportW < 1024 ? 0.84 : 1;

      // Update each shoe monolith DOM node
      for (let i = 0; i < total; i++) {
        const shoe = filteredItems[i];
        const node = boxRefs.current.get(shoe.id);
        if (!node) continue;

        const d = i - p.current;
        const ad = Math.abs(d);

        // Hide distant boxes outside the 23-box shelf window for ultra-fast GPU compositing
        if (ad > 11.5) {
          if (node.style.display !== 'none') {
            node.style.display = 'none';
          }
          continue;
        }
        if (node.style.display === 'none') {
          node.style.display = 'block';
        }

        const sign = d === 0 ? 0 : d > 0 ? 1 : -1;

        // Smooth C-infinity shelf coordinates
        const shelfX =
          (158 * Math.tanh(1.65 * d) +
            sign * 60 * ((1 - Math.pow(0.925, ad)) / (1 - 0.925))) *
          mobileFactor;

        const smoothAd = Math.hypot(d, 0.12) - 0.12;
        const shelfScale = (1 / (1 + 0.135 * smoothAd)) * mobileFactor;
        const shelfZ = (95 * Math.exp(-1.5 * d * d) - 22 * ad) * mobileFactor;
        const shelfRotY = -86.5 * Math.tanh(1.18 * d);

        const isSelected = i === rounded;

        if (isSelected && dp > 0.002) {
          // Seamless 3D transition of the chosen shoe into Detail View
          const targetX = isDesktop ? Math.min(310, p.viewportW * 0.22) : 0;
          const targetY = isDesktop ? -8 : -135;
          const targetScale = isDesktop ? 1.12 : 0.72;
          const targetZ = 130;
          const targetRotY = -14 + p.mouseNormX * 12;
          const targetRotX = -p.mouseNormY * 7;

          const x = shelfX * (1 - dp) + targetX * dp;
          const y = targetY * dp;
          const z = shelfZ * (1 - dp) + targetZ * dp;
          const sc = shelfScale * (1 - dp) + targetScale * dp;
          const ry = shelfRotY * (1 - dp) + targetRotY * dp;
          const rx = targetRotX * dp;

          node.style.opacity = '1';
          node.style.pointerEvents = 'auto';
          node.style.zIndex = '900';
          node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${sc.toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        } else {
          // Shelf item (fades & parts outward smoothly when detail view opens)
          const spreadOut = (sign || 1) * dp * 460 * mobileFactor;
          const x = shelfX + spreadOut;
          const opacity = Math.max(0, (1 - Math.max(0, (ad - 9.2) / 2.3)) * (1 - dp * 1.35));

          node.style.opacity = opacity.toFixed(3);
          node.style.pointerEvents = dp > 0.15 || opacity < 0.05 ? 'none' : 'auto';
          node.style.zIndex = String(Math.round(500 - ad * 25));
          node.style.transform = `translate3d(${x.toFixed(2)}px, 0px, ${shelfZ.toFixed(2)}px) scale(${shelfScale.toFixed(4)}) rotateY(${shelfRotY.toFixed(2)}deg)`;
        }

        // Dynamic studio lighting shade on the front cover as it turns away from light
        const shadeEl = frontShadeRefs.current.get(shoe.id);
        if (shadeEl) {
          const shadeAlpha = isSelected && dp > 0.1
            ? 0
            : Math.min(0.68, ad * 0.36);
          shadeEl.style.opacity = shadeAlpha.toFixed(3);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [filteredItems]);

  // Pointer drag handlers for the 3D shelf
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDetailOpen) return;
    if ((e.target as HTMLElement).closest('[data-no-drag="true"]')) return;
    const p = physicsRef.current;
    p.isDragging = true;
    p.dragMoved = false;
    p.dragStartX = e.clientX;
    p.lastPointerX = e.clientX;
    p.dragStartTarget = p.current;
    p.velocityX = 0;
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) {
      p.cursorX = e.clientX - rect.left;
      p.cursorY = e.clientY - rect.top;
      p.mouseNormX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      p.mouseNormY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    if (!p.isDragging) return;
    const dx = e.clientX - p.dragStartX;
    if (Math.abs(dx) > 6) {
      p.dragMoved = true;
    }
    p.velocityX = e.clientX - p.lastPointerX;
    p.lastPointerX = e.clientX;

    // Dragging left moves forward in the archive, dragging right moves backward
    const sensitivity = p.viewportW < 640 ? 95 : 135;
    p.target = clampIndex(p.dragStartTarget - dx / sensitivity);
  };

  const handleStagePointerUp = () => {
    const p = physicsRef.current;
    if (!p.isDragging) return;
    p.isDragging = false;
    // Apply momentum flick
    const flick = -p.velocityX * 0.065;
    p.target = clampIndex(Math.round(p.target + flick));
  };

  // Scrubber timeline pointer handlers
  const updateFromTimeline = (clientX: number) => {
    const track = timelineTrackRef.current;
    if (!track || filteredItems.length <= 1) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    physicsRef.current.target = ratio * (filteredItems.length - 1);
  };

  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    physicsRef.current.isScrubbing = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateFromTimeline(e.clientX);
  };

  const handleTimelinePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!physicsRef.current.isScrubbing) return;
    updateFromTimeline(e.clientX);
  };

  const handleTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!physicsRef.current.isScrubbing) return;
    physicsRef.current.isScrubbing = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    physicsRef.current.target = Math.round(physicsRef.current.target);
  };

  const handleBoxClick = (idx: number) => {
    if (physicsRef.current.dragMoved) return;
    if (isDetailOpen) return;

    if (idx === activeIndex && Math.abs(physicsRef.current.current - idx) < 0.35) {
      setIsDetailOpen(true);
    } else {
      goToIndex(idx);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('RUNPASSION');
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const activeShoe = filteredItems[activeIndex] || filteredItems[0];

  if (!activeShoe) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-400">
        Aucun modèle trouvé.
      </div>
    );
  }

  const bgClass = lightMode
    ? 'bg-[#f4f1ea] text-[#121211]'
    : 'bg-[#070709] text-white';

  const subtleTextClass = lightMode ? 'text-[#6b665c]' : 'text-gray-400';
  const borderClass = lightMode ? 'border-black/10' : 'border-white/10';
  const accentTextClass = lightMode ? 'text-[#1642d8]' : 'text-brand-yellow';

  return (
    <section
      ref={stageRef}
      onPointerDown={handleStagePointerDown}
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerUp}
      className={`relative w-full h-[calc(100vh-5rem)] min-h-[680px] overflow-hidden select-none transition-colors duration-500 -mt-4 -mb-12 flex flex-col justify-between ${bgClass}`}
      style={{ touchAction: isDetailOpen ? 'pan-y' : 'none' }}
    >
      {/* Subtle scanner / archival studio radial backdrop */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: lightMode
            ? 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(236,231,220,0.6) 65%, rgba(224,218,204,0.95) 100%)'
            : 'radial-gradient(circle at 50% 45%, rgba(255,182,0,0.06) 0%, rgba(16,16,20,0.4) 55%, rgba(5,5,7,0.98) 100%)',
        }}
      />

      {/* Tech scanner subtle grid in dark mode */}
      {!lightMode && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      {/* Magnetic floating cursor badge when hovering center box */}
      <div
        ref={cursorPillRef}
        className={`pointer-events-none fixed md:absolute top-0 left-0 z-[950] w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center font-black uppercase tracking-widest text-[10px] shadow-2xl transition-opacity duration-200 ${
          hoverCenter && !isDetailOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        } ${
          lightMode
            ? 'bg-[#1642d8] text-white'
            : 'bg-brand-yellow text-black shadow-brand-yellow/30'
        }`}
      >
        <span>SCANNER</span>
        <span className="text-sm leading-none mt-0.5">→</span>
      </div>

      {/* TOP BAR: Back button (in detail view) + Discipline Filters + Theme Switch */}
      <div
        data-no-drag="true"
        className="relative z-[920] max-w-[1400px] w-full mx-auto px-6 pt-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {isDetailOpen ? (
            <button
              onClick={() => setIsDetailOpen(false)}
              className={`group flex items-center gap-3 cursor-pointer focus:outline-none`}
              aria-label="Retour à l'archive"
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-xl ${
                  lightMode
                    ? 'bg-[#181816] text-white'
                    : 'bg-white text-black group-hover:bg-brand-yellow'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </span>
              <span
                className={`text-[11px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded border ${borderClass} ${subtleTextClass}`}
              >
                ARCHIVE // #{activeShoe.serial}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full border ${
                  lightMode
                    ? 'bg-black/5 border-black/15 text-black'
                    : 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow'
                }`}
              >
                <Sparkles className="w-3 h-3" /> SHOE ARCHIVE 3D
              </span>
              <span className={`hidden sm:inline text-xs font-mono ${subtleTextClass}`}>
                {String(activeIndex + 1).padStart(2, '0')} / {filteredItems.length} PAIRES
              </span>
            </div>
          )}
        </div>

        {/* Discipline Filter Pills & Studio Light/Dark Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isDetailOpen && (
            <div
              className={`flex items-center p-1 rounded-full border backdrop-blur-md ${
                lightMode ? 'bg-black/[0.04] border-black/10' : 'bg-white/[0.04] border-white/10'
              }`}
            >
              {(['Toutes', 'Carbone & Élite', 'Daily & Tempo', 'Trail'] as DisciplineFilter[]).map(
                (tab) => {
                  const active = discipline === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setDiscipline(tab)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                        active
                          ? lightMode
                            ? 'bg-[#1642d8] text-white shadow'
                            : 'bg-brand-yellow text-black shadow'
                          : `${subtleTextClass} hover:opacity-100 opacity-75`
                      }`}
                    >
                      {tab}
                    </button>
                  );
                }
              )}
            </div>
          )}

          <button
            onClick={() => setLightMode((v) => !v)}
            title={lightMode ? 'Passer en mode Scanner Dark' : 'Passer en mode Galerie Clair'}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
              lightMode
                ? 'border-black/15 bg-white text-black hover:bg-black/5'
                : 'border-white/15 bg-white/5 text-brand-yellow hover:bg-white/10'
            }`}
          >
            {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CENTER STAGE: Giant Editorial Background Typography + 3D Shelf + Detail Panel */}
      <div className="relative flex-1 flex items-center justify-center w-full">
        {/* GIANT BACKGROUND TYPOGRAPHY (Left & Right, inspired by the Film Archive kanjis) */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center px-4 md:px-12 overflow-hidden transition-all duration-500 ${
            isDetailOpen ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div
            className={`font-black italic uppercase tracking-tighter leading-[0.82] select-none transition-colors duration-300 ${
              lightMode ? 'text-black/[0.08]' : 'text-white/[0.06]'
            }`}
            style={{ fontSize: 'clamp(3.2rem, 10.5vw, 9.5rem)' }}
          >
            <div>{activeShoe.brand.slice(0, 6)}</div>
            <div className="text-[0.55em] tracking-normal not-italic font-mono opacity-70">
              #{activeShoe.serial}
            </div>
          </div>

          <div
            className={`text-right font-black italic uppercase tracking-tighter leading-[0.82] select-none transition-colors duration-300 ${
              lightMode ? 'text-black/[0.08]' : 'text-white/[0.06]'
            }`}
            style={{ fontSize: 'clamp(3.2rem, 10.5vw, 9.5rem)' }}
          >
            <div>{activeShoe.specs.poids !== 'Voir article' ? activeShoe.specs.poids.replace(/\s+/g, '') : 'LAB'}</div>
            <div className="text-[0.45em] tracking-widest">
              {activeShoe.discipline === 'Trail'
                ? 'TRAIL'
                : activeShoe.discipline === 'Carbone & Élite'
                ? 'ELITE'
                : 'TEMPO'}
            </div>
          </div>
        </div>

        {/* GROUND PERSPECTIVE OVAL RING (exact nod to the VHS shelf ground shadow) */}
        <div
          className={`pointer-events-none absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[1160px] h-[96px] rounded-[100%] border transition-opacity duration-500 ${
            isDetailOpen ? 'opacity-0' : 'opacity-100'
          } ${
            lightMode
              ? 'border-black/[0.09] shadow-[0_18px_50px_rgba(0,0,0,0.08)]'
              : 'border-white/[0.08] shadow-[0_20px_60px_rgba(255,182,0,0.05)]'
          }`}
        />

        {/* LEFT DETAIL PANEL (Slides in when Detail View opens, just like 00:00 & 00:14 in the video) */}
        <div
          data-no-drag="true"
          className={`z-[910] w-full max-w-[1260px] mx-auto px-6 pointer-events-none absolute inset-0 flex items-center`}
        >
          <div
            className={`w-full lg:w-[52%] transition-all duration-500 ease-out ${
              isDetailOpen
                ? 'opacity-100 translate-y-0 pointer-events-auto delay-100'
                : 'opacity-0 translate-y-6 pointer-events-none'
            } mt-[230px] lg:mt-0 max-h-[58vh] lg:max-h-none overflow-y-auto hide-scroll pr-1`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-[11px] font-black uppercase tracking-[0.25em] ${subtleTextClass}`}
              >
                {activeShoe.brand} // {activeShoe.discipline}
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  lightMode
                    ? 'bg-[#1642d8]/10 text-[#1642d8]'
                    : 'bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30'
                }`}
              >
                VERDICT {activeShoe.score.toFixed(1)}/10
              </span>
            </div>

            <h1
              className={`font-black italic uppercase tracking-tighter leading-[0.95] mb-4 ${accentTextClass}`}
              style={{ fontSize: 'clamp(2.4rem, 4.8vw, 4.4rem)' }}
            >
              {activeShoe.model}
            </h1>

            {/* Specs technical strip */}
            <div
              className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono uppercase tracking-wider pb-4 mb-5 border-b ${borderClass} ${subtleTextClass}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 opacity-70" />
                <strong className={lightMode ? 'text-black' : 'text-white'}>
                  {activeShoe.specs.poids}
                </strong>
              </span>
              <span>|</span>
              <span className="inline-flex items-center gap-1.5">
                <ArrowDownUp className="w-3.5 h-3.5 opacity-70" />
                DROP{' '}
                <strong className={lightMode ? 'text-black' : 'text-white'}>
                  {activeShoe.specs.drop}
                </strong>
              </span>
              <span>|</span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 opacity-70" />
                STACK{' '}
                <strong className={lightMode ? 'text-black' : 'text-white'}>
                  {activeShoe.specs.stack}
                </strong>
              </span>
              <span>|</span>
              <span className="inline-flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 opacity-70" />
                <strong className={accentTextClass}>{activeShoe.specs.prix}</strong>
              </span>
            </div>

            {/* Description / Usage */}
            <p
              className={`text-sm md:text-base leading-relaxed mb-6 max-w-xl ${
                lightMode ? 'text-[#2d2b28]' : 'text-gray-300'
              }`}
            >
              {activeShoe.specs.usage !== 'Polyvalent'
                ? `${activeShoe.specs.usage} ${activeShoe.excerpt}`
                : activeShoe.excerpt}
            </p>

            {/* 4 Scanner Performance Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-xl">
              {[
                { label: 'Amorti', val: activeShoe.notes.amorti },
                { label: 'Dynamisme', val: activeShoe.notes.dynamisme },
                { label: 'Confort', val: activeShoe.notes.confort },
                { label: 'Stabilité', val: activeShoe.notes.stabilite },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 rounded-xl border ${
                    lightMode
                      ? 'bg-white/70 border-black/10'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${subtleTextClass}`}>
                      {stat.label}
                    </span>
                    <span className="text-xs font-black">{stat.val.toFixed(1)}</span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      lightMode ? 'bg-black/10' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        lightMode ? 'bg-[#1642d8]' : 'bg-brand-yellow'
                      }`}
                      style={{ width: isDetailOpen ? `${stat.val * 10}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Points forts pills */}
            {activeShoe.pForts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7 max-w-xl">
                {activeShoe.pForts.slice(0, 3).map((pt, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${
                      lightMode
                        ? 'bg-emerald-950/5 border-emerald-800/20 text-emerald-900'
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    }`}
                  >
                    <Check className="w-3 h-3" /> {pt}
                  </span>
                ))}
              </div>
            )}

            {/* CTA Buttons: Read Full Test + Top4Running Affiliate CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${activeShoe.slug}`}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-[1.03] shadow-lg ${
                  lightMode
                    ? 'bg-[#141413] text-white hover:bg-[#1642d8]'
                    : 'bg-brand-yellow text-black hover:bg-brand-yellowHover'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Lire le test complet
              </Link>

              <a
                href={activeShoe.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs border transition-all hover:scale-[1.02] ${
                  lightMode
                    ? 'border-black/20 bg-white text-black hover:border-[#1642d8] hover:text-[#1642d8]'
                    : 'border-white/15 bg-white/5 text-white hover:border-brand-yellow hover:text-brand-yellow'
                }`}
              >
                Acheter -5% Top4Running <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleCopyCode}
                className={`inline-flex items-center gap-1.5 px-3.5 py-3.5 rounded-xl font-mono text-[11px] font-bold border transition ${
                  lightMode
                    ? 'border-black/15 bg-black/[0.04] text-black hover:bg-black/10'
                    : 'border-white/10 bg-black/60 text-brand-yellow hover:bg-white/10'
                }`}
                title="Copier le code promo -5% Top4Running"
              >
                {copiedPromo ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> COPIÉ !
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 opacity-70" /> CODE: RUNPASSION
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* THE 3D PERSPECTIVE VIEWPORT */}
        <div
          className="relative w-full h-[420px] flex items-center justify-center pointer-events-none"
          style={{
            perspective: '1650px',
            perspectiveOrigin: '50% 48%',
            transformStyle: 'preserve-3d',
          }}
        >
          {filteredItems.map((shoe, idx) => {
            const isCenter = idx === activeIndex;
            const { theme } = shoe;

            return (
              <div
                key={shoe.id}
                ref={(el) => {
                  if (el) boxRefs.current.set(shoe.id, el);
                  else boxRefs.current.delete(shoe.id);
                }}
                onClick={() => handleBoxClick(idx)}
                onPointerEnter={() => {
                  if (idx === activeIndex) setHoverCenter(true);
                }}
                onPointerLeave={() => {
                  if (idx === activeIndex) setHoverCenter(false);
                }}
                className={`absolute w-[248px] h-[368px] select-none ${
                  isCenter && !isDetailOpen ? 'cursor-none' : 'cursor-pointer'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              >
                {/* FLOOR DROP SHADOW UNDER EACH MONOLITH */}
                <div
                  className="pointer-events-none absolute left-1/2 -bottom-5 w-[220px] h-[28px] rounded-full blur-md"
                  style={{
                    transform: 'translateX(-50%) rotateX(85deg)',
                    background: lightMode
                      ? 'radial-gradient(closest-side, rgba(0,0,0,0.34), rgba(0,0,0,0))'
                      : 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0))',
                  }}
                />

                {/* FRONT COVER FACE (248 x 368, z = +22px) */}
                <div
                  className="absolute inset-0 rounded-[6px] overflow-hidden flex flex-col justify-between p-4"
                  style={{
                    transform: 'translateZ(22px)',
                    backfaceVisibility: 'hidden',
                    backgroundColor: theme.bg,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    boxShadow:
                      'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 28px rgba(0,0,0,0.35)',
                  }}
                >
                  {/* Collector distressed / archival paper edge sheen */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 38%, transparent 70%, rgba(0,0,0,0.5) 100%)',
                    }}
                  />

                  {/* Top Collector Micro-Header */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-[0.22em] opacity-75 mb-1.5">
                      <span>RUNPASSION LAB</span>
                      <span>#{shoe.serial} • {shoe.year}</span>
                    </div>
                    <div
                      className="text-[10px] font-black uppercase tracking-[0.22em] mb-0.5"
                      style={{ color: theme.accent }}
                    >
                      {shoe.brand}
                    </div>
                    <h3 className="font-black italic uppercase tracking-tight leading-[0.95] text-[22px] line-clamp-2">
                      {shoe.model}
                    </h3>
                  </div>

                  {/* Framed Shoe Visual Window */}
                  <div className="relative z-10 my-2.5 flex-1 rounded-[4px] overflow-hidden bg-black/40 border border-white/10">
                    <img
                      src={shoe.image}
                      alt={`${shoe.brand} ${shoe.model}`}
                      loading="lazy"
                      draggable={false}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)',
                      }}
                    />
                    {/* Score stamp inside photo corner */}
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border border-white/15">
                      NOTE {shoe.score.toFixed(1)}/10
                    </div>
                  </div>

                  {/* Bottom VHS-inspired Spec Stamp Footer */}
                  <div className="relative z-10 flex items-center justify-between pt-1">
                    <div className="flex flex-col text-[9px] font-mono uppercase tracking-wider opacity-85">
                      <span>
                        {shoe.specs.poids !== 'Voir article' ? shoe.specs.poids : shoe.discipline}
                        {shoe.specs.drop !== 'Voir article' ? ` • DROP ${shoe.specs.drop}` : ''}
                      </span>
                    </div>
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px] border"
                      style={{
                        borderColor: theme.text,
                        color: theme.text,
                      }}
                    >
                      RP•LAB
                    </span>
                  </div>

                  {/* Dynamic shadow overlay controlled at 60fps */}
                  <div
                    ref={(el) => {
                      if (el) frontShadeRefs.current.set(shoe.id, el);
                      else frontShadeRefs.current.delete(shoe.id);
                    }}
                    className="pointer-events-none absolute inset-0 bg-black"
                    style={{ opacity: 0 }}
                  />
                </div>

                {/* BACK FACE (prevents hollow transparency during sharp angles) */}
                <div
                  className="absolute inset-0 rounded-[6px]"
                  style={{
                    transform: 'rotateY(180deg) translateZ(22px)',
                    backfaceVisibility: 'hidden',
                    backgroundColor: theme.spineBg,
                  }}
                />

                {/* LEFT 3D SPINE (44 x 368, centered at left=102px -> rotateY(-90deg) translateZ(124px)) */}
                <div
                  className="absolute top-0 left-[102px] w-[44px] h-[368px] rounded-[3px] overflow-hidden flex flex-col items-center justify-between py-3.5 px-1"
                  style={{
                    transform: 'rotateY(-90deg) translateZ(124px)',
                    backfaceVisibility: 'hidden',
                    backgroundColor: theme.spineBg,
                    color: theme.text,
                    borderTop: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                    boxShadow:
                      'inset 5px 0 10px rgba(0,0,0,0.45), inset -4px 0 8px rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-full text-center text-[8px] font-mono font-bold pb-2 border-b border-current/15"
                    style={{ color: theme.accent }}
                  >
                    {shoe.serial}
                  </div>

                  <div
                    className="flex-1 flex items-center justify-center py-2 overflow-hidden"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    <span className="font-black italic uppercase tracking-wider text-[12px] whitespace-nowrap">
                      <span className="opacity-65 font-bold not-italic mr-1.5 text-[10px]">
                        {shoe.brand}
                      </span>
                      {shoe.model}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1 pt-2 border-t border-current/15 w-full">
                    <span className="text-[7px] font-mono opacity-75">
                      {shoe.specs.poids !== 'Voir article'
                        ? shoe.specs.poids.replace(/\s+/g, '')
                        : shoe.year}
                    </span>
                    <span className="text-[7px] font-black tracking-widest px-1 border border-current/40 rounded-[2px]">
                      LAB
                    </span>
                  </div>
                </div>

                {/* RIGHT 3D SPINE (44 x 368, centered at left=102px -> rotateY(90deg) translateZ(124px)) */}
                <div
                  className="absolute top-0 left-[102px] w-[44px] h-[368px] rounded-[3px] overflow-hidden flex flex-col items-center justify-between py-3.5 px-1"
                  style={{
                    transform: 'rotateY(90deg) translateZ(124px)',
                    backfaceVisibility: 'hidden',
                    backgroundColor: theme.spineBg,
                    color: theme.text,
                    borderTop: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                    boxShadow:
                      'inset 4px 0 8px rgba(255,255,255,0.08), inset -5px 0 10px rgba(0,0,0,0.45)',
                  }}
                >
                  <div
                    className="w-full text-center text-[8px] font-mono font-bold pb-2 border-b border-current/15"
                    style={{ color: theme.accent }}
                  >
                    {shoe.serial}
                  </div>

                  <div
                    className="flex-1 flex items-center justify-center py-2 overflow-hidden"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    <span className="font-black italic uppercase tracking-wider text-[12px] whitespace-nowrap">
                      <span className="opacity-65 font-bold not-italic mr-1.5 text-[10px]">
                        {shoe.brand}
                      </span>
                      {shoe.model}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1 pt-2 border-t border-current/15 w-full">
                    <span className="text-[7px] font-mono opacity-75">
                      {shoe.specs.poids !== 'Voir article'
                        ? shoe.specs.poids.replace(/\s+/g, '')
                        : shoe.year}
                    </span>
                    <span className="text-[7px] font-black tracking-widest px-1 border border-current/40 rounded-[2px]">
                      LAB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM CAPTION + BRAND SCRUBBER TIMELINE (100% inspired by the video's bottom archive timeline) */}
      <div
        data-no-drag="true"
        className={`relative z-[920] max-w-[1320px] w-full mx-auto px-6 pb-6 transition-all duration-500 ${
          isDetailOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Active Shoe Centered Caption + Prev / Next Arrows */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-6 md:gap-10">
            <button
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex <= 0}
              aria-label="Chaussure précédente"
              className={`p-2 rounded-full transition disabled:opacity-25 hover:scale-110 ${subtleTextClass} hover:${accentTextClass}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsDetailOpen(true)}
              className="group flex flex-col items-center focus:outline-none"
            >
              <h2
                className={`text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none transition-colors ${accentTextClass}`}
              >
                {activeShoe.model}
              </h2>
              <div className={`mt-1.5 text-[11px] font-bold uppercase tracking-[0.22em] ${subtleTextClass}`}>
                {activeShoe.brand} — {activeShoe.discipline}
                {activeShoe.specs.poids !== 'Voir article' ? ` — ${activeShoe.specs.poids}` : ''}
                {activeShoe.specs.prix !== 'Voir article' ? ` — ${activeShoe.specs.prix}` : ''}
              </div>
            </button>

            <button
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex >= filteredItems.length - 1}
              aria-label="Chaussure suivante"
              className={`p-2 rounded-full transition disabled:opacity-25 hover:scale-110 ${subtleTextClass} hover:${accentTextClass}`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Horizontal Brand Scrubber Bar */}
        <div className="w-full pt-2">
          <div
            ref={timelineTrackRef}
            onPointerDown={handleTimelinePointerDown}
            onPointerMove={handleTimelinePointerMove}
            onPointerUp={handleTimelinePointerUp}
            onPointerCancel={handleTimelinePointerUp}
            className="relative h-7 flex items-center cursor-ew-resize group"
          >
            {/* Base hairline */}
            <div
              className={`w-full h-[2px] rounded-full relative ${
                lightMode ? 'bg-black/15' : 'bg-white/15'
              }`}
            >
              {/* Active progress fill */}
              <div
                ref={scrubberFillRef}
                className={`h-full rounded-full ${
                  lightMode ? 'bg-[#1642d8]/50' : 'bg-brand-yellow/50'
                }`}
                style={{ width: '0%' }}
              />
            </div>

            {/* Tick marks for every shoe */}
            <div className="pointer-events-none absolute inset-x-0 flex justify-between items-center">
              {filteredItems.map((s, i) => {
                const isBrandStart = brandMarkers.some((bm) => bm.startIndex === i);
                return (
                  <span
                    key={s.id}
                    className={`block w-px ${
                      isBrandStart
                        ? lightMode
                          ? 'h-3 bg-black/45'
                          : 'h-3 bg-white/50'
                        : lightMode
                        ? 'h-1.5 bg-black/15'
                        : 'h-1.5 bg-white/15'
                    }`}
                  />
                );
              })}
            </div>

            {/* Draggable Scrubber Pill */}
            <div
              ref={scrubberThumbRef}
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125 ${
                lightMode ? 'bg-[#1642d8]' : 'bg-brand-yellow shadow-brand-yellow/40'
              }`}
              style={{ left: '0%' }}
            />
          </div>

          {/* Clickable Brand Labels along the Timeline */}
          <div className="hidden md:flex items-center justify-between gap-2 mt-1 overflow-x-auto hide-scroll">
            {brandMarkers.map((bm) => {
              const isCurrentBrand = activeShoe.brand === bm.brand;
              return (
                <button
                  key={bm.brand}
                  onClick={() => goToIndex(bm.startIndex)}
                  className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded transition whitespace-nowrap ${
                    isCurrentBrand
                      ? `${accentTextClass} font-black`
                      : `${subtleTextClass} opacity-65 hover:opacity-100`
                  }`}
                >
                  {bm.brand}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
