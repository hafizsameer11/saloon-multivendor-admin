import { Search } from 'lucide-react';
import { useState } from 'react';
import { BOOKING_STATUS, eur, fmtDate, fmtDateShort, ORDER_STATUS, type Booking, type Review, type SubOrder, type User } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Avatar, Badge, Button, Drawer, Input, Select, Stars, Table, Tabs, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

export function AdminBookings() {
  const t = useT();
  const s = useStore();
  const [salon, setSalon] = useState('');
  const [st, setSt] = useState('');
  const [q, setQ] = useState('');
  const rows = s.bookings.filter((b) => (!salon || b.salonId === salon) && (!st || b.status === st) && (!q || b.customerName.toLowerCase().includes(q.toLowerCase()) || b.code.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 150);
  return (
    <div>
      <PageHead title={t('Prenotazioni', 'Bookings')} sub={`${s.bookings.length} ${t('totali', 'total')} · ${t('mostrate le più recenti 150', 'showing latest 150')}`} />
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative w-64"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" /><Input className="!pl-10 !py-2.5" placeholder={t('Cliente o codice', 'Client or code')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={salon} onChange={(e) => setSalon(e.target.value)} className="!py-2.5"><option value="">{t('Tutti i saloni', 'All salons')}</option>{s.salons.filter((x) => x.status === 'approved').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
        <Select value={st} onChange={(e) => setSt(e.target.value)} className="!py-2.5"><option value="">{t('Tutti gli stati', 'All statuses')}</option>{Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v[s.lang]}</option>)}</Select>
      </div>
      <Table<Booking> rows={rows} cols={[
        { key: 'c', head: t('Codice', 'Code'), cell: (b) => <span className="font-mono text-[12.5px]">{b.code}</span> },
        { key: 'd', head: t('Data', 'Date'), cell: (b) => `${fmtDateShort(b.date, s.lang)} · ${b.time}` },
        { key: 'cl', head: t('Cliente', 'Client'), cell: (b) => b.customerName },
        { key: 's', head: t('Salone', 'Salon'), cell: (b) => s.salons.find((x) => x.id === b.salonId)?.name },
        { key: 't', head: t('Totale', 'Total'), cell: (b) => eur(b.total) },
        { key: 'p', head: t('Pagamento', 'Payment'), cell: (b) => (b.paymentMode === 'in_salon' ? t('In salone', 'In salon') : t('Online', 'Online')) },
        { key: 'st', head: t('Stato', 'Status'), cell: (b) => <Badge tone={BOOKING_STATUS[b.status].tone}>{BOOKING_STATUS[b.status][s.lang]}</Badge> },
      ]} />
    </div>
  );
}

export function AdminOrders() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'all' | 'disputes'>('all');
  const disputes = s.subOrders.filter((x) => x.returnRequested && x.status !== 'refunded');
  const rows = tab === 'disputes' ? disputes : s.subOrders;
  return (
    <div>
      <PageHead title={t('Ordini e contestazioni', 'Orders & disputes')} sub={t('Ogni ordine cliente è diviso in sotto-ordini per salone.', 'Each customer order is split into per-salon sub-orders.')} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: t('Tutti', 'All'), count: s.subOrders.length }, { id: 'disputes', label: t('Resi / contestazioni', 'Returns / disputes'), count: disputes.length }]} /></div>
      <Table<SubOrder> rows={rows} empty={t('Nessuna contestazione aperta', 'No open disputes')} cols={[
        { key: 'c', head: t('Codice', 'Code'), cell: (x) => <span className="font-mono text-[12.5px]">{x.code}</span> },
        { key: 'd', head: t('Data', 'Date'), cell: (x) => fmtDateShort(s.orders.find((o) => o.id === x.orderId)!.createdAt, s.lang) },
        { key: 'cl', head: t('Cliente', 'Client'), cell: (x) => s.orders.find((o) => o.id === x.orderId)!.customerName },
        { key: 's', head: t('Salone', 'Salon'), cell: (x) => s.salons.find((y) => y.id === x.salonId)?.name },
        { key: 't', head: t('Totale', 'Total'), cell: (x) => eur(x.subtotal + x.shippingFee) },
        { key: 'st', head: t('Stato', 'Status'), cell: (x) => <div className="flex flex-wrap gap-1"><Badge tone={ORDER_STATUS[x.status].tone}>{ORDER_STATUS[x.status][s.lang]}</Badge>{x.returnRequested && <Badge tone="warn">{t('Reso', 'Return')}</Badge>}</div> },
        { key: 'a', head: '', cell: (x) => x.returnRequested && x.status !== 'refunded' ? <Button size="sm" variant="line" onClick={() => { s.setSubOrderStatus(x.id, 'refunded'); toast(t('Rimborso emesso', 'Refund issued'), 'ok'); }}>{t('Rimborsa', 'Refund')}</Button> : null },
      ]} />
    </div>
  );
}

export function AdminCustomers() {
  const t = useT();
  const s = useStore();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<User | null>(null);
  const rows = s.users.filter((u) => u.role === 'customer' && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));
  const cur = sel && s.users.find((u) => u.id === sel.id)!;
  const spent = (id: string) => s.orders.filter((o) => o.customerId === id).reduce((a, o) => a + o.total, 0) + s.bookings.filter((b) => b.customerId === id && b.status === 'completed').reduce((a, b) => a + b.total, 0);
  return (
    <div>
      <PageHead title={t('Clienti', 'Customers')} sub={`${rows.length} ${t('clienti', 'customers')}`} />
      <div className="relative mb-5 w-72"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" /><Input className="!pl-10 !py-2.5" placeholder={t('Nome o email', 'Name or email')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Table<User> rows={rows} onRow={setSel} cols={[
        { key: 'n', head: t('Cliente', 'Customer'), cell: (u) => <div className="flex items-center gap-3"><Avatar src={u.avatar} name={u.name} size={34} /><div><div className="font-semibold">{u.name}</div><div className="text-[11.5px] text-mute">{u.email}</div></div></div> },
        { key: 'c', head: t('Città', 'City'), cell: (u) => u.city ?? '—' },
        { key: 'b', head: t('Prenotazioni', 'Bookings'), cell: (u) => s.bookings.filter((b) => b.customerId === u.id).length },
        { key: 'o', head: t('Ordini', 'Orders'), cell: (u) => s.orders.filter((o) => o.customerId === u.id).length },
        { key: 's', head: t('Speso', 'Spent'), cell: (u) => eur(Math.round(spent(u.id))) },
        { key: 'r', head: t('Iscritto', 'Joined'), cell: (u) => fmtDateShort(u.createdAt, s.lang) },
        { key: 'st', head: t('Stato', 'Status'), cell: (u) => (u.blocked ? <Badge tone="red">{t('Bloccato', 'Blocked')}</Badge> : <Badge tone="ok">{t('Attivo', 'Active')}</Badge>) },
      ]} />
      <Drawer open={!!cur} onClose={() => setSel(null)} title={cur?.name}>
        {cur && <div className="space-y-4 text-sm">
          <div className="flex items-center gap-4"><Avatar src={cur.avatar} name={cur.name} size={64} /><div><div>{cur.email}</div><div className="text-mute">{cur.phone}</div><div className="text-gold">{cur.loyaltyPoints ?? 0} {t('punti', 'points')}</div></div></div>
          <div className="label">{t('Ultime prenotazioni', 'Latest bookings')}</div>
          <ul className="space-y-2">{s.bookings.filter((b) => b.customerId === cur.id).slice(-5).reverse().map((b) => <li key={b.id} className="flex justify-between rounded-xl border border-smoke p-3"><span>{s.salons.find((x) => x.id === b.salonId)?.name} · {fmtDate(b.date, s.lang)}</span><Badge tone={BOOKING_STATUS[b.status].tone}>{BOOKING_STATUS[b.status][s.lang]}</Badge></li>)}</ul>
          {cur.blocked ? <Button full onClick={() => { s.setUserBlocked(cur.id, false); toast(t('Cliente sbloccato', 'Customer unblocked'), 'ok'); }}>{t('Sblocca', 'Unblock')}</Button> : <Button full variant="danger" onClick={() => { s.setUserBlocked(cur.id, true); toast(t('Cliente bloccato', 'Customer blocked')); }}>{t('Blocca account', 'Block account')}</Button>}
        </div>}
      </Drawer>
    </div>
  );
}

export function AdminReviews() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'reported' | 'hidden' | 'all'>('reported');
  const rows = s.reviews.filter((r) => (tab === 'reported' ? r.reported && !r.hidden : tab === 'hidden' ? r.hidden : true));
  return (
    <div>
      <PageHead title={t('Recensioni', 'Reviews')} sub={t('Le recensioni segnalate dai saloni o dagli utenti arrivano qui.', 'Reviews reported by salons or users land here.')} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'reported', label: t('Segnalate', 'Reported'), count: s.reviews.filter((r) => r.reported && !r.hidden).length }, { id: 'hidden', label: t('Nascoste', 'Hidden'), count: s.reviews.filter((r) => r.hidden).length }, { id: 'all', label: t('Tutte', 'All'), count: s.reviews.length }]} /></div>
      <Table<Review> rows={rows} empty={t('Nessuna recensione da gestire', 'No reviews to handle')} cols={[
        { key: 'a', head: t('Autore', 'Author'), cell: (r) => r.customerName },
        { key: 's', head: t('Salone', 'Salon'), cell: (r) => s.salons.find((x) => x.id === r.salonId)?.name },
        { key: 'r', head: t('Voto', 'Rating'), cell: (r) => <Stars value={r.rating} size={11} /> },
        { key: 't', head: t('Testo', 'Text'), cell: (r) => <span className="line-clamp-2 max-w-sm text-[13px]">{r.text}</span> },
        { key: 'x', head: '', cell: (r) => r.hidden ? <Button size="sm" variant="line" onClick={() => { s.setReviewHidden(r.id, false); toast(t('Recensione ripristinata', 'Review restored')); }}>{t('Ripristina', 'Restore')}</Button> : <div className="flex gap-2"><Button size="sm" variant="danger" onClick={() => { s.setReviewHidden(r.id, true); toast(t('Recensione nascosta', 'Review hidden')); }}>{t('Nascondi', 'Hide')}</Button>{r.reported && <Button size="sm" variant="ghost" onClick={() => { s.setReviewHidden(r.id, false); toast(t('Segnalazione archiviata', 'Report dismissed')); }}>{t('Ignora', 'Dismiss')}</Button>}</div> },
      ]} />
    </div>
  );
}
