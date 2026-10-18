import { Check, CreditCard, Lock, MapPin, Plus, Store, Truck } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { dataLabel, eur, uid, type Address, type Coupon, type ShippingMethod } from '@shared/index';
import { apiMode, useMe, useStore, useT } from '@/lib/store';
import { PaymentPanel } from '@/components/PaymentPanel';
import { errorText } from '@shared/api/client';
import type { PaymentStart } from '@shared/api/remote';
import { Button, cn, Field, Img, Input, toast } from '@/components/ui';
import { useCartGroups } from './Cart';

const Box = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="rounded-[28px] border border-ivory-3 bg-white p-6 md:p-8">
    <div className="mb-5 flex items-center gap-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-serif text-lg italic text-ivory">{n}</span><h2 className="text-3xl">{title}</h2></div>
    {children}
  </section>
);

export default function Checkout() {
  const t = useT();
  const s = useStore();
  const me = useMe();
  const nav = useNavigate();
  const { groups, subtotal } = useCartGroups();
  const [addrId, setAddrId] = useState(me?.addresses.find((a) => a.isDefault)?.id ?? me?.addresses[0]?.id ?? 'new');
  const [na, setNa] = useState<Address>({ id: uid('a'), label: 'Casa', name: me?.name ?? '', street: '', city: '', zip: '', province: '', phone: me?.phone ?? '' });
  const [methods, setMethods] = useState<Record<string, ShippingMethod>>({});
  const [codeIn, setCodeIn] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [pay, setPay] = useState('card');
  const [card, setCard] = useState({ n: '', e: '', c: '' });
  const [busy, setBusy] = useState(false);
  const placedRef = useRef(false);
  const [codeApplied, setCodeApplied] = useState<string | null>(null);
  const [quote, setQuote] = useState<Awaited<ReturnType<NonNullable<typeof s.apiQuote>>> | null>(null);
  const [paying, setPaying] = useState<{ orderId: string; payment: PaymentStart } | null>(null);
  const lineKey = JSON.stringify(s.cart) + JSON.stringify(methods) + codeApplied;
  useEffect(() => {
    if (!apiMode || !s.cart.length) return;
    let alive = true;
    const shipping = Object.fromEntries(groups.map((g) => [g.salon.id, methods[g.salon.id] ?? 'standard'])) as Record<string, ShippingMethod>;
    s.apiQuote!(s.cart.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })), codeApplied, shipping)
      .then((q) => { if (!alive) return; setQuote(q); if (q.coupon?.error) { toast(q.coupon.error, 'red'); setCodeApplied(null); } })
      .catch((e) => toast(errorText(e), 'red'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey]);
  if (paying) return (
    <div className="wrap max-w-lg pb-24 pt-12">
      <PaymentPanel payment={paying.payment} title={t('Ordine', 'Order')} onPaid={() => { placedRef.current = true; s.clearCart(); toast(t('Pagamento riuscito', 'Payment successful'), 'ok'); nav(`/ordine/${paying.orderId}`); }} onCancel={() => setPaying(null)} />
      <p className="mt-4 text-center text-[12px] text-mute">{t('I prodotti restano riservati per circa 30 minuti.', 'Items stay reserved for about 30 minutes.')}</p>
    </div>
  );
  if (!me) return <Navigate to="/accedi?next=/checkout" replace />;
  if (groups.length === 0) return placedRef.current ? null : <Navigate to="/carrello" replace />;
  const m = (id: string) => methods[id] ?? 'standard';
  const fee = (g: (typeof groups)[number]) => (m(g.salon.id) === 'pickup' || g.subtotal >= g.salon.policies.freeShippingOver ? 0 : g.salon.policies.shippingFee);
  const shipping = apiMode && quote ? quote.shipping : groups.reduce((a, g) => a + fee(g), 0);
  const gross = subtotal + shipping;
  const discount = apiMode ? quote?.discount ?? 0 : coupon ? (coupon.type === 'percent' ? Math.round(gross * coupon.value) / 100 : coupon.value) : 0;
  const total = apiMode && quote ? quote.total : Math.max(0, gross - discount);
  const needsAddress = groups.some((g) => m(g.salon.id) === 'standard');
  const addrOk = !needsAddress || (addrId !== 'new' ? true : na.street && na.city && na.zip.length === 5);
  const payOk = apiMode || pay !== 'card' || (card.n.replace(/\s/g, '').length >= 12 && card.e.length >= 4 && card.c.length >= 3);
  const apply = () => {
    if (apiMode) { if (codeIn.trim()) setCodeApplied(codeIn.trim().toUpperCase()); return; }
    const c = s.coupons.find((x) => x.code.toLowerCase() === codeIn.trim().toLowerCase() && x.active);
    if (!c) return toast(t('Codice non valido', 'Invalid code'), 'red');
    if (c.scope !== 'platform' && !groups.some((g) => g.salon.id === c.scope)) return toast(t('Codice valido solo per un altro salone', 'Code valid for another salon only'), 'red');
    if (gross < c.minSpend) return toast(t(`Spesa minima ${eur(c.minSpend)}`, `Minimum spend ${eur(c.minSpend)}`), 'red');
    setCoupon(c); toast(t('Codice applicato', 'Code applied'), 'ok');
  };
  const placeApi = async () => {
    setBusy(true);
    try {
      let address: Omit<Address, 'id' | 'isDefault'> | undefined;
      if (needsAddress && addrId === 'new') { const { id: _id, isDefault: _d, ...rest } = na; address = rest; s.saveAddress({ ...na, isDefault: me.addresses.length === 0 }); }
      const r = await s.apiCheckout!({
        lines: s.cart.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        couponCode: codeApplied, shipping: Object.fromEntries(groups.map((g) => [g.salon.id, m(g.salon.id)])),
        ...(needsAddress ? (addrId === 'new' ? { address } : { addressId: addrId }) : {}),
      });
      setPaying({ orderId: r.order.id, payment: r.payment });
    } catch (e) { toast(errorText(e), 'red'); } finally { setBusy(false); }
  };
  const place = () => {
    if (apiMode) { void placeApi(); return; }
    setBusy(true);
    let address: Address | undefined = undefined;
    if (needsAddress) { if (addrId === 'new') { s.saveAddress({ ...na, isDefault: me.addresses.length === 0 }); address = na; } else address = me.addresses.find((a) => a.id === addrId); }
    setTimeout(() => {
      placedRef.current = true;
      const o = s.placeOrder({ methods: Object.fromEntries(groups.map((g) => [g.salon.id, m(g.salon.id)])), address, payment: pay === 'card' ? `Carta •••• ${card.n.replace(/\s/g, '').slice(-4)}` : pay === 'paypal' ? 'PayPal' : 'Apple Pay', coupon });
      nav(`/ordine/${o.id}`);
    }, 900);
  };

  return (
    <div className="day min-h-screen pb-24">
      <div className="wrap pt-12">
        <div className="text-[11px] uppercase tracking-eyebrow text-crimson">Checkout</div>
        <h1 className="mt-3 text-6xl">{t('Quasi fatto.', 'Almost there.')}</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Box n={1} title={t('Consegna per salone', 'Delivery per salon')}>
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.salon.id} className="rounded-2xl border border-ivory-3 p-4">
                    <div className="mb-3 flex items-center gap-3"><Img src={g.salon.cover} className="h-8 w-8 rounded-full" /><b className="font-serif text-xl">{g.salon.name}</b><span className="text-[12px] text-mute-2">· {g.items.length} {t('articoli', 'items')}</span></div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([['standard', <Truck key="t" size={17} />, t('Spedizione BRT 24/48h', 'BRT shipping 24/48h'), g.subtotal >= g.salon.policies.freeShippingOver ? t('Gratis', 'Free') : eur(g.salon.policies.shippingFee)], ['pickup', <Store key="s" size={17} />, t('Ritiro in salone', 'Salon pickup'), `${t('Gratis', 'Free')} · ${g.salon.city}`]] as const).map(([k, i, l, sub]) => (
                        <button key={k} onClick={() => setMethods({ ...methods, [g.salon.id]: k })} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left transition', m(g.salon.id) === k ? 'border-ink bg-ivory' : 'border-ivory-3 hover:border-ink/40')}>
                          <span className="text-crimson">{i}</span><span className="flex-1"><span className="block text-sm font-semibold">{l}</span><span className="text-[12px] text-mute-2">{sub}</span></span>{m(g.salon.id) === k && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Box>
            {needsAddress && (
              <Box n={2} title={t('Indirizzo di spedizione', 'Shipping address')}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {me.addresses.map((a) => (
                    <button key={a.id} onClick={() => setAddrId(a.id)} className={cn('rounded-2xl border p-4 text-left text-sm transition', addrId === a.id ? 'border-ink bg-ivory' : 'border-ivory-3')}>
                      <div className="flex items-center gap-2 font-semibold"><MapPin size={14} className="text-crimson" />{dataLabel(a.label, s.lang)}{a.isDefault && <span className="text-[10px] uppercase tracking-widest text-mute-2">· {t('predefinito', 'default')}</span>}</div>
                      <div className="mt-1 text-mute-2">{a.name}<br />{a.street}, {a.zip} {a.city} ({a.province})</div>
                    </button>
                  ))}
                  <button onClick={() => setAddrId('new')} className={cn('flex items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm', addrId === 'new' ? 'border-ink' : 'border-ivory-3')}><Plus size={15} />{t('Nuovo indirizzo', 'New address')}</button>
                </div>
                {addrId === 'new' && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Field label={t('Nome e cognome', 'Full name')}><Input value={na.name} onChange={(e) => setNa({ ...na, name: e.target.value })} /></Field>
                    <Field label={t('Telefono', 'Phone')}><Input value={na.phone} onChange={(e) => setNa({ ...na, phone: e.target.value })} /></Field>
                    <Field label={t('Via e numero civico', 'Street and number')} className="sm:col-span-2"><Input value={na.street} onChange={(e) => setNa({ ...na, street: e.target.value })} /></Field>
                    <Field label={t('Città', 'City')}><Input value={na.city} onChange={(e) => setNa({ ...na, city: e.target.value })} /></Field>
                    <div className="grid grid-cols-2 gap-3"><Field label={t('CAP', 'Postcode')}><Input inputMode="numeric" value={na.zip} onChange={(e) => setNa({ ...na, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} /></Field><Field label={t('Prov.', 'Province')}><Input value={na.province} onChange={(e) => setNa({ ...na, province: e.target.value.toUpperCase().slice(0, 2) })} /></Field></div>
                  </div>
                )}
              </Box>
            )}
            {apiMode ? (
              <Box n={needsAddress ? 3 : 2} title={t('Pagamento', 'Payment')}>
                <p className="flex items-center gap-2 text-sm text-mute-2"><Lock size={14} />{t('Al passo successivo paghi con carta, Apple Pay o Google Pay nel modulo sicuro di Stripe. Un solo pagamento, diviso automaticamente tra i saloni.', 'Next you pay by card, Apple Pay or Google Pay in Stripe’s secure form. One payment, split automatically between salons.')}</p>
              </Box>
            ) : (
            <Box n={needsAddress ? 3 : 2} title={t('Pagamento', 'Payment')}>
              <div className="grid gap-2 sm:grid-cols-3">
                {[['card', t('Carta', 'Card')], ['paypal', 'PayPal'], ['apple', 'Apple Pay']].map(([k, l]) => (
                  <button key={k} onClick={() => setPay(k)} className={cn('flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-semibold transition', pay === k ? 'border-ink bg-ivory' : 'border-ivory-3')}>{k === 'card' && <CreditCard size={16} />}{l}</button>
                ))}
              </div>
              {pay === 'card' && (
                <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Field label={t('Numero carta', 'Card number')}><Input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.n} onChange={(e) => setCard({ ...card, n: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} /></Field>
                  <Field label="MM/AA"><Input placeholder="12/28" value={card.e} onChange={(e) => setCard({ ...card, e: e.target.value.slice(0, 5) })} /></Field>
                  <Field label="CVC"><Input placeholder="123" value={card.c} onChange={(e) => setCard({ ...card, c: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Field>
                </div>
              )}
              {pay !== 'card' && <p className="mt-4 text-sm text-mute-2">{t('Verrai reindirizzato per completare il pagamento (simulato nella demo).', 'You’ll be redirected to complete payment (simulated in demo).')}</p>}
              <p className="mt-4 flex items-center gap-2 text-[12px] text-mute-2"><Lock size={12} />{t('Demo: nessun addebito reale. In produzione: Stripe Connect con pagamento suddiviso tra i saloni.', 'Demo: no real charge. In production: Stripe Connect split between salons.')}</p>
            </Box>
            )}
          </div>
          <aside>
            <div className="sticky top-24 rounded-[28px] border border-ivory-3 bg-white p-6">
              <h2 className="text-3xl">{t('Il tuo ordine', 'Your order')}</h2>
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                {groups.flatMap((g) => g.items).map((l) => (
                  <div key={l.productId + (l.variantId ?? '')} className="flex items-center gap-3 text-sm"><div className="relative"><Img src={l.p.images[0]} className="h-14 w-12 rounded-xl" /><span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-ivory">{l.qty}</span></div><span className="flex-1 leading-tight">{l.p.name}{l.v ? ` · ${l.v.label}` : ''}</span><span>{eur(l.price * l.qty)}</span></div>
                ))}
              </div>
              <div className="mt-5 flex gap-2"><Input value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder={t('Codice sconto', 'Promo code')} className="!py-2.5" /><Button variant="inkline" size="sm" onClick={apply}>{t('Applica', 'Apply')}</Button></div>
              <p className="mt-1.5 text-[11px] text-mute-2">{t('Prova', 'Try')}: BENVENUTA10</p>
              <div className="mt-5 space-y-2 border-t border-ivory-3 pt-4 text-sm">
                <div className="flex justify-between"><span className="text-mute-2">{t('Subtotale', 'Subtotal')}</span><span>{eur(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-mute-2">{t('Spedizione', 'Shipping')}</span><span>{shipping ? eur(shipping) : t('Gratis', 'Free')}</span></div>
                {!apiMode && coupon && <div className="flex justify-between text-crimson"><span>{coupon.code} <button className="ml-1 underline" onClick={() => setCoupon(null)}>×</button></span><span>-{eur(discount)}</span></div>}
                {apiMode && codeApplied && discount > 0 && <div className="flex justify-between text-crimson"><span>{codeApplied} <button className="ml-1 underline" onClick={() => setCodeApplied(null)}>×</button></span><span>-{eur(discount)}</span></div>}
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-ivory-3 pt-4"><span className="text-sm">{t('Totale', 'Total')} <span className="text-[11px] text-mute-2">{t('IVA incl.', 'VAT incl.')}</span></span><span className="font-serif text-4xl">{eur(total)}</span></div>
              <Button full size="lg" className="mt-6" disabled={!addrOk || !payOk || busy} onClick={place}>{busy ? t('Elaborazione…', 'Processing…') : apiMode ? `${t('Continua al pagamento', 'Continue to payment')} · ${eur(total)}` : `${t('Paga', 'Pay')} ${eur(total)}`}</Button>
              {!addrOk && <p className="mt-2 text-center text-[12px] text-crimson">{t('Completa l’indirizzo di spedizione', 'Complete the shipping address')}</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
