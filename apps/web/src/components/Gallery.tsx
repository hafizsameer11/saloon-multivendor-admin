import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, Images, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn, Img } from './ui';
import { useT } from '@/lib/store';

/** Swipe helper: returns touch handlers that call onPrev / onNext on a horizontal swipe. */
function useSwipe(onPrev: () => void, onNext: () => void) {
  const x0 = useRef<number | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => { x0.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (x0.current === null) return;
      const dx = e.changedTouches[0].clientX - x0.current; x0.current = null;
      if (Math.abs(dx) > 40) (dx > 0 ? onPrev : onNext)();
    },
  };
}

const ArrowBtn = ({ dir, onClick, light, className }: { dir: 'l' | 'r'; onClick: () => void; light?: boolean; className?: string }) => (
  <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }} aria-label={dir === 'l' ? 'Foto precedente' : 'Foto successiva'}
    className={cn('grid h-10 w-10 place-items-center rounded-full backdrop-blur transition hover:scale-105 on-dark', light ? 'bg-white/85 text-ink hover:bg-white' : 'bg-black/55 text-ivory hover:bg-black/75', className)}>
    {dir === 'l' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </button>
);

/** Fullscreen viewer: arrows, keyboard (← → Esc), swipe, thumbnail strip. */
export function Lightbox({ images, index, onClose, title }: { images: string[]; index: number | null; onClose: () => void; title?: string }) {
  const t = useT();
  const [i, setI] = useState(index ?? 0);
  useEffect(() => { if (index !== null) setI(index); }, [index]);
  const open = index !== null;
  const n = images.length;
  const prev = () => setI((v) => (v - 1 + n) % n);
  const next = () => setI((v) => (v + 1) % n);
  const swipe = useSwipe(prev, next);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, n]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex flex-col bg-black/95 on-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={title ?? 'Galleria'}>
          <div className="flex items-center justify-between px-5 py-4 text-ivory">
            <span className="truncate font-serif text-xl">{title}</span>
            <span className="text-[12px] tracking-[.2em] text-gold">{i + 1} / {n}</span>
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label={t('Chiudi', 'Close')}><X size={20} /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 md:px-20" {...swipe} onClick={onClose}>
            <AnimatePresence mode="wait">
              <motion.img key={i} src={images[i]} alt="" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="max-h-[calc(100vh-190px)] max-w-full rounded-xl object-contain" />
            </AnimatePresence>
            {n > 1 && <><ArrowBtn dir="l" onClick={prev} className="absolute left-3 md:left-6" /><ArrowBtn dir="r" onClick={next} className="absolute right-3 md:right-6" /></>}
          </div>
          {n > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
              {images.map((im, k) => (
                <button key={k} onClick={() => setI(k)} className={cn('h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition', k === i ? 'ring-gold' : 'opacity-50 ring-transparent hover:opacity-90')} aria-label={`Foto ${k + 1}`}>
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Main gallery: big image + arrows + counter + dots (mobile) + thumbnails (left on desktop or below).
 * Click/tap opens the fullscreen Lightbox.
 */
export function MediaGallery({ images, title, aspect = 'aspect-[4/5]', light, thumbs = 'left', rounded = 'rounded-[28px]' }: {
  images: string[]; title?: string; aspect?: string; light?: boolean; thumbs?: 'left' | 'bottom'; rounded?: string;
}) {
  const t = useT();
  const list = images.length ? images : [''];
  const [i, setI] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  useEffect(() => { if (i >= list.length) setI(0); }, [list.length]);
  const n = list.length;
  const prev = () => setI((v) => (v - 1 + n) % n);
  const next = () => setI((v) => (v + 1) % n);
  const swipe = useSwipe(prev, next);
  const Thumbs = n > 1 && (
    <div className={cn('flex gap-2.5', thumbs === 'left' ? 'order-2 md:order-1 md:flex-col' : 'order-2', 'max-md:overflow-x-auto max-md:pb-1')}>
      {list.map((im, k) => (
        <button key={k} type="button" onClick={() => setI(k)} aria-label={`Foto ${k + 1}`}
          className={cn('relative shrink-0 overflow-hidden rounded-2xl border-2 transition', k === i ? (light ? 'border-ink' : 'border-gold') : 'border-transparent opacity-60 hover:opacity-100', thumbs === 'left' ? 'h-20 w-20 md:h-24 md:w-full' : 'h-20 w-20')}>
          <Img src={im} className="absolute inset-0" />
        </button>
      ))}
    </div>
  );
  return (
    <div className={cn('grid gap-3', thumbs === 'left' && n > 1 && 'md:grid-cols-[84px_1fr]')}>
      {thumbs === 'left' && Thumbs}
      <div className={cn('group relative order-1 self-start overflow-hidden', aspect, rounded, light ? 'bg-ivory-2' : 'bg-graphite-2', thumbs === 'left' && 'md:order-2')} {...swipe}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Img src={list[i]} alt={title} className="absolute inset-0" />
          </motion.div>
        </AnimatePresence>
        <button type="button" onClick={() => setLb(i)} className="absolute inset-0 z-[1] cursor-zoom-in" aria-label={t('Apri a schermo intero', 'Open full screen')} />
        {n > 1 && (
          <>
            <ArrowBtn dir="l" onClick={prev} light={light} className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 opacity-0 transition group-hover:opacity-100 max-md:hidden" />
            <ArrowBtn dir="r" onClick={next} light={light} className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 opacity-0 transition group-hover:opacity-100 max-md:hidden" />
            <span className={cn('absolute right-3 top-3 z-[2] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur on-dark', light ? 'bg-white/85 text-ink' : 'bg-black/60 text-ivory')}><Images size={12} />{i + 1} / {n}</span>
            <div className="absolute inset-x-0 bottom-3 z-[2] flex justify-center gap-1.5 md:hidden">{list.map((_, k) => <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50')} />)}</div>
          </>
        )}
        <span className={cn('pointer-events-none absolute bottom-3 right-3 z-[2] hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex on-dark', light ? 'bg-white/85 text-ink' : 'bg-black/60 text-ivory')}><Expand size={12} />Zoom</span>
      </div>
      {thumbs === 'bottom' && Thumbs}
      <Lightbox images={list} index={lb} onClose={() => setLb(null)} title={title} />
    </div>
  );
}

/** Thumbnail with a "+N" badge, for list rows (services, products in tables). */
export function ThumbStack({ images, className, onClick }: { images: string[]; className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('relative shrink-0 overflow-hidden', className)} tabIndex={onClick ? 0 : -1} aria-label={`${images.length} foto`}>
      <Img src={images[0]} className="absolute inset-0" />
      {images.length > 1 && <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-ivory backdrop-blur on-dark">+{images.length - 1}</span>}
    </button>
  );
}
