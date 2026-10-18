import { ArrowLeft, Printer, Store, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fmtDateTime, eur, fmtDate, ORDER_STATUS, type SubOrder, type SubOrderStatus } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { Badge, Button, Field, Img, Input, Modal, Table, Tabs, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

export function SellerOrders() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const nav = useNavigate();
  const [tab, setTab] = useState<'todo' | 'shipped' | 'done' | 'all'>('todo');
  const all = s.subOrders.filter((x) => x.salonId === salon.id).sort((a, b) => (s.orders.find((o) => o.id === b.orderId)?.createdAt ?? '').localeCompare(s.orders.find((o) => o.id === a.orderId)?.createdAt ?? ''));
  const groups: Record<typeof tab, SubOrder[]> = {
    todo: all.filter((x) => ['received', 'preparing'].includes(x.status)),
    shipped: all.filter((x) => ['shipped', 'ready_pickup'].includes(x.status)),
    done: all.filter((x) => ['delivered', 'cancelled', 'refunded'].includes(x.status)),
    all,
  };
  return (
    <div>
      <PageHead title={t('Ordini', 'Orders')} sub={t('Solo gli articoli del tuo salone. Il cliente riceve una notifica a ogni cambio di stato.', 'Only your salon’s items. The client is notified on every status change.')} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'todo', label: t('Da evadere', 'To fulfil'), count: groups.todo.length }, { id: 'shipped', label: t('In consegna', 'In transit'), count: groups.shipped.length }, { id: 'done', label: t('Conclusi', 'Completed'), count: groups.done.length }, { id: 'all', label: t('Tutti', 'All'), count: all.length }]} /></div>
      <Table<SubOrder> rows={groups[tab]} onRow={(x) => nav(`/seller/ordini/${x.id}`)} empty={t('Nessun ordine', 'No orders')} cols={[
        { key: 'c', head: t('Ordine', 'Order'), cell: (x) => <div><div className="font-semibold">{x.code}</div><div className="text-[11.5px] text-mute">{fmtDate(s.orders.find((o) => o.id === x.orderId)!.createdAt, s.lang)}</div></div> },
        { key: 'cl', head: t('Cliente', 'Client'), cell: (x) => s.orders.find((o) => o.id === x.orderId)!.customerName },
        { key: 'i', head: t('Articoli', 'Items'), cell: (x) => <div className="flex -space-x-2">{x.items.slice(0, 3).map((it, i) => <Img key={i} src={it.image} className="h-9 w-9 rounded-lg border-2 border-graphite" />)}<span className="ml-3 self-center text-[12px] text-mute">{x.items.reduce((a, it) => a + it.qty, 0)} pz</span></div> },
        { key: 'm', head: t('Consegna', 'Delivery'), cell: (x) => x.shippingMethod === 'pickup' ? <span className="flex items-center gap-1.5"><Store size={13} />{t('Ritiro', 'Pickup')}</span> : <span className="flex items-center gap-1.5"><Truck size={13} />{t('Spedizione', 'Shipping')}</span> },
        { key: 't', head: t('Totale', 'Total'), cell: (x) => eur(x.subtotal + x.shippingFee) },
        { key: 's', head: t('Stato', 'Status'), cell: (x) => <div className="flex flex-wrap gap-1"><Badge tone={ORDER_STATUS[x.status].tone}>{ORDER_STATUS[x.status][s.lang]}</Badge>{x.returnRequested && <Badge tone="warn">{t('Reso', 'Return')}</Badge>}</div> },
      ]} />
    </div>
  );
}

export function SellerOrderDetail() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const [ship, setShip] = useState(false);
  const [tracking, setTracking] = useState('');
  const [refund, setRefund] = useState(false);
  const so = s.subOrders.find((x) => x.id === id && x.salonId === salon.id);
  if (!so) return <div className="text-mute">{t('Ordine non trovato', 'Order not found')}</div>;
  const order = s.orders.find((o) => o.id === so.orderId)!;
  const set = (st: SubOrderStatus, tr?: string) => { s.setSubOrderStatus(so.id, st, tr); toast(`${t('Stato aggiornato', 'Status updated')}: ${ORDER_STATUS[st][s.lang]}`, 'ok'); };
  const net = Math.round((so.subtotal * (1 - salon.commissionRate)) * 100) / 100;
  return (
    <div className="max-w-5xl">
      <Link to="/seller/ordini" className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-gold print:hidden"><ArrowLeft size={14} />{t('Ordini', 'Orders')}</Link>
      <PageHead title={so.code} sub={`${fmtDate(order.createdAt, s.lang)} · ${order.customerName}`} actions={<Button variant="line" size="sm" onClick={() => window.print()}><Printer size={14} />{t('Distinta', 'Packing slip')}</Button>} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between"><h3 className="text-2xl">{t('Articoli', 'Items')}</h3><Badge tone={ORDER_STATUS[so.status].tone}>{ORDER_STATUS[so.status][s.lang]}</Badge></div>
            <ul className="mt-4 divide-y divide-smoke">{so.items.map((it) => <li key={it.productId + (it.variantId ?? '')} className="flex items-center gap-4 py-3"><Img src={it.image} className="h-14 w-12 rounded-xl" /><div className="flex-1 text-sm"><div className="font-semibold">{it.name}</div><div className="text-mute">{it.qty} × {eur(it.price)}</div></div><span>{eur(it.qty * it.price)}</span></li>)}</ul>
            <div className="mt-3 space-y-1.5 border-t border-smoke pt-4 text-sm">
              <div className="flex justify-between"><span className="text-mute">{t('Subtotale', 'Subtotal')}</span>{eur(so.subtotal)}</div>
              <div className="flex justify-between"><span className="text-mute">{t('Spedizione', 'Shipping')}</span>{eur(so.shippingFee)}</div>
              <div className="flex justify-between"><span className="text-mute">{t('Commissione', 'Commission')} {Math.round(salon.commissionRate * 100)}%</span>-{eur(so.subtotal - net)}</div>
              <div className="flex justify-between font-semibold text-gold"><span>{t('Ricevi', 'You receive')}</span>{eur(net + so.shippingFee)}</div>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-2xl">{t('Cronologia', 'Timeline')}</h3>
            <ol className="mt-4 space-y-3 border-l border-smoke pl-5">{so.timeline.map((x, i) => <li key={i} className="relative text-sm"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-gold" />{ORDER_STATUS[x.status][s.lang]} <span className="text-mute">· {fmtDateTime(x.at, s.lang)}</span></li>)}</ol>
          </div>
        </div>
        <div className="space-y-6 print:hidden">
          <div className="card space-y-3 p-6">
            <h3 className="text-2xl">{t('Azioni', 'Actions')}</h3>
            {so.returnRequested && <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-[13px] text-warn">{t('Il cliente ha richiesto un reso.', 'The client requested a return.')}</div>}
            {so.status === 'received' && <Button full onClick={() => set('preparing')}>{t('Inizia preparazione', 'Start preparing')}</Button>}
            {so.status === 'preparing' && so.shippingMethod === 'standard' && <Button full onClick={() => setShip(true)}><Truck size={15} />{t('Segna come spedito', 'Mark as shipped')}</Button>}
            {so.status === 'preparing' && so.shippingMethod === 'pickup' && <Button full onClick={() => set('ready_pickup')}><Store size={15} />{t('Pronto per il ritiro', 'Ready for pickup')}</Button>}
            {['shipped', 'ready_pickup'].includes(so.status) && <Button full onClick={() => set('delivered')}>{so.shippingMethod === 'pickup' ? t('Ritirato dal cliente', 'Picked up') : t('Segna come consegnato', 'Mark delivered')}</Button>}
            {!['delivered', 'cancelled', 'refunded'].includes(so.status) && <Button full variant="danger" size="sm" onClick={() => set('cancelled')}>{t('Annulla ordine', 'Cancel order')}</Button>}
            {(so.status === 'delivered' || so.returnRequested) && so.status !== 'refunded' && <Button full variant="line" size="sm" onClick={() => setRefund(true)}>{t('Rimborsa', 'Refund')}</Button>}
          </div>
          <div className="card p-6 text-sm">
            <h3 className="mb-3 text-2xl">{so.shippingMethod === 'pickup' ? t('Ritiro in salone', 'Salon pickup') : t('Spedire a', 'Ship to')}</h3>
            {so.shippingMethod === 'standard' && order.address ? <p className="text-ivory/85">{order.address.name}<br />{order.address.street}<br />{order.address.zip} {order.address.city} ({order.address.province})<br />{order.address.phone}</p> : <p className="text-mute">{order.customerName} {t('ritirerà in salone.', 'will pick up in salon.')}</p>}
            {so.trackingNo && <p className="mt-3 rounded-xl border border-smoke p-3">{so.carrier} · <b>{so.trackingNo}</b></p>}
          </div>
        </div>
      </div>
      <Modal open={ship} onClose={() => setShip(false)} title={t('Spedizione', 'Shipment')} footer={<Button disabled={tracking.length < 6} onClick={() => { set('shipped', tracking); setShip(false); }}>{t('Conferma spedizione', 'Confirm shipment')}</Button>}>
        <Field label={t('Numero di tracking (BRT)', 'Tracking number (BRT)')} hint={t('Il cliente lo riceverà via email e nell’app.', 'The client gets it by email and in-app.')}><Input value={tracking} onChange={(e) => setTracking(e.target.value.toUpperCase())} placeholder="BRT12345678" /></Field>
      </Modal>
      <Modal open={refund} onClose={() => setRefund(false)} title={t('Rimborsare l’ordine?', 'Refund order?')} footer={<><Button variant="ghost" onClick={() => setRefund(false)}>{t('Annulla', 'Cancel')}</Button><Button onClick={() => { set('refunded'); setRefund(false); }}>{t('Rimborsa', 'Refund')} {eur(so.subtotal + so.shippingFee)}</Button></>}>
        <p className="text-sm">{t('Il rimborso viene effettuato sul metodo di pagamento originale tramite Stripe (simulato).', 'Refund goes to the original payment method via Stripe (simulated).')}</p>
      </Modal>
    </div>
  );
}
