import { ArrowRight, Calendar, Gift, MapPin, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eur, fmtDate, ORDER_STATUS, parseISO, toISO } from '@shared/index';
import { useMe, useStore, useT } from '@/lib/store';
import { Badge, Button, Empty, Img } from '@/components/ui';
import { SalonCard } from '@/components/cards';

export default function Dashboard() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const today = toISO(new Date());
  const upcoming = s.bookings.filter((b) => b.customerId === me.id && b.date >= today && ['booked', 'confirmed'].includes(b.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const next = upcoming[0];
  const orders = s.orders.filter((o) => o.customerId === me.id).slice(0, 3);
  const favs = s.salons.filter((x) => s.favSalons.includes(x.id) && x.status === 'approved').slice(0, 2);
  const toReview = s.bookings.filter((b) => b.customerId === me.id && b.status === 'completed' && !b.reviewed);
  const days = next ? Math.round((parseISO(next.date).getTime() - parseISO(today).getTime()) / 864e5) : 0;
  const nextSalon = next && s.salons.find((x) => x.id === next.salonId)!;
  const pts = me.loyaltyPoints ?? 0;
  return (
    <div className="space-y-8">
      <div><div className="eyebrow">{t('Il tuo spazio', 'Your space')}</div><h1 className="mt-2 text-5xl md:text-6xl">{t('Ciao', 'Hi')} <em className="text-gold">{me.name.split(' ')[0]}</em>.</h1></div>
      {next && nextSalon ? (
        <div className="relative overflow-hidden rounded-[30px] border border-smoke on-dark">
          <Img src={nextSalon.cover} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />
          <div className="relative grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10">
            <div>
              <Badge>{t('Prossimo appuntamento', 'Next appointment')}</Badge>
              <h2 className="mt-4 text-5xl">{nextSalon.name}</h2>
              <p className="mt-2 text-ivory/80">{s.services.filter((x) => next.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-ivory/80"><span className="flex items-center gap-1.5"><Calendar size={14} className="text-gold" />{fmtDate(next.date, s.lang)} · {next.time}</span><span className="flex items-center gap-1.5"><MapPin size={14} className="text-gold" />{nextSalon.city}</span></div>
            </div>
            <div className="text-right"><div className="outline-num font-serif text-8xl leading-none">{days}</div><div className="text-[11px] uppercase tracking-[.2em] text-mute">{days === 0 ? t('è oggi!', 'it’s today!') : days === 1 ? t('giorno', 'day') : t('giorni', 'days')}</div><Button to="/account/prenotazioni" variant="line" size="sm" className="mt-4">{t('Gestisci', 'Manage')}</Button></div>
          </div>
        </div>
      ) : <Empty title={t('Nessun appuntamento in programma', 'No upcoming appointments')} text={t('Trova il tuo prossimo salone.', 'Find your next salon.')} action={<Button to="/esplora">{t('Esplora', 'Explore')}</Button>} />}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-6"><div className="flex items-center justify-between"><span className="eyebrow text-[10px]">{t('Punti fedeltà', 'Loyalty points')}</span><Gift size={18} className="text-gold" /></div><div className="mt-3 font-serif text-5xl">{pts}</div>
          <div className="mt-3 h-1.5 overflow-hidden rounded bg-smoke"><div className="h-full bg-gold" style={{ width: `${Math.min(100, (pts % 500) / 5)}%` }} /></div><p className="mt-2 text-[12px] text-mute">{500 - (pts % 500)} {t('punti al prossimo buono da €10', 'points to your next €10 voucher')}</p></div>
        <div className="card p-6"><span className="eyebrow text-[10px]">{t('Prenotazioni', 'Bookings')}</span><div className="mt-3 font-serif text-5xl">{upcoming.length}</div><p className="mt-2 text-[12px] text-mute">{t('in programma', 'upcoming')}</p><Link to="/account/prenotazioni" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[.12em] text-gold">{t('Vedi', 'View')} <ArrowRight size={13} /></Link></div>
        <div className="card p-6"><span className="eyebrow text-[10px]">{t('Da recensire', 'To review')}</span><div className="mt-3 font-serif text-5xl">{toReview.length}</div><p className="mt-2 text-[12px] text-mute">{t('+20 punti per ogni recensione', '+20 points per review')}</p><Link to="/account/prenotazioni?tab=past" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[.12em] text-gold">{t('Scrivi', 'Write')} <ArrowRight size={13} /></Link></div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-3xl">{t('Ordini recenti', 'Recent orders')}</h2><Link to="/account/ordini" className="text-[12px] text-gold">{t('Tutti', 'All')} →</Link></div>
        {orders.length === 0 ? <p className="text-sm text-mute">{t('Nessun ordine ancora.', 'No orders yet.')}</p> : orders.map((o) => {
          const subs = s.subOrders.filter((x) => x.orderId === o.id);
          return (
            <Link key={o.id} to={`/account/ordini/${o.id}`} className="flex flex-wrap items-center gap-4 border-t border-smoke py-4 first:border-0">
              <div className="flex -space-x-3">{subs.flatMap((x) => x.items).slice(0, 3).map((it, i) => <Img key={i} src={it.image} className="h-12 w-12 rounded-xl border-2 border-graphite" />)}</div>
              <div className="flex-1"><div className="text-sm font-semibold">{o.code}</div><div className="text-[12px] text-mute">{fmtDate(o.createdAt, s.lang)} · {eur(o.total)}</div></div>
              <div className="flex flex-wrap gap-1 max-sm:w-full sm:justify-end">{subs.map((x) => <Badge key={x.id} tone={ORDER_STATUS[x.status].tone}><Package size={11} />{ORDER_STATUS[x.status][s.lang]}</Badge>)}</div>
            </Link>
          );
        })}
      </div>

      {favs.length > 0 && (
        <div><div className="mb-4 flex items-center justify-between"><h2 className="text-3xl">{t('I tuoi preferiti', 'Your favourites')}</h2><Link to="/account/preferiti" className="text-[12px] text-gold">{t('Tutti', 'All')} →</Link></div><div className="grid gap-5 md:grid-cols-2">{favs.map((x) => <SalonCard key={x.id} salon={x} compact />)}</div></div>
      )}
    </div>
  );
}
