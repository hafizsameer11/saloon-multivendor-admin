import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORY_LABELS, CITIES, type SalonCategory } from '@shared/index';
import { publicSalons, useStore, useT } from '@/lib/store';
import { Button, Chip, cn, Drawer, Empty, Select, Toggle } from '@/components/ui';
import { CalabriaMap, SalonCard } from '@/components/cards';

export default function Explore({ fixedCat }: { fixedCat?: SalonCategory }) {
  const t = useT();
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const cat = (fixedCat ?? params.get('cat') ?? '') as SalonCategory | '';
  const [sort, setSort] = useState<'rating' | 'price' | 'reviews'>('rating');
  const [minRating, setMinRating] = useState(0);
  const [level, setLevel] = useState<number>(0);
  const [openSunday, setOpenSunday] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  const results = useMemo(() => {
    const ql = q.toLowerCase().trim();
    let list = publicSalons(s).filter((x) =>
      (!cat || x.category === cat) && (!city || x.city === city) && x.rating >= minRating && (!level || x.priceLevel === level) && (!openSunday || !!x.hours[6].open) &&
      (!ql || x.name.toLowerCase().includes(ql) || x.city.toLowerCase().includes(ql) || s.services.some((sv) => sv.salonId === x.id && sv.name.toLowerCase().includes(ql))));
    const minPrice = (id: string) => Math.min(...s.services.filter((sv) => sv.salonId === id).map((sv) => sv.price));
    list = [...list].sort((a, b) => (sort === 'rating' ? b.rating - a.rating : sort === 'reviews' ? b.reviewCount - a.reviewCount : minPrice(a.id) - minPrice(b.id)));
    return list;
  }, [s.salons, s.services, q, city, cat, minRating, level, openSunday, sort]);

  const FilterBody = (
    <div className="space-y-7">
      <div><div className="label">{t('Città', 'City')}</div><Select value={city} onChange={(e) => set('city', e.target.value)}><option value="">{t('Tutta la Calabria', 'All Calabria')}</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
      <div><div className="label">{t('Valutazione minima', 'Minimum rating')}</div><div className="flex flex-wrap gap-2">{[0, 4.5, 4.7, 4.9].map((r) => <Chip key={r} active={minRating === r} onClick={() => setMinRating(r)}>{r ? `${r}+ ★` : t('Tutte', 'Any')}</Chip>)}</div></div>
      <div><div className="label">{t('Fascia di prezzo', 'Price range')}</div><div className="flex gap-2">{[0, 1, 2, 3].map((l) => <Chip key={l} active={level === l} onClick={() => setLevel(l)}>{l ? '€'.repeat(l) : t('Tutte', 'Any')}</Chip>)}</div></div>
      <Toggle checked={openSunday} onChange={setOpenSunday} label={t('Aperto la domenica', 'Open on Sunday')} />
    </div>
  );

  return (
    <div className="wrap pb-10 pt-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">{t('Esplora', 'Explore')}</div>
          <h1 className="mt-3 text-5xl leading-none md:text-[64px]">
            {cat ? (s.lang === 'it' ? CATEGORY_LABELS[cat].it : CATEGORY_LABELS[cat].en) : t('Tutti i saloni', 'All salons')}{city && <em className="text-gold"> · {city}</em>}
          </h1>
          <p className="mt-3 text-sm text-mute">{results.length} {t('risultati', 'results')}{q && <> {t('per', 'for')} “<span className="text-ivory">{q}</span>” <button className="ml-1 text-gold" onClick={() => set('q', '')}><X size={13} className="inline" /></button></>}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="!py-2.5 text-[13px]">
            <option value="rating">{t('Migliori valutazioni', 'Top rated')}</option><option value="reviews">{t('Più recensiti', 'Most reviewed')}</option><option value="price">{t('Prezzo più basso', 'Lowest price')}</option>
          </Select>
          <Button variant="line" size="sm" className="!py-3" onClick={() => setFilters(true)}><SlidersHorizontal size={14} />{t('Filtri', 'Filters')}</Button>
          <div className="flex rounded-full border border-smoke p-1 lg:hidden">
            <button onClick={() => setView('list')} className={cn('rounded-full p-2', view === 'list' && 'bg-ivory text-ink')} aria-label={t('Lista', 'List')}><List size={15} /></button>
            <button onClick={() => setView('map')} className={cn('rounded-full p-2', view === 'map' && 'bg-ivory text-ink')} aria-label={t('Mappa', 'Map')}><MapIcon size={15} /></button>
          </div>
        </div>
      </div>
      {!fixedCat && (
        <div className="scroll-x mt-8">
          <Chip active={!cat} onClick={() => set('cat', '')}>{t('Tutti', 'All')}</Chip>
          {(Object.keys(CATEGORY_LABELS) as SalonCategory[]).map((c) => <Chip key={c} active={cat === c} onClick={() => set('cat', c)}>{s.lang === 'it' ? CATEGORY_LABELS[c].it : CATEGORY_LABELS[c].en}</Chip>)}
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className={cn(view === 'map' && 'hidden lg:block')}>
          {results.length === 0 ? (
            <Empty title={t('Nessun salone trovato', 'No salons found')} text={t('Prova a cambiare città o a rimuovere qualche filtro.', 'Try another city or remove some filters.')} action={<Button variant="line" onClick={() => { setParams({}); setMinRating(0); setLevel(0); setOpenSunday(false); }}>{t('Azzera filtri', 'Reset filters')}</Button>} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2" onMouseLeave={() => setActive(null)}>
              {results.map((x) => <div key={x.id} onMouseEnter={() => setActive(x.id)}><SalonCard salon={x} /></div>)}
            </div>
          )}
        </div>
        <div className={cn('lg:block', view === 'list' && 'hidden')}>
          <div className="sticky top-24 h-[70vh] overflow-hidden rounded-[28px] border border-smoke lg:h-[calc(100vh-130px)]">
            <CalabriaMap salons={results} active={active} onPick={setActive} />
            {active && (() => { const x = results.find((r) => r.id === active); return x && (
              <a href={`#/salone/${x.slug}`} className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-smoke bg-graphite/95 p-3 backdrop-blur">
                <img src={x.cover} alt="" className="h-14 w-14 rounded-xl object-cover" /><div className="flex-1"><div className="font-serif text-xl">{x.name}</div><div className="text-[12px] text-mute">{x.city} · ★ {x.rating}</div></div><span className="text-[11px] uppercase tracking-widest text-gold">{t('Apri', 'Open')} →</span>
              </a>); })()}
          </div>
        </div>
      </div>
      <Drawer open={filters} onClose={() => setFilters(false)} title={t('Filtri', 'Filters')} footer={<Button full onClick={() => setFilters(false)}>{t('Mostra', 'Show')} {results.length} {t('risultati', 'results')}</Button>}>{FilterBody}</Drawer>
    </div>
  );
}
