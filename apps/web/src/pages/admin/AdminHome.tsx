import { ArrowRight, Calendar, Euro, FileCheck2, Store, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORY_LABELS, eur, fmtDateShort, SALON_STATUS, toISO, addDays, type SalonCategory } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Badge, Button, Img, Stat } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

export default function AdminHome() {
  const t = useT();
  const light = useStore((st) => st.theme) === 'light';
  const C = light ? { grid: '#E4DACE', axis: '#8C837B', tipBg: '#FFFFFF', tipText: '#1B1716', cursor: 'rgba(0,0,0,.04)' } : { grid: '#2E2A2B', axis: '#6F6862', tipBg: '#1A1819', tipText: '#F4EEE6', cursor: 'rgba(255,255,255,.03)' };
  const s = useStore();
  const since = toISO(addDays(new Date(), -30));
  const bk = s.bookings.filter((b) => b.date >= since && b.status !== 'cancelled');
  const ord = s.orders.filter((o) => o.createdAt.slice(0, 10) >= since);
  const gmvSvc = bk.filter((b) => b.status === 'completed').reduce((a, b) => a + b.total, 0);
  const gmvProd = ord.reduce((a, o) => a + o.total, 0);
  const commission = s.salons.reduce((a, x) => a + bk.filter((b) => b.salonId === x.id && b.status === 'completed').reduce((q, b) => q + b.total, 0) * x.commissionRate + s.subOrders.filter((so) => so.salonId === x.id && ord.some((o) => o.id === so.orderId)).reduce((q, so) => q + so.subtotal, 0) * x.commissionRate, 0);
  const active = s.salons.filter((x) => x.status === 'approved').length;
  const pending = s.applications.filter((a) => a.status === 'pending');
  const customers = s.users.filter((u) => u.role === 'customer');
  const newCust = customers.filter((u) => u.createdAt.slice(0, 10) >= since).length;
  const cities = Array.from(new Set(s.salons.filter((x) => x.status === 'approved').map((x) => x.city))).map((c) => ({
    city: c.replace('Reggio Calabria', 'Reggio C.').replace('Lamezia Terme', 'Lamezia').replace('Vibo Valentia', 'Vibo'),
    gmv: Math.round(bk.filter((b) => s.salons.find((x) => x.id === b.salonId)?.city === c && b.status === 'completed').reduce((a, b) => a + b.total, 0) + s.subOrders.filter((so) => s.salons.find((x) => x.id === so.salonId)?.city === c && ord.some((o) => o.id === so.orderId)).reduce((a, so) => a + so.subtotal, 0)),
  })).sort((a, b) => b.gmv - a.gmv);
  const cats = (Object.keys(CATEGORY_LABELS) as SalonCategory[]).map((c) => ({ cat: CATEGORY_LABELS[c][s.lang], n: bk.filter((b) => s.salons.find((x) => x.id === b.salonId)?.category === c).length })).sort((a, b) => b.n - a.n);
  const feed = [
    ...s.bookings.slice(-6).map((b) => ({ at: b.createdAt, text: `${b.customerName} ${t('ha prenotato da', 'booked at')} ${s.salons.find((x) => x.id === b.salonId)?.name}` })),
    ...s.orders.slice(0, 5).map((o) => ({ at: o.createdAt, text: `${t('Ordine', 'Order')} ${o.code} · ${eur(o.total)}` })),
    ...pending.map((a) => ({ at: a.submittedAt ?? '', text: `${s.salons.find((x) => x.id === a.salonId)?.name} ${t('ha inviato la richiesta', 'submitted an application')}` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9);
  const tip = { contentStyle: { background: C.tipBg, color: C.tipText, border: `1px solid ${C.grid}`, borderRadius: 14, fontSize: 12 }, cursor: { fill: C.cursor } };
  return (
    <div>
      <PageHead title={t('Panoramica', 'Overview')} sub={t('Ultimi 30 giorni', 'Last 30 days')} />
      {pending.length > 0 && (
        <Link to="/admin/richieste" className="mb-6 flex items-center gap-4 rounded-2xl border border-gold/35 bg-gold/5 p-4 transition hover:border-gold">
          <FileCheck2 className="text-gold" /><div className="flex-1"><b>{pending.length} {t('richieste venditori in attesa', 'seller applications waiting')}</b><div className="text-[12.5px] text-mute">{t('Obiettivo: risposta entro 48 ore', 'Target: reply within 48 hours')}</div></div><ArrowRight size={16} className="text-gold" />
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="GMV" value={eur(Math.round(gmvSvc + gmvProd))} delta={`${eur(Math.round(gmvSvc))} ${t('servizi', 'services')} · ${eur(Math.round(gmvProd))} shop`} icon={<TrendingUp size={16} />} tone="gold" />
        <Stat label={t('Ricavi commissioni', 'Commission revenue')} value={eur(Math.round(commission))} delta={t('su servizi e prodotti', 'on services and products')} icon={<Euro size={16} />} />
        <Stat label={t('Saloni attivi', 'Active salons')} value={active} delta={`${pending.length} ${t('in attesa', 'pending')}`} icon={<Store size={16} />} tone="gold" />
        <Stat label={t('Clienti', 'Customers')} value={customers.length} delta={`+${newCust} ${t('nuovi', 'new')} · ${bk.length} ${t('prenotazioni', 'bookings')}`} icon={<Users size={16} />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-3xl">{t('GMV per città', 'GMV by city')}</h3>
          <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={cities} margin={{ left: -6 }}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="city" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} /><Tooltip {...tip} formatter={(v: number) => eur(v)} /><Bar dataKey="gmv" radius={[8, 8, 0, 0]}>{cities.map((_, i) => <Cell key={i} fill={i === 0 ? '#B3202A' : '#CFAE6E'} fillOpacity={i === 0 ? 1 : 0.55} />)}</Bar></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card p-6">
          <h3 className="text-3xl">{t('Prenotazioni per categoria', 'Bookings by category')}</h3>
          <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={cats} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke={C.grid} horizontal={false} /><XAxis type="number" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="cat" stroke={C.axis} fontSize={12} tickLine={false} axisLine={false} width={110} /><Tooltip {...tip} /><Bar dataKey="n" radius={[0, 8, 8, 0]} fill="#CFAE6E" fillOpacity={0.7} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between"><h3 className="text-3xl">{t('Coda approvazioni', 'Approval queue')}</h3><Button size="sm" variant="line" to="/admin/richieste">{t('Tutte', 'All')}</Button></div>
          <ul className="mt-4 divide-y divide-smoke">
            {s.applications.filter((a) => a.status !== 'approved').map((a) => { const x = s.salons.find((y) => y.id === a.salonId)!; return (
              <li key={a.id}><Link to={`/admin/richieste/${x.id}`} className="flex items-center gap-4 py-3 hover:text-gold"><Img src={x.cover} className="h-11 w-11 rounded-xl" /><div className="flex-1"><div className="font-semibold">{x.name}</div><div className="text-[12px] text-mute">{x.city} · {a.submittedAt ? fmtDateShort(a.submittedAt, s.lang) : t('bozza', 'draft')}</div></div><Badge tone={SALON_STATUS[a.status].tone}>{SALON_STATUS[a.status][s.lang]}</Badge></Link></li>
            ); })}
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="text-3xl">{t('Attività', 'Activity')}</h3>
          <ul className="mt-4 space-y-3">{feed.map((f, i) => <li key={i} className="flex gap-3 text-sm"><Calendar size={14} className="mt-0.5 shrink-0 text-gold" /><span className="flex-1">{f.text}</span><span className="text-[11px] text-mute">{f.at ? fmtDateShort(f.at, s.lang) : ''}</span></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
