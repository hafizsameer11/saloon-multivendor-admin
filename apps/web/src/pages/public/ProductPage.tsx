import { Minus, Plus, ShieldCheck, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eur, fmtDateShort, PRODUCT_CATEGORY_LABELS } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Button, cn, Img, Stars, Tabs, toast } from '@/components/ui';
import { ProductCard } from '@/components/cards';
import { NotFound } from './StaticPages';
import { MediaGallery } from '@/components/Gallery';

export default function ProductPage() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const p = s.products.find((x) => x.id === id);
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'desc' | 'use' | 'inci' | 'reviews'>('desc');
  if (!p) return <NotFound />;
  const salon = s.salons.find((x) => x.id === p.salonId)!;
  const isOwnerOrAdmin = s.userId === salon.ownerId || s.userId === 'u-admin';
  if ((p.status !== 'published' || salon.status !== 'approved') && !isOwnerOrAdmin) return <NotFound />;
  const v = p.variants.find((x) => x.id === (variant ?? p.variants[0]?.id));
  const price = p.price + (v?.priceDelta ?? 0);
  const stock = v ? v.stock : p.stock;
  const reviews = s.reviews.filter((r) => r.productId === p.id && !r.hidden);
  const related = s.products.filter((x) => x.id !== p.id && x.status === 'published' && (x.category === p.category || x.salonId === p.salonId)).slice(0, 4);
  const add = (go?: boolean) => { s.addToCart(p.id, qty, v?.id); toast(t('Aggiunto al carrello', 'Added to cart'), 'ok'); if (go) nav('/carrello'); };

  return (
    <div className="day pb-24">
      {p.status !== 'published' && <div className="bg-gold py-2 text-center text-[12px] font-semibold">{t('Anteprima: prodotto non ancora pubblicato', 'Preview: product not published yet')}</div>}
      <div className="wrap pt-8 text-[12px] text-mute-2"><Link to="/shop" className="hover:text-ink">Shop</Link> / <Link to={`/shop?cat=${p.category}`} className="hover:text-ink">{s.lang === 'it' ? PRODUCT_CATEGORY_LABELS[p.category].it : PRODUCT_CATEGORY_LABELS[p.category].en}</Link> / <span className="text-ink">{p.name}</span></div>
      <section className="wrap mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <MediaGallery images={p.images} title={p.name} light />
        <div className="lg:pt-6">
          <div className="text-[11px] uppercase tracking-[.22em] text-mute-2">{p.brand}</div>
          <h1 className="mt-2 text-5xl leading-[.95] md:text-[64px]">{p.name}</h1>
          <p className="mt-3 font-serif text-2xl italic text-mute-2">{p.short}</p>
          <div className="mt-4 flex items-center gap-3 text-sm"><Stars value={p.rating} className="!text-crimson" /><span className="text-mute-2">{p.rating.toFixed(1)} · {p.reviewCount} {t('recensioni', 'reviews')}</span></div>
          <div className="mt-6 flex items-baseline gap-3"><span className="font-serif text-5xl">{eur(price)}</span>{p.compareAtPrice && <s className="text-lg text-mute-2">{eur(p.compareAtPrice + (v?.priceDelta ?? 0))}</s>}<span className="text-[12px] text-mute-2">{t('IVA inclusa', 'VAT incl.')}</span></div>
          {p.variants.length > 0 && (
            <div className="mt-7"><div className="mb-2 text-[11px] uppercase tracking-[.18em] text-mute-2">{t('Formato / colore', 'Size / shade')}</div>
              <div className="flex flex-wrap gap-2">{p.variants.map((x) => <button key={x.id} onClick={() => setVariant(x.id)} className={cn('rounded-full border px-5 py-2.5 text-sm transition', (v?.id === x.id) ? 'border-ink bg-ink text-ivory' : 'border-ivory-3 bg-white hover:border-ink/50')}>{x.label}{x.priceDelta ? ` (+${eur(x.priceDelta)})` : ''}</button>)}</div></div>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-ivory-3 bg-white">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-12 place-items-center" aria-label="-"><Minus size={15} /></button><span className="w-8 text-center font-semibold">{qty}</span><button onClick={() => setQty(Math.min(stock, qty + 1))} className="grid h-12 w-12 place-items-center" aria-label="+"><Plus size={15} /></button>
            </div>
            <Button variant="dark" size="lg" className="flex-1" disabled={stock === 0} onClick={() => add()}>{stock === 0 ? t('Esaurito', 'Sold out') : t('Aggiungi al carrello', 'Add to cart')}</Button>
            <Button size="lg" disabled={stock === 0} onClick={() => add(true)}>{t('Acquista ora', 'Buy now')}</Button>
          </div>
          <p className={cn('mt-3 text-[12.5px]', stock <= 3 ? 'text-crimson' : 'text-mute-2')}>{stock === 0 ? t('Non disponibile', 'Unavailable') : stock <= 3 ? t(`Solo ${stock} disponibili`, `Only ${stock} left`) : t('Disponibile, spedito in 24/48h', 'In stock, ships in 24/48h')}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-ivory-3 bg-white p-4 text-sm"><Truck size={20} className="shrink-0 text-crimson" /><div><b>{t('Spedizione', 'Shipping')} {eur(salon.policies.shippingFee)}</b><div className="text-[12px] text-mute-2">{t('Gratis sopra', 'Free over')} {eur(salon.policies.freeShippingOver)}</div></div></div>
            <div className="flex gap-3 rounded-2xl border border-ivory-3 bg-white p-4 text-sm"><Store size={20} className="shrink-0 text-crimson" /><div><b>{t('Ritiro in salone gratuito', 'Free salon pickup')}</b><div className="text-[12px] text-mute-2">{salon.city}</div></div></div>
          </div>
          <Link to={`/salone/${salon.slug}`} className="mt-4 flex items-center gap-4 rounded-2xl border border-ivory-3 bg-white p-4 transition hover:border-ink/40">
            <Img src={salon.cover} className="h-14 w-14 rounded-xl" /><div className="flex-1"><div className="text-[11px] uppercase tracking-[.18em] text-mute-2">{t('Venduto da', 'Sold by')}</div><div className="font-serif text-2xl">{salon.name}</div></div><ShieldCheck size={18} className="text-crimson" />
          </Link>
        </div>
      </section>
      <section className="wrap mt-16 max-w-4xl">
        <Tabs light value={tab} onChange={setTab} tabs={[{ id: 'desc', label: t('Descrizione', 'Description') }, { id: 'use', label: t('Modo d’uso', 'How to use') }, { id: 'inci', label: 'Ingredienti (INCI)' }, { id: 'reviews', label: t('Recensioni', 'Reviews'), count: reviews.length }]} />
        <div className="py-8 text-[15px] leading-relaxed text-ink/85">
          {tab === 'desc' && <p>{p.description}</p>}
          {tab === 'use' && <p>{p.howToUse}</p>}
          {tab === 'inci' && <><p className="font-mono text-[13px]">{p.inci}</p><p className="mt-4 text-[12px] text-mute-2">{t('Elenco ingredienti conforme al Regolamento (CE) n. 1223/2009. Persona responsabile indicata in etichetta.', 'Ingredient list per Regulation (EC) No 1223/2009. Responsible person shown on the label.')}</p></>}
          {tab === 'reviews' && (reviews.length ? reviews.map((r) => <div key={r.id} className="border-b border-ivory-3 py-4"><div className="flex items-center justify-between"><b>{r.customerName}</b><Stars value={r.rating} className="!text-crimson" /></div><p className="mt-2">{r.text}</p><div className="mt-1 text-[12px] text-mute-2">{fmtDateShort(r.createdAt, s.lang)}</div></div>) : <p className="text-mute-2">{t('Ancora nessuna recensione.', 'No reviews yet.')}</p>)}
        </div>
      </section>
      {related.length > 0 && (
        <section className="wrap mt-10"><h2 className="mb-8 text-4xl md:text-5xl">{t('Potrebbe piacerti', 'You may also like')}</h2><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{related.map((x) => <ProductCard key={x.id} product={x} />)}</div></section>
      )}
    </div>
  );
}
