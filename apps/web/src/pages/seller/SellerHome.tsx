import { AlertTriangle, ArrowRight, CalendarCheck, Check, Clock, Eye, FileCheck2, Package, Star, TrendingUp, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { addDays, BOOKING_STATUS, eur, fmtDate, minutes, toISO } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { Badge, Button, cn, Img, Stars, Stat } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

function StatusScreen() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const app = s.applications.find((a) => a.salonId === salon.id)!;
  const svc = s.services.filter((x) => x.salonId === salon.id).length;
  const prd = s.products.filter((x) => x.salonId === salon.id).length;
  const stf = s.staff.filter((x) => x.salonId === salon.id).length;
  const st = app.status;
  const steps = [
    { k: 'draft', l: t('Account creato', 'Account created'), done: true },
    { k: 'sent', l: t('Richiesta inviata', 'Application sent'), done: st !== 'draft' },
    { k: 'review', l: t('In revisione', 'Under review'), done: st === 'approved', active: st === 'pending' },
    { k: 'live', l: t('Approvato e online', 'Approved & live'), done: st === 'approved' },
  ];
  return (
    <div className="max-w-4xl">
      <PageHead title={<>{t('Benvenuto,', 'Welcome,')} <em className="text-gold">{salon.name}</em></>} sub={t('Il tuo salone sarà visibile ai clienti dopo l’approvazione.', 'Your salon becomes visible to clients after approval.')} />
      <div className={cn('card p-7', st === 'pending' && 'border-gold/40', (st === 'rejected' || st === 'needs_info') && 'border-warn/50')}>
        <div className="flex items-start gap-4">
          <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-full', st === 'pending' ? 'bg-gold/15 text-gold' : st === 'draft' ? 'bg-crimson/15 text-crimson' : 'bg-warn/15 text-warn')}>
            {st === 'pending' ? <Clock /> : st === 'draft' ? <FileCheck2 /> : st === 'rejected' ? <XCircle /> : <AlertTriangle />}
          </span>
          <div className="flex-1">
            <h2 className="text-3xl">{st === 'pending' ? t('Richiesta in revisione', 'Application under review') : st === 'draft' ? t('Completa la richiesta di approvazione', 'Complete your approval request') : st === 'rejected' ? t('Richiesta non approvata', 'Application not approved') : t('Servono altre informazioni', 'More information needed')}</h2>
            <p className="mt-1 text-sm text-mute">{st === 'pending' ? t('Il nostro team verifica documenti e dati entro 48 ore lavorative. Riceverai una notifica.', 'Our team checks documents within 48 working hours. You’ll be notified.') : st === 'draft' ? t('Servono dati aziendali, foto, documenti e IBAN. Ci vogliono circa 10 minuti.', 'We need business data, photos, documents and IBAN. Takes about 10 minutes.') : app.rejectionReason}</p>
            {st !== 'pending' && <Button to="/seller/richiesta" className="mt-5">{st === 'draft' ? t('Compila la richiesta', 'Start application') : t('Correggi e invia di nuovo', 'Fix and resubmit')} <ArrowRight size={15} /></Button>}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-4">
          {steps.map((x, i) => (
            <div key={x.k} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={cn('absolute right-1/2 top-4 h-[2px] w-full', x.done || x.active ? 'bg-gold' : 'bg-smoke')} />}
              <span className={cn('relative z-10 grid h-8 w-8 place-items-center rounded-full border-2', x.done ? 'border-gold bg-gold text-coal' : x.active ? 'animate-pulse border-gold bg-graphite text-gold' : 'border-smoke bg-graphite')}>{x.done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              <span className={cn('mt-2 text-[12px]', x.done || x.active ? 'text-ivory' : 'text-mute')}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>
      <h3 className="mt-10 text-3xl">{t('Intanto prepara il salone', 'Meanwhile, prepare your salon')}</h3>
      <p className="mt-1 text-sm text-mute">{t('Servizi e prodotti restano in bozza e vanno online appena approvato.', 'Services and products stay as drafts and go live once approved.')}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[[t('Servizi', 'Services'), svc, '/seller/servizi', t('Aggiungi il listino', 'Add your price list')], [t('Prodotti', 'Products'), prd, '/seller/prodotti', t('Carica i prodotti da vendere', 'Upload products to sell')], ['Staff', stf, '/seller/staff', t('Aggiungi il team', 'Add your team')]].map(([l, n, to, sub]) => (
          <Link key={String(l)} to={String(to)} className="card card-hover p-6"><div className="flex items-center justify-between"><span className="eyebrow text-[10px]">{l}</span>{Number(n) > 0 && <Check size={16} className="text-ok" />}</div><div className="mt-2 font-serif text-5xl">{n}</div><div className="mt-1 text-[12.5px] text-mute">{sub} →</div></Link>
        ))}
      </div>
      <Link to={`/salone/${salon.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm text-gold hover:underline"><Eye size={15} />{t('Anteprima della vetrina', 'Preview storefront')}</Link>
    </div>
  );
}

export default function SellerHome() {
  const t = useT();
  const light = useStore((st) => st.theme) === 'light';
  const C = light ? { grid: '#E4DACE', axis: '#8C837B', tipBg: '#FFFFFF', tipText: '#1B1716', cursor: 'rgba(0,0,0,.04)' } : { grid: '#2E2A2B', axis: '#6F6862', tipBg: '#1A1819', tipText: '#F4EEE6', cursor: 'rgba(255,255,255,.03)' };
  const s = useStore();
  const salon = useMySalon()!;
  if (salon.status !== 'approved') return <StatusScreen />;
  const today = toISO(new Date());
  const mine = s.bookings.filter((b) => b.salonId === salon.id);
  const subs = s.subOrders.filter((x) => x.salonId === salon.id);
  const monthKey = today.slice(0, 7);
  const svcRev = mine.filter((b) => b.status === 'completed' && b.date.startsWith(monthKey)).reduce((a, b) => a + b.total, 0);
  const prodRev = subs.filter((x) => s.orders.find((o) => o.id === x.orderId)?.createdAt.startsWith(monthKey) && x.status !== 'cancelled').reduce((a, x) => a + x.subtotal, 0);
  const todays = mine.filter((b) => b.date === today && b.status !== 'cancelled').sort((a, b) => minutes(a.time) - minutes(b.time));
  const toShip = subs.filter((x) => ['received', 'preparing'].includes(x.status));
  const lowStock = s.products.filter((p) => p.salonId === salon.id && p.status === 'published' && p.stock <= 5);
  const inReview = s.products.filter((p) => p.salonId === salon.id && p.status === 'review');
  const reviews = s.reviews.filter((r) => r.salonId === salon.id && !r.productId).slice(0, 3);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(new Date(), -7 * (7 - i)); const start = addDays(end, -6);
    const [a, b] = [toISO(start), toISO(end)];
    return {
      w: `${start.getDate()}/${start.getMonth() + 1}`,
      servizi: mine.filter((x) => x.status === 'completed' && x.date >= a && x.date <= b).reduce((acc, x) => acc + x.total, 0),
      prodotti: subs.filter((x) => { const d = s.orders.find((o) => o.id === x.orderId)?.createdAt.slice(0, 10) ?? ''; return d >= a && d <= b; }).reduce((acc, x) => acc + x.subtotal, 0),
    };
  });
  return (
    <div>
      <PageHead title={<>{t('Buongiorno', 'Good morning')}, <em className="text-gold">{s.users.find((u) => u.id === s.userId)?.name.split(' ')[0]}</em></>} sub={fmtDate(today, s.lang)} actions={<><Button variant="line" to={`/salone/${salon.slug}`}><Eye size={15} />{t('Vetrina', 'Storefront')}</Button><Button to="/seller/agenda">Agenda</Button></>} />
      {inReview.length > 0 && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm"><Clock size={16} className="text-gold" />{inReview.length} {inReview.length === 1 ? t('prodotto in attesa di approvazione dall’admin', 'product awaiting admin approval') : t('prodotti in attesa di approvazione dall’admin', 'products awaiting admin approval')}<Link to="/seller/prodotti" className="ml-auto text-gold">{t('Vedi', 'View')} →</Link></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('Incasso del mese', 'Revenue this month')} value={eur(svcRev + prodRev)} delta={`${eur(svcRev)} ${t('servizi', 'services')} · ${eur(prodRev)} ${t('prodotti', 'products')}`} tone="gold" icon={<TrendingUp size={16} />} />
        <Stat label={t('Appuntamenti oggi', 'Appointments today')} value={todays.length} delta={`${todays.filter((b) => b.status === 'completed').length} ${t('completati', 'completed')}`} icon={<CalendarCheck size={16} />} />
        <Stat label={t('Ordini da evadere', 'Orders to fulfil')} value={toShip.length} delta={toShip.length ? t('Da spedire o preparare', 'To ship or prepare') : t('Tutto evaso', 'All done')} tone={toShip.length ? 'red' : 'ok'} icon={<Package size={16} />} />
        <Stat label={t('Valutazione', 'Rating')} value={salon.rating.toFixed(1)} delta={`${salon.reviewCount} ${t('recensioni', 'reviews')}`} icon={<Star size={16} />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between"><h3 className="text-3xl">{t('Incassi · ultime 8 settimane', 'Revenue · last 8 weeks')}</h3><div className="flex gap-4 text-[12px]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-crimson" />{t('Servizi', 'Services')}</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />{t('Prodotti', 'Products')}</span></div></div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={weeks} margin={{ left: -10, right: 8, top: 8 }}>
                <defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B3202A" stopOpacity={0.45} /><stop offset="1" stopColor="#B3202A" stopOpacity={0} /></linearGradient><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFAE6E" stopOpacity={0.35} /><stop offset="1" stopColor="#CFAE6E" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="w" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                <Tooltip contentStyle={{ background: C.tipBg, color: C.tipText, border: `1px solid ${C.grid}`, borderRadius: 14, fontSize: 12 }} formatter={(v: number) => eur(v)} />
                <Area type="monotone" dataKey="servizi" stroke="#B3202A" strokeWidth={2} fill="url(#gs)" />
                <Area type="monotone" dataKey="prodotti" stroke="#CFAE6E" strokeWidth={2} fill="url(#gp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between"><h3 className="text-3xl">{t('Oggi', 'Today')}</h3><Link to="/seller/agenda" className="text-[12px] text-gold">Agenda →</Link></div>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
            {todays.length === 0 && <li className="text-sm text-mute">{t('Nessun appuntamento oggi.', 'No appointments today.')}</li>}
            {todays.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl border border-smoke px-3 py-2.5">
                <span className="w-12 font-serif text-xl text-gold">{b.time}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{b.customerName}</div><div className="truncate text-[11.5px] text-mute">{s.services.filter((x) => b.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')}</div></div>
                <Badge tone={BOOKING_STATUS[b.status].tone} className="!text-[9px]">{BOOKING_STATUS[b.status][s.lang]}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h3 className="text-2xl">{t('Ordini da evadere', 'Orders to fulfil')}</h3>
          <ul className="mt-3 space-y-2">{toShip.slice(0, 5).map((x) => <li key={x.id}><Link to={`/seller/ordini/${x.id}`} className="flex items-center justify-between rounded-xl border border-smoke px-3 py-2 text-sm hover:border-gold/40"><span>{x.code}</span><span className="text-mute">{x.shippingMethod === 'pickup' ? t('Ritiro', 'Pickup') : t('Spedizione', 'Ship')} · {eur(x.subtotal)}</span></Link></li>)}{toShip.length === 0 && <li className="text-sm text-mute">{t('Nessun ordine in attesa.', 'No pending orders.')}</li>}</ul>
        </div>
        <div className="card p-6">
          <h3 className="text-2xl">{t('Scorte basse', 'Low stock')}</h3>
          <ul className="mt-3 space-y-2">{lowStock.map((p) => <li key={p.id}><Link to={`/seller/prodotti/${p.id}`} className="flex items-center gap-3 text-sm"><Img src={p.images[0]} className="h-10 w-10 rounded-lg" /><span className="flex-1 truncate">{p.name}</span><Badge tone="red">{p.stock} pz</Badge></Link></li>)}{lowStock.length === 0 && <li className="text-sm text-mute">{t('Scorte ok.', 'Stock OK.')}</li>}</ul>
        </div>
        <div className="card p-6">
          <h3 className="text-2xl">{t('Ultime recensioni', 'Latest reviews')}</h3>
          <ul className="mt-3 space-y-3">{reviews.map((r) => <li key={r.id} className="text-sm"><div className="flex items-center justify-between"><b>{r.customerName}</b><Stars value={r.rating} size={11} /></div><p className="line-clamp-2 text-[12.5px] text-mute">{r.text}</p></li>)}</ul>
          <Link to="/seller/recensioni" className="mt-3 inline-block text-[12px] text-gold">{t('Rispondi', 'Reply')} →</Link>
        </div>
      </div>
    </div>
  );
}
