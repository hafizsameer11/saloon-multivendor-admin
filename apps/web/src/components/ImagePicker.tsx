import { ChevronLeft, ChevronRight, ImagePlus, Star, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { PHOTOS, u, type PhotoGroup } from '@shared/index';
import { apiMode, useStore, useT } from '@/lib/store';
import { Button, Chip, cn, Img, Modal, toast } from './ui';

/** Resize an uploaded image client-side and return a data URL (prototype only — Phase 6 uploads to S3/R2 via the API). */
export function fileToDataUrl(file: File, max = 1000): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = img.width * scale; c.height = img.height * scale;
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = rej; img.src = r.result as string;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/** Resize to max 1600px JPEG (smaller uploads, EXIF orientation applied by the browser). */
function fileToBlob(file: File, max = 1600): Promise<Blob> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
    img.src = url;
  });
}

/** API mode → uploads to the server (S3/R2 or disk) and returns public URLs; demo mode → data URLs in the browser. */
export async function filesToUrls(files: File[]): Promise<string[]> {
  if (!apiMode) return Promise.all(files.map((f) => fileToDataUrl(f)));
  const blobs = await Promise.all(files.map((f) => fileToBlob(f)));
  return useStore.getState().uploadImages!(blobs, files.map((f) => f.name.replace(/\.[^.]+$/, '') + '.jpg'));
}

export function ImagePicker({ open, onClose, onPick, multiple }: { open: boolean; onClose: () => void; onPick: (urls: string[]) => void; multiple?: boolean }) {
  const t = useT();
  const groups = Object.keys(PHOTOS).filter((g) => !g.startsWith('portraits')) as PhotoGroup[];
  const [g, setG] = useState<PhotoGroup>('salonInterior');
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (url: string) => setSel(multiple ? (sel.includes(url) ? sel.filter((x) => x !== url) : [...sel, url]) : [url]);
  const done = (urls: string[]) => { onPick(urls); setSel([]); onClose(); };
  return (
    <Modal open={open} onClose={onClose} title={t('Scegli foto', 'Choose photos')} wide footer={<><span className="mr-auto self-center text-[12px] text-mute">{sel.length} {t('selezionate', 'selected')}</span><Button disabled={!sel.length} onClick={() => done(sel)}>{t('Usa', 'Use')}</Button></>}>
      <label className="mb-5 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gold/40 p-5 text-sm hover:border-gold">
        <Upload size={18} className="text-gold" />{t('Carica dal tuo dispositivo', 'Upload from your device')}
        <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={async (e) => {
          const files = Array.from(e.target.files ?? []); if (!files.length) return;
          try { const urls = await filesToUrls(files); done(urls); toast(t('Foto caricate', 'Photos uploaded'), 'ok'); } catch (err) { toast(apiMode ? String((err as Error).message) : t('Formato non supportato', 'Unsupported format'), 'red'); }
        }} />
      </label>
      <div className="eyebrow mb-3 text-[10px]">{t('Oppure dalla libreria demo', 'Or from the demo library')}</div>
      <div className="scroll-x mb-4">{groups.map((x) => <Chip key={x} active={g === x} onClick={() => setG(x)}>{x}</Chip>)}</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {PHOTOS[g].map((id) => { const url = u(id, 1200); const on = sel.includes(url); return (
          <button key={id} type="button" onClick={() => toggle(url)} className={cn('relative overflow-hidden rounded-xl ring-2 transition', on ? 'ring-gold' : 'ring-transparent hover:ring-smoke')}><Img src={u(id, 300)} className="aspect-square" />{on && <span className="absolute right-2 top-2 h-5 w-5 rounded-full bg-gold" />}</button>
        ); })}
      </div>
    </Modal>
  );
}

export function GalleryEditor({ images, onChange, max = 8, label, min = 1 }: { images: string[]; onChange: (x: string[]) => void; max?: number; label?: string; min?: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const left = max - images.length;
  const addFiles = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (imgs.length < files.length) toast(t('Alcuni file non sono immagini e sono stati ignorati', 'Some files were not images and were skipped'), 'red');
    const tooBig = imgs.filter((f) => f.size > 10 * 1024 * 1024);
    if (tooBig.length) toast(t('Max 10 MB per foto', 'Max 10 MB per photo'), 'red');
    const ok = imgs.filter((f) => f.size <= 10 * 1024 * 1024).slice(0, left);
    if (imgs.length > left) toast(t(`Puoi aggiungere ancora ${left} foto`, `You can add ${left} more photos`), 'red');
    if (!ok.length) return;
    setBusy(true);
    try { const urls = await filesToUrls(ok); onChange([...images, ...urls]); toast(t(`${urls.length} foto caricate`, `${urls.length} photos uploaded`), 'ok'); }
    catch (err) { toast(apiMode ? String((err as Error).message) : t('Formato non supportato', 'Unsupported format'), 'red'); }
    finally { setBusy(false); }
  };
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= images.length) return; const x = [...images]; [x[i], x[j]] = [x[j], x[i]]; onChange(x); };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (left > 0) setDrag(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDrag(false); }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(Array.from(e.dataTransfer.files)); }}
      className={cn('rounded-2xl transition', drag && 'outline-dashed outline-2 outline-offset-4 outline-gold')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-mute">
        <span>{images.length} / {max} {t('foto', 'photos')} · {t('la prima è la copertina', 'first one is the cover')}{images.length < min && <b className="ml-1 text-err">· min {min}</b>}</span>
        <span className="hidden md:inline">{t('Trascina qui le foto oppure', 'Drag photos here or')} <button type="button" className="text-gold underline" onClick={() => setOpen(true)}>{t('sfoglia', 'browse')}</button></span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((im, i) => (
          <div key={i + im.slice(-24)} className="group relative">
            <Img src={im} className={cn('aspect-square rounded-xl', i === 0 && 'ring-2 ring-gold')} />
            <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black/70 px-1.5 text-[10.5px] font-semibold on-dark">{i + 1}</span>
            {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-gold px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-coal">{label ?? t('Copertina', 'Cover')}</span>}
            <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/75 transition hover:bg-crimson md:opacity-0 md:group-hover:opacity-100 on-dark" aria-label={t('Rimuovi foto', 'Remove photo')}><X size={14} /></button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 transition md:opacity-0 md:group-hover:opacity-100">
              {i > 0 && <button type="button" onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-black/75 hover:bg-black" aria-label={t('Sposta a sinistra', 'Move left')}><ChevronLeft size={14} /></button>}
              {i < images.length - 1 && <button type="button" onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-black/75 hover:bg-black" aria-label={t('Sposta a destra', 'Move right')}><ChevronRight size={14} /></button>}
              {i > 0 && <button type="button" onClick={() => onChange([im, ...images.filter((_, k) => k !== i)])} className="grid h-7 w-7 place-items-center rounded-full bg-black/75 text-gold hover:bg-black" aria-label={t('Imposta come copertina', 'Set as cover')} title={t('Imposta come copertina', 'Set as cover')}><Star size={13} /></button>}
            </div>
          </div>
        ))}
        {left > 0 && (
          <label className={cn('flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-center text-gold transition', drag ? 'border-gold bg-gold/10' : 'border-gold/40 hover:border-gold')}>
            {busy ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" /> : <ImagePlus size={22} strokeWidth={1.4} />}
            <span className="px-2 text-[11px] leading-tight">{busy ? t('Caricamento…', 'Uploading…') : t('Aggiungi foto', 'Add photos')}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[12px] text-mute underline decoration-gold/40 underline-offset-4 hover:text-gold">{t('…oppure scegli dalla libreria demo', '…or choose from the demo library')}</button>
      <ImagePicker open={open} onClose={() => setOpen(false)} multiple onPick={(u2) => onChange([...images, ...u2].slice(0, max))} />
    </div>
  );
}
