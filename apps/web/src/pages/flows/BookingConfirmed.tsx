import { motion } from 'framer-motion';
import { CalendarPlus, Check, MapPin, Navigation } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { eur, fmtDate, minutes, hhmm } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Button, Img, toast } from '@/components/ui';
import { NotFound } from '../public/StaticPages';

export default function BookingConfirmed() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return <NotFound />;
  const salon = s.salons.find((x) => x.id === b.salonId)!;
  const svs = s.services.filter((x) => b.serviceIds.includes(x.id));
  const staff = s.staff.find((x) => x.id === b.staffId);
  const prods = s.products.filter((p) => b.pickupProductIds?.includes(p.id));
  const ics = () => {
    const d = b.date.replace(/-/g, '');
    const st = b.time.replace(':', '') + '00';
    const en = hhmm(minutes(b.time) + b.durationMin).replace(':', '') + '00';
    const body = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${d}T${st}\nDTEND:${d}T${en}\nSUMMARY:${svs.map((x) => x.name).join(' + ')} · ${salon.name}\nLOCATION:${salon.address}, ${salon.city}\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = `mybeauty-${b.code}.ics`; a.click();
    toast(t('Evento calendario scaricato', 'Calendar event downloaded'), 'ok');
  };
  return (
    <div className="wrap max-w-4xl pb-24 pt-14">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-crimson shadow-[0_0_0_10px_rgba(179,32,42,.15)]"><Check size={36} strokeWidth={2.5} /></motion.div>
      <div className="mt-6 text-center">
        <div className="eyebrow">{t('Prenotazione', 'Booking')} {b.code}</div>
        <h1 className="mt-3 text-6xl md:text-7xl">{t('Ci vediamo', 'See you')} <em className="text-gold">{fmtDate(b.date, s.lang).split(' ').slice(0, 3).join(' ')}</em>.</h1>
        <p className="mt-3 text-mute">{t('Ti abbiamo inviato la conferma via email. Riceverai un promemoria 24 ore prima.', 'Confirmation sent by email. You’ll get a reminder 24h before.')}</p>
      </div>
      <div className="card mt-10 overflow-hidden md:grid md:grid-cols-[260px_1fr]">
        <Img src={salon.cover} className="h-48 md:h-full" />
        <div className="p-7">
          <h2 className="text-4xl">{salon.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-mute"><MapPin size={14} />{salon.address}, {salon.city}</p>
          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div><div className="label">{t('Quando', 'When')}</div>{fmtDate(b.date, s.lang)} · {b.time} ({b.durationMin} min){b.windowId ? ` · ${t('fascia speciale', 'special window')}` : ''}</div>
            <div><div className="label">{t('Operatore', 'Stylist')}</div>{staff?.name ?? '—'}</div>
            <div><div className="label">{t('Servizi', 'Services')}</div>{svs.map((x) => x.name).join(', ')}</div>
            <div><div className="label">{t('Pagamento', 'Payment')}</div>{b.paymentMode === 'in_salon' ? t('In salone', 'In salon') : `${t('Pagato online', 'Paid online')} ${eur(b.deposit)}`} · {t('Totale', 'Total')} {eur(b.total)}</div>
            {prods.length > 0 && <div className="sm:col-span-2"><div className="label">{t('Da ritirare in salone', 'Pickup in salon')}</div>{prods.map((p) => p.name).join(', ')}</div>}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button variant="line" onClick={ics}><CalendarPlus size={15} />{t('Aggiungi al calendario', 'Add to calendar')}</Button>
            <Button variant="line" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(salon.address + ' ' + salon.city)}`, '_blank')}><Navigation size={15} />{t('Indicazioni', 'Directions')}</Button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {s.userId ? <Button to="/account/prenotazioni">{t('Le mie prenotazioni', 'My bookings')}</Button> : <Button to="/registrati">{t('Crea un account', 'Create an account')}</Button>}
        <Button to="/shop" variant="line">{t('Visita lo shop', 'Visit the shop')}</Button>
      </div>
    </div>
  );
}
