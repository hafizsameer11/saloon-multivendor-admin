import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Star, X, Upload, FileText } from 'lucide-react';
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { useT } from '@/lib/store';

export const cn = clsx;

// ---------------- Button ----------------
type BtnVariant = 'primary' | 'gold' | 'line' | 'ghost' | 'dark' | 'light' | 'danger' | 'inkline';
const btnBase = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[.08em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px whitespace-nowrap';
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-crimson text-snow hover:bg-crimson-dark shadow-[0_14px_30px_rgba(179,32,42,.25)]',
  gold: 'bg-gold text-coal hover:bg-gold-light',
  line: 'border border-gold/45 text-ivory hover:border-gold hover:text-gold',
  ghost: 'text-ivory/80 hover:text-gold',
  dark: 'bg-ink text-ivory hover:bg-black',
  light: 'bg-ivory text-ink hover:bg-white',
  danger: 'border border-crimson/60 text-err hover:bg-crimson/15',
  inkline: 'border border-ink/80 text-ink hover:bg-ink hover:text-ivory',
};
const btnSizes = { sm: 'text-[11px] px-4 py-2', md: 'text-[12px] px-6 py-3', lg: 'text-[13px] px-8 py-4' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: BtnVariant; size?: keyof typeof btnSizes; to?: string; full?: boolean }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'primary', size = 'md', to, full, className, children, ...rest }, ref) => {
  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], full && 'w-full', className);
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return <button ref={ref} className={cls} {...rest}>{children}</button>;
});

export const IconBtn = ({ className, children, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button aria-label={label} title={label} className={cn('grid h-10 w-10 place-items-center rounded-full border border-smoke bg-graphite/70 text-ivory/90 transition hover:border-gold/50 hover:text-gold', className)} {...rest}>{children}</button>
);

// ---------------- Image with graceful fallback ----------------
export function Img({ src, alt = '', className, imgClassName, children }: { src?: string; alt?: string; className?: string; imgClassName?: string; children?: ReactNode }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  return (
    <div className={cn(className?.includes('absolute') ? '' : 'relative', 'overflow-hidden bg-[radial-gradient(120%_90%_at_20%_10%,#3a2a24_0%,#1b1415_55%,#0e0d0f_100%)]', className)}>
      {!failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn('h-full w-full object-cover', imgClassName)} />}
      {failed && <div className="absolute inset-0 grid place-items-center font-serif text-4xl italic text-gold/40">M+</div>}
      {children}
    </div>
  );
}

// ---------------- Badges ----------------
export type Tone = 'gold' | 'ok' | 'red' | 'mute' | 'warn';
const toneCls: Record<Tone, string> = {
  gold: 'border-gold/40 text-gold bg-gold/10',
  ok: 'border-ok/40 text-ok bg-ok/10',
  red: 'border-crimson/50 text-err bg-crimson/10',
  mute: 'border-smoke text-mute bg-white/[.03]',
  warn: 'border-warn/40 text-warn bg-warn/10',
};
export const Badge = ({ tone = 'gold', children, className }: { tone?: Tone; children: ReactNode; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[.14em]', toneCls[tone], className)}>{children}</span>
);

export const Stars = ({ value, size = 13, className }: { value: number; size?: number; className?: string }) => (
  <span className={cn('inline-flex items-center gap-0.5 text-gold', className)} aria-label={`${value} su 5`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} strokeWidth={1.5} fill={i <= Math.round(value) ? 'currentColor' : 'none'} />)}
  </span>
);

export const StarInput = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button key={i} type="button" onClick={() => onChange(i)} className="text-gold transition hover:scale-110" aria-label={`${i} stelle`}>
        <Star size={28} strokeWidth={1.3} fill={i <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

// ---------------- Section heading ----------------
export const SectionTitle = ({ num, title, sub, action, light }: { num?: string; title: ReactNode; sub?: ReactNode; action?: ReactNode; light?: boolean }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="flex items-baseline gap-4">
      {num && <span className={cn('font-serif text-xl italic', light ? 'text-crimson' : 'text-gold')}>{num}</span>}
      <div>
        <h2 className={cn('text-4xl leading-none md:text-5xl', light && 'text-ink')}>{title}</h2>
        {sub && <p className={cn('mt-3 max-w-xl text-sm', light ? 'text-mute-2' : 'text-mute')}>{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ---------------- Form fields ----------------
export const Field = ({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string }) => (
  <label className={cn('block', className)}>
    {label && <span className="label">{label}</span>}
    {children}
    {hint && !error && <span className="mt-1 block text-[11.5px] text-mute">{hint}</span>}
    {error && <span className="mt-1 block text-[11.5px] text-err">{error}</span>}
  </label>
);
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => <input ref={ref} className={cn('field', className)} {...p} />);
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn('field min-h-[110px] resize-y', className)} {...p} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select className={cn('field appearance-none pr-10 [&>option]:text-ink', className)} {...p}>{children}</select>
    <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute" />
  </div>
);
export const Checkbox = ({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left text-sm">
    <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition', checked ? 'border-gold bg-gold text-coal' : 'border-smoke')}>{checked && <Check size={13} strokeWidth={3} />}</span>
    <span className="text-ivory/85">{children}</span>
  </button>
);
export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-sm" aria-pressed={checked}>
    <span className={cn('relative h-6 w-11 rounded-full border transition', checked ? 'border-gold bg-gold/25' : 'border-smoke bg-graphite-2')}>
      <span className={cn('absolute top-0.5 h-[18px] w-[18px] rounded-full transition', checked ? 'left-[22px] bg-gold' : 'left-0.5 bg-mute')} />
    </span>
    {label && <span className="text-ivory/85">{label}</span>}
  </button>
);
export const Chip = ({ active, onClick, children, light }: { active?: boolean; onClick?: () => void; children: ReactNode; light?: boolean }) => (
  <button type="button" onClick={onClick} className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] transition',
    light ? (active ? 'border-ink bg-ink text-ivory' : 'border-ivory-3 text-ink hover:border-ink/50') : (active ? 'border-ivory bg-ivory text-ink' : 'border-smoke text-ivory/85 hover:border-gold/50'))}>{children}</button>
);

export function FileDrop({ files, onAdd, onRemove, accept = '.pdf,.jpg,.png', label }: { files: { id: string; name: string }[]; onAdd: (names: string[], raw: File[]) => void; onRemove: (id: string) => void; accept?: string; label: string }) {
  const t = useT();
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/35 bg-graphite-2 px-6 py-8 text-center transition hover:border-gold">
        <Upload className="text-gold" size={22} strokeWidth={1.5} />
        <span className="text-sm">{label}</span>
        <span className="text-[11.5px] text-mute">{t('PDF, JPG o PNG · max 10 MB', 'PDF, JPG or PNG · max 10 MB')}</span>
        <input type="file" multiple accept={accept} className="hidden" onChange={(e) => { const raw = Array.from(e.target.files ?? []); const n = raw.map((f) => f.name); if (n.length) onAdd(n, raw); e.target.value = ''; }} />
      </label>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-xl border border-smoke px-3 py-2 text-sm">
              <FileText size={16} className="text-gold" /> <span className="flex-1 truncate">{f.name}</span>
              <button type="button" onClick={() => onRemove(f.id)} className="text-mute hover:text-crimson" aria-label={t('Rimuovi', 'Remove')}><X size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------- Modal & Drawer ----------------
export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div onMouseDown={(e) => e.stopPropagation()} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-smoke bg-graphite text-ivory shadow-deep sm:rounded-[28px]', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} role="dialog" aria-modal="true">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-smoke bg-graphite/95 px-6 py-4 backdrop-blur">
              <div className="font-serif text-2xl">{title}</div>
              <IconBtn label={t('Chiudi', 'Close')} onClick={onClose} className="h-9 w-9"><X size={16} /></IconBtn>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="sticky bottom-0 flex justify-end gap-3 border-t border-smoke bg-graphite/95 px-6 py-4 backdrop-blur">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children, footer, side = 'right' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; side?: 'right' | 'left' }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm on-dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.aside onMouseDown={(e) => e.stopPropagation()} initial={{ x: side === 'right' ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: side === 'right' ? '100%' : '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className={cn('absolute top-0 flex h-full w-full max-w-md flex-col border-smoke bg-graphite text-ivory', side === 'right' ? 'right-0 border-l' : 'left-0 border-r')}>
            <div className="flex items-center justify-between border-b border-smoke px-6 py-4"><div className="font-serif text-2xl">{title}</div><IconBtn label={t('Chiudi', 'Close')} onClick={onClose} className="h-9 w-9"><X size={16} /></IconBtn></div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-smoke px-6 py-4">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------- Tabs ----------------
export function Tabs<T extends string>({ tabs, value, onChange, light }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; light?: boolean }) {
  return (
    <div className={cn('scroll-x gap-1 border-b', light ? 'border-ivory-3' : 'border-smoke')} role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn('relative whitespace-nowrap px-4 pb-3 pt-1 text-[13px] font-semibold tracking-wide transition', value === t.id ? (light ? 'text-ink' : 'text-ivory') : (light ? 'text-mute-2 hover:text-ink' : 'text-mute hover:text-ivory'))}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-[11px] text-gold">{t.count}</span>}
          {value === t.id && <motion.span layoutId={`tab-ul-${tabs.map((x) => x.id).join('')}`} className="absolute inset-x-3 -bottom-px h-[2px] rounded bg-crimson" />}
        </button>
      ))}
    </div>
  );
}

// ---------------- Empty state ----------------
export const Empty = ({ title, text, action, img }: { title: string; text?: string; action?: ReactNode; img?: string }) => (
  <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
    {img ? <Img src={img} className="mb-2 h-28 w-28 rounded-full" /> : <div className="mb-1 font-serif text-5xl italic text-gold/50">∅</div>}
    <h3 className="text-3xl">{title}</h3>
    {text && <p className="max-w-sm text-sm text-mute">{text}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// ---------------- Stat card ----------------
export const Stat = ({ label, value, delta, tone = 'ok', icon }: { label: string; value: ReactNode; delta?: string; tone?: Tone; icon?: ReactNode }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-[.18em] text-mute">{label}</span>{icon && <span className="text-gold/80">{icon}</span>}</div>
    <div className="mt-2 font-serif text-[34px] leading-none">{value}</div>
    {delta && <div className={cn('mt-2 text-[11.5px]', tone === 'ok' ? 'text-ok' : tone === 'red' ? 'text-err' : 'text-gold')}>{delta}</div>}
  </div>
);

// ---------------- Stepper ----------------
export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => {
  const t = useT();
  return (
  <div>
    <div className="flex gap-1.5">{steps.map((_, i) => <span key={i} className={cn('h-[3px] flex-1 rounded-full transition', i <= current ? 'bg-gold' : 'bg-smoke')} />)}</div>
    <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[.18em]"><span className="text-gold">{t('Passo', 'Step')} {current + 1} / {steps.length}</span><span className="text-mute">{steps[current]}</span></div>
  </div>
);
};

export function Avatar({ src, name, size = 40, className }: { src?: string; name: string; size?: number; className?: string }) {
  const [bad, setBad] = useState(false);
  if (src && !bad) return <img src={src} alt={name} onError={() => setBad(true)} style={{ width: size, height: size }} className={cn('shrink-0 rounded-full object-cover', className)} />;
  return <span style={{ width: size, height: size, fontSize: size * 0.38 }} className={cn('grid shrink-0 place-items-center rounded-full bg-crimson/20 font-serif text-gold', className)}>{name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>;
}

// ---------------- Toasts ----------------
interface ToastS { items: { id: number; msg: string; tone: Tone }[]; push: (msg: string, tone?: Tone) => void; drop: (id: number) => void }
export const useToasts = create<ToastS>((set) => ({
  items: [],
  push: (msg, tone = 'gold') => { const id = Date.now() + Math.random(); set((s) => ({ items: [...s.items, { id, msg, tone }] })); setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 2800); },
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));
export const toast = (msg: string, tone: Tone = 'gold') => useToasts.getState().push(msg, tone);
export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-8">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-smoke bg-graphite/95 px-5 py-3.5 text-sm font-semibold shadow-deep backdrop-blur">
            <span className={cn('h-2 w-2 rounded-full', t.tone === 'ok' ? 'bg-ok' : t.tone === 'red' ? 'bg-crimson' : 'bg-gold')} />{t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Table ----------------
export interface Col<T> { key: string; head: ReactNode; cell: (row: T) => ReactNode; className?: string }
export function Table<T>({ cols, rows, onRow, empty }: { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; empty?: string }) {
  const t = useT();
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13.5px]">
          <thead><tr className="border-b border-smoke text-[10.5px] uppercase tracking-[.16em] text-mute">{cols.map((c) => <th key={c.key} className={cn('px-5 py-3.5 font-semibold', c.className)}>{c.head}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={cols.length} className="px-5 py-12 text-center text-mute">{empty ?? t('Nessun risultato', 'No results')}</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} onClick={() => onRow?.(r)} className={cn('border-b border-smoke/60 last:border-0', onRow && 'cursor-pointer transition hover:bg-white/[.025]')}>
                {cols.map((c) => <td key={c.key} className={cn('px-5 py-3.5 align-middle', c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] }}>{children}</motion.div>
);
