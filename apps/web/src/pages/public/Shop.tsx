import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PHOTOS, PRODUCT_CATEGORY_LABELS, u, type ProductCategory } from '@shared/index';
import { publicProducts, publicSalons, useStore, useT } from '@/lib/store';
import { Button, Checkbox, Chip, cn, Drawer, Img, Toggle } from '@/components/ui';
import { ProductCard } from '@/components/cards';

export default function Shop() {
  const t = useT();
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const cat = (params.get('cat') ?? '') as ProductCategory | '';
  const [sort, setSort] = useState(params.get('sort') ?? 'popular');
  const [brands, setBrands] = useState<string[]>([]);
  const [salonIds, setSalonIds] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(120);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [open, setOpen] = useState(false);
  const all = useMemo(() => publicProducts(s), [s.products, s.salons]);
  const allBrands = Array.from(new Set(all.map((p) => p.brand))).sort();
  const sellers = publicSalons(s).filter((x) => all.some((p) => p.salonId === x.id));
  const list = useMemo(() => {
    const l = all.filter((p) => (!cat || p.category === cat) && (!brands.length || brands.includes(p.brand)) && (!salonIds.length || salonIds.includes(p.salonId)) && p.price <= maxPrice && (!inStock || p.stock > 0) && (!onSale || !!p.compareAtPrice));
    return [...l].sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'new' ? b.createdAt.localeCompare(a.createdAt) : sort === 'rating' ? b.rating - a.rating : b.sold - a.sold);
  }, [all, cat, brands, salonIds, maxPrice, inStock, onSale, sort]);
  const tog = (arr: string[], v: string, set: (x: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const setCat = (c: string) => { const p = new URLSearchParams(params); c ? p.set('cat', c) : p.delete('cat'); setParams(p, { replace: true }); };

  const Filters = (
    <div className="space-y-8 text-ink">
      <div><div className="mb-3 text-[11px] uppercase tracking-[.18em] text-mute-2">{t('Prezzo massimo', 'Max price')}: <b className="text-ink">€{maxPrice}</b></div><input type="range" min={10} max={120} step={5} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-[#B3202A]" /></div>
      <div><div className="mb-3 text-[11px] uppercase tracking-[.18em] text-mute-2">Brand</div><div className="space-y-2.5 [&_span]:!text-ink">{allBrands.map((b) => <Checkbox key={b} checked={brands.includes(b)} onChange={() => tog(brands, b, setBrands)}>{b}</Checkbox>)}</div></div>
      <div><div className="mb-3 text-[11px] uppercase tracking-[.18em] text-mute-2">{t('Venduto da', 'Sold by')}</div><div className="space-y-2.5 [&_span]:!text-ink">{sellers.map((x) => <Checkbox key={x.id} checked={salonIds.includes(x.id)} onChange={() => tog(salonIds, x.id, setSalonIds)}>{x.name}</Checkbox>)}</div></div>
      <div className="space-y-3 [&_span]:!text-ink"><Toggle checked={inStock} onChange={setInStock} label={t('Solo disponibili', 'In stock only')} /><Toggle checked={onSale} onChange={setOnSale} label={t('In promozione', 'On sale')} /></div>
    </div>
  );

  return (
    <div className="day min-h-screen pb-24">
      <section className="wrap grid items-end gap-8 pb-12 pt-14 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="text-[11px] uppercase tracking-eyebrow text-crimson">{t('Lo Shop', 'The Shop')} · {all.length} {t('prodotti', 'products')}</div>
          <h1 className="mt-4 text-[60px] leading-[.9] md:text-[96px]">{t('Beauty', 'Salon-grade')} <em className="text-crimson">{t('da salone.', 'beauty.')}</em></h1>
          <p className="mt-5 max-w-md text-mute-2">{t('Selezionato dai professionisti, venduto direttamente dai saloni. Spedizione o ritiro gratuito in salone.', 'Picked by professionals, sold directly by salons. Shipping or free in-salon pickup.')}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[PHOTOS.skincare[9], PHOTOS.nails[1], PHOTOS.makeup[3]].map((p, i) => <Img key={p} src={u(p, 600)} className={cn('h-48 rounded-[20px] md:h-56', i === 1 && 'mt-10 rounded-t-full')} />)}
        </div>
      </section>
      <div className="sticky top-[72px] z-20 border-y border-ivory-3 bg-ivory/90 backdrop-blur">
        <div className="wrap flex items-center gap-3 py-3">
          <div className="scroll-x flex-1 pb-0">
            <Chip light active={!cat} onClick={() => setCat('')}>{t('Tutto', 'All')}</Chip>
            {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((c) => <Chip light key={c} active={cat === c} onClick={() => setCat(c)}>{s.lang === 'it' ? PRODUCT_CATEGORY_LABELS[c].it : PRODUCT_CATEGORY_LABELS[c].en}</Chip>)}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="hidden rounded-full border border-ivory-3 bg-white px-4 py-2 text-[13px] outline-none md:block">
            <option value="popular">{t('Più venduti', 'Best sellers')}</option><option value="new">{t('Novità', 'Newest')}</option><option value="rating">{t('Più votati', 'Top rated')}</option><option value="price-asc">{t('Prezzo crescente', 'Price low–high')}</option><option value="price-desc">{t('Prezzo decrescente', 'Price high–low')}</option>
          </select>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-ink/70 px-4 py-2 text-[12px] font-semibold uppercase tracking-[.1em] lg:hidden"><SlidersHorizontal size={14} />{t('Filtri', 'Filters')}</button>
        </div>
      </div>
      <div className="wrap mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-40">{Filters}</div></aside>
        <div>
          <div className="mb-6 text-sm text-mute-2">{list.length} {t('prodotti', 'products')}</div>
          {list.length === 0 ? <div className="rounded-3xl border border-ivory-3 bg-white p-14 text-center"><h3 className="text-4xl">{t('Nessun prodotto', 'No products')}</h3><p className="mt-2 text-mute-2">{t('Prova ad allargare i filtri.', 'Try widening your filters.')}</p></div>
            : <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} title={t('Filtri', 'Filters')} footer={<Button full onClick={() => setOpen(false)}>{t('Mostra', 'Show')} {list.length}</Button>}><div className="day -mx-6 -my-5 min-h-full px-6 py-5">{Filters}</div></Drawer>
    </div>
  );
}
