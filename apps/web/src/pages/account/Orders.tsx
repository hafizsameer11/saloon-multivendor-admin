import { ArrowLeft, Check, Package, RotateCcw, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fmtDayMonth, eur, fmtDate, ORDER_STATUS, type SubOrderStatus } from '@shared/index';
import { useMe, useStore, useT } from '@/lib/store';
import { Badge, Button, cn, Empty, Img, Modal, Select, Textarea, toast } from '@/components/ui';
import { NotFound } from '../public/StaticPages';
import { AHead } from './AccountRoutes';

export function Orders() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const orders = s.orders.filter((o) => o.customerId === me.id);
  return (
    <div>
      <AHead title={t('Ordini', 'Orders')} sub={t('Ogni ordine può contenere spedizioni da saloni diversi.', 'Each order may include shipments from different salons.')} />
      {orders.length === 0 ? <Empty title={t('Nessun ordine', 'No orders')} action={<Button to="/shop">{t('Vai allo shop', 'Go to shop')}</Button>} /> : (
        <div className="space-y-4">
          {orders.map((o) => {
            const subs = s.subOrders.filter((x) => x.orderId === o.id);
            return (
              <Link key={o.id} to={`/account/ordini/${o.id}`} className="card card-hover flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <div className="flex -space-x-3">{subs.flatMap((x) => x.items).slice(0, 4).map((it, i) => <Img key={i} src={it.image} className="h-16 w-16 rounded-2xl border-2 border-graphite" />)}</div>
                <div className="flex-1"><div className="font-serif text-2xl">{o.code}</div><div className="text-[12.5px] text-mute">{fmtDate(o.createdAt, s.lang)} · {subs.reduce((a, x) => a + x.items.length, 0)} {t('articoli', 'items')} · {subs.length} {t('salone/i', 'salon(s)')}</div></div>
                <div className="flex flex-wrap gap-1.5">{subs.map((x) => <Badge key={x.id} tone={ORDER_STATUS[x.status].tone}>{ORDER_STATUS[x.status][s.lang]}</Badge>)}</div>
                <div className="font-serif text-3xl md:w-28 md:text-right">{eur(o.total)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const FLOW_SHIP: SubOrderStatus[] = ['received', 'preparing', 'shipped', 'delivered'];
const FLOW_PICK: SubOrderStatus[] = ['received', 'preparing', 'ready_pickup', 'delivered'];

export function OrderDetail() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const [ret, setRet] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const o = s.orders.find((x) => x.id === id && x.customerId === me.id);
  if (!o) return <NotFound />;
  const subs = s.subOrders.filter((x) => x.orderId === o.id);
  return (
    <div>
      <Link to="/account/ordini" className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-gold"><ArrowLeft size={14} />{t('Ordini', 'Orders')}</Link>
      <AHead title={o.code} sub={`${fmtDate(o.createdAt, s.lang)} · ${o.paymentMethod}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {subs.map((so) => {
            const salon = s.salons.find((x) => x.id === so.salonId)!;
            const flow = so.shippingMethod === 'pickup' ? FLOW_PICK : FLOW_SHIP;
            const idx = flow.indexOf(so.status);
            return (
              <div key={so.id} className="card p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><Img src={salon.cover} className="h-11 w-11 rounded-full" /><div><Link to={`/salone/${salon.slug}`} className="font-serif text-2xl hover:text-gold">{salon.name}</Link><div className="text-[12px] text-mute">{so.code}</div></div></div>
                  <Badge tone={ORDER_STATUS[so.status].tone}>{so.shippingMethod === 'pickup' ? <Store size={12} /> : <Truck size={12} />}{ORDER_STATUS[so.status][s.lang]}</Badge>
                </div>
                {idx >= 0 && (
                  <div className="mt-7 grid grid-cols-4">
                    {flow.map((st, i) => (
                      <div key={st} className="relative flex flex-col items-center text-center">
                        {i > 0 && <span className={cn('absolute right-1/2 top-3.5 h-[2px] w-full', i <= idx ? 'bg-gold' : 'bg-smoke')} />}
                        <span className={cn('relative z-10 grid h-7 w-7 place-items-center rounded-full border-2', i <= idx ? 'border-gold bg-gold text-coal' : 'border-smoke bg-graphite')}>{i <= idx && <Check size={13} strokeWidth={3} />}</span>
                        <span className={cn('mt-2 text-[11px] leading-tight', i <= idx ? 'text-ivory' : 'text-mute')}>{ORDER_STATUS[st][s.lang]}</span>
                        {so.timeline.find((x) => x.status === st) && <span className="text-[10px] text-mute">{fmtDayMonth(so.timeline.find((x) => x.status === st)!.at, s.lang)}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {so.trackingNo && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-smoke p-4 text-sm"><span><Package size={14} className="mr-2 inline text-gold" />{so.carrier} · <b>{so.trackingNo}</b></span><Button size="sm" variant="line" onClick={() => toast(t('Tracking BRT: in transito verso il centro di distribuzione', 'BRT tracking: in transit to depot'))}>{t('Traccia', 'Track')}</Button></div>}
                {so.status === 'ready_pickup' && <div className="mt-6 rounded-2xl border border-ok/30 bg-ok/10 p-4 text-sm text-ok">{t('Pronto! Ritiralo in salone:', 'Ready! Pick it up at:')} {salon.address}, {salon.city}</div>}
                <ul className="mt-6 divide-y divide-smoke">
                  {so.items.map((it) => <li key={it.productId} className="flex items-center gap-4 py-3"><Img src={it.image} className="h-14 w-12 rounded-xl" /><span className="flex-1 text-sm">{it.name}<span className="text-mute"> × {it.qty}</span></span><span className="text-sm">{eur(it.price * it.qty)}</span></li>)}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t border-smoke pt-4 text-sm">
                  <span className="text-mute">{t('Spedizione', 'Shipping')}: {so.shippingFee ? eur(so.shippingFee) : t('gratis', 'free')}</span>
                  {so.status === 'delivered' && !so.returnRequested && <Button size="sm" variant="line" onClick={() => setRet(so.id)}><RotateCcw size={13} />{t('Richiedi reso', 'Request return')}</Button>}
                  {so.returnRequested && <Badge tone="warn">{t('Reso richiesto', 'Return requested')}</Badge>}
                </div>
              </div>
            );
          })}
        </div>
        <aside className="space-y-4">
          <div className="card p-6"><div className="label">{t('Totale', 'Total')}</div><div className="font-serif text-5xl">{eur(o.total)}</div>{o.discount > 0 && <div className="mt-1 text-[12px] text-gold">{t('Sconto', 'Discount')} -{eur(o.discount)}</div>}</div>
          {o.address && <div className="card p-6 text-sm"><div className="label">{t('Indirizzo', 'Address')}</div>{o.address.name}<br />{o.address.street}<br />{o.address.zip} {o.address.city} ({o.address.province})</div>}
          <div className="card p-6 text-sm"><div className="label">{t('Assistenza', 'Help')}</div><p className="text-mute">{t('Problemi con l’ordine? Scrivi al salone o al nostro supporto.', 'Issues with your order? Contact the salon or our support.')}</p><Button size="sm" variant="line" className="mt-3" to="/contatti">{t('Contatta supporto', 'Contact support')}</Button></div>
        </aside>
      </div>
      <Modal open={!!ret} onClose={() => setRet(null)} title={t('Richiesta di reso', 'Return request')} footer={<Button disabled={!reason} onClick={() => { s.requestReturn(ret!); toast(t('Richiesta inviata al salone', 'Request sent to the salon'), 'ok'); setRet(null); }}>{t('Invia richiesta', 'Send request')}</Button>}>
        <p className="text-sm text-mute">{t('Hai 14 giorni dalla consegna. Il prodotto deve essere sigillato e non utilizzato.', 'You have 14 days from delivery. The product must be sealed and unused.')}</p>
        <div className="mt-4 space-y-3"><Select value={reason} onChange={(e) => setReason(e.target.value)}><option value="">{t('Motivo…', 'Reason…')}</option><option>{t('Prodotto danneggiato', 'Damaged product')}</option><option>{t('Prodotto errato', 'Wrong product')}</option><option>{t('Ho cambiato idea', 'Changed my mind')}</option></Select><Textarea placeholder={t('Dettagli (facoltativo)', 'Details (optional)')} /></div>
      </Modal>
    </div>
  );
}
