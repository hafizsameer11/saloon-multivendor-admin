import { Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { eur } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Button, Img } from '@/components/ui';
import { ProductCard } from '@/components/cards';

export function useCartGroups() {
  const s = useStore();
  const lines = s.cart.map((l) => {
    const p = s.products.find((x) => x.id === l.productId)!;
    const v = p?.variants.find((x) => x.id === l.variantId);
    return p ? { ...l, p, v, price: p.price + (v?.priceDelta ?? 0) } : null;
  }).filter(Boolean) as { productId: string; variantId?: string; qty: number; p: (typeof s.products)[number]; v?: (typeof s.products)[number]['variants'][number]; price: number }[];
  const groups = Array.from(new Set(lines.map((l) => l.p.salonId))).map((salonId) => {
    const salon = s.salons.find((x) => x.id === salonId)!;
    const items = lines.filter((l) => l.p.salonId === salonId);
    const subtotal = items.reduce((a, l) => a + l.price * l.qty, 0);
    return { salon, items, subtotal };
  });
  return { lines, groups, subtotal: groups.reduce((a, g) => a + g.subtotal, 0) };
}

export default function Cart() {
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const { groups, subtotal } = useCartGroups();
  const suggestions = s.products.filter((p) => p.status === 'published' && !s.cart.some((c) => c.productId === p.id)).sort((a, b) => b.sold - a.sold).slice(0, 4);
  return (
    <div className="day min-h-screen pb-24">
      <div className="wrap pt-12">
        <div className="text-[11px] uppercase tracking-eyebrow text-crimson">{t('Carrello', 'Cart')}</div>
        <h1 className="mt-3 text-6xl md:text-7xl">{t('La tua borsa', 'Your bag')}</h1>
        {groups.length === 0 ? (
          <div className="mt-10 rounded-[32px] border border-ivory-3 bg-white p-14 text-center">
            <ShoppingBag className="mx-auto text-crimson" size={36} strokeWidth={1.3} />
            <h2 className="mt-4 text-4xl">{t('È ancora vuota', 'It’s still empty')}</h2>
            <p className="mt-2 text-mute-2">{t('Scopri i prodotti scelti dai professionisti.', 'Discover products chosen by professionals.')}</p>
            <Button to="/shop" variant="dark" className="mt-6">{t('Vai allo shop', 'Go to shop')}</Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <p className="text-sm text-mute-2">{t('I prodotti sono spediti direttamente da ciascun salone: riceverai un pacco per salone.', 'Products ship directly from each salon: one parcel per salon.')}</p>
              {groups.map((g) => (
                <div key={g.salon.id} className="overflow-hidden rounded-[28px] border border-ivory-3 bg-white">
                  <div className="flex items-center justify-between border-b border-ivory-3 px-6 py-4">
                    <Link to={`/salone/${g.salon.slug}`} className="flex items-center gap-3"><Img src={g.salon.cover} className="h-9 w-9 rounded-full" /><span className="font-serif text-2xl">{g.salon.name}</span></Link>
                    <span className="flex items-center gap-1.5 text-[12px] text-mute-2"><Truck size={14} />{g.subtotal >= g.salon.policies.freeShippingOver ? t('Spedizione gratuita', 'Free shipping') : `${t('Mancano', 'Add')} ${eur(g.salon.policies.freeShippingOver - g.subtotal)} ${t('per la spedizione gratis', 'for free shipping')}`}</span>
                  </div>
                  <ul>
                    {g.items.map((l) => (
                      <li key={l.productId + (l.variantId ?? '')} className="flex gap-4 border-b border-ivory-3 px-6 py-5 last:border-0">
                        <Link to={`/prodotto/${l.p.id}`}><Img src={l.p.images[0]} className="h-24 w-20 rounded-2xl" /></Link>
                        <div className="flex flex-1 flex-col">
                          <div className="text-[10.5px] uppercase tracking-[.2em] text-mute-2">{l.p.brand}</div>
                          <Link to={`/prodotto/${l.p.id}`} className="font-serif text-2xl leading-tight">{l.p.name}</Link>
                          {l.v && <div className="text-[12.5px] text-mute-2">{l.v.label}</div>}
                          <div className="mt-auto flex items-center gap-3 pt-3">
                            <div className="flex items-center rounded-full border border-ivory-3">
                              <button onClick={() => s.setCartQty(l.productId, l.variantId, l.qty - 1)} className="grid h-9 w-9 place-items-center" aria-label="-"><Minus size={13} /></button><span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                              <button onClick={() => s.setCartQty(l.productId, l.variantId, Math.min(l.qty + 1, l.v?.stock ?? l.p.stock))} className="grid h-9 w-9 place-items-center" aria-label="+"><Plus size={13} /></button>
                            </div>
                            <button onClick={() => s.setCartQty(l.productId, l.variantId, 0)} className="text-mute-2 hover:text-crimson" aria-label={t('Rimuovi', 'Remove')}><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="font-semibold">{eur(l.price * l.qty)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <aside>
              <div className="sticky top-24 rounded-[28px] border border-ivory-3 bg-white p-6">
                <h2 className="text-3xl">{t('Riepilogo', 'Summary')}</h2>
                <div className="mt-5 space-y-2 text-sm">
                  {groups.map((g) => <div key={g.salon.id} className="flex justify-between text-mute-2"><span>{g.salon.name}</span><span>{eur(g.subtotal)}</span></div>)}
                  <div className="flex justify-between text-mute-2"><span>{t('Spedizione', 'Shipping')}</span><span>{t('calcolata al checkout', 'at checkout')}</span></div>
                </div>
                <div className="my-5 h-px bg-ivory-3" />
                <div className="flex items-end justify-between"><span className="text-sm">{t('Subtotale', 'Subtotal')}</span><span className="font-serif text-4xl">{eur(subtotal)}</span></div>
                <Button full size="lg" className="mt-6" onClick={() => nav(s.userId ? '/checkout' : '/accedi?next=/checkout')}>{t('Procedi al checkout', 'Checkout')}</Button>
                <Button to="/shop" variant="inkline" full className="mt-3">{t('Continua lo shopping', 'Keep shopping')}</Button>
              </div>
            </aside>
          </div>
        )}
        {suggestions.length > 0 && (
          <section className="mt-20"><h2 className="mb-8 text-4xl">{t('Spesso acquistati', 'Often bought')}</h2><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{suggestions.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
        )}
      </div>
    </div>
  );
}
