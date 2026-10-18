import { Calendar, Clock, MapPin, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BOOKING_STATUS, eur, fmtDate, toISO, type Booking } from '@shared/index';
import { useMe, useStore, useT } from '@/lib/store';
import { Badge, Button, Empty, Img, Modal, StarInput, Tabs, Textarea, toast } from '@/components/ui';
import { SlotPicker } from '@/components/SlotPicker';
import { AHead } from './AccountRoutes';

export default function Bookings() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'up' | 'past' | 'cancelled'>((params.get('tab') as 'past') ?? 'up');
  const [resched, setResched] = useState<Booking | null>(null);
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [review, setReview] = useState<Booking | null>(null);
  const [rd, setRd] = useState({ date: '', time: null as string | null });
  const [rv, setRv] = useState({ rating: 5, text: '' });
  const today = toISO(new Date());
  const mine = s.bookings.filter((b) => b.customerId === me.id);
  const lists = {
    up: mine.filter((b) => b.date >= today && ['booked', 'confirmed', 'in_progress'].includes(b.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    past: mine.filter((b) => ['completed', 'no_show'].includes(b.status) || (b.date < today && b.status !== 'cancelled')).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    cancelled: mine.filter((b) => b.status === 'cancelled'),
  };
  const list = lists[tab];
  const hoursUntil = (b: Booking) => (new Date(`${b.date}T${b.time}`).getTime() - Date.now()) / 36e5;

  return (
    <div>
      <AHead title={t('Prenotazioni', 'Bookings')} action={<Button to="/esplora" variant="line">{t('Nuova prenotazione', 'New booking')}</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'up', label: t('In programma', 'Upcoming'), count: lists.up.length }, { id: 'past', label: t('Passate', 'Past'), count: lists.past.length }, { id: 'cancelled', label: t('Annullate', 'Cancelled'), count: lists.cancelled.length }]} />
      <div className="mt-6 space-y-4">
        {list.length === 0 && <Empty title={t('Niente qui', 'Nothing here')} text={tab === 'up' ? t('Prenota il tuo prossimo trattamento.', 'Book your next treatment.') : undefined} action={tab === 'up' ? <Button to="/esplora">{t('Esplora saloni', 'Explore salons')}</Button> : undefined} />}
        {list.map((b) => {
          const salon = s.salons.find((x) => x.id === b.salonId)!;
          const svs = s.services.filter((x) => b.serviceIds.includes(x.id));
          const staff = s.staff.find((x) => x.id === b.staffId);
          const st = BOOKING_STATUS[b.status];
          return (
            <div key={b.id} className="card flex flex-col gap-5 p-4 md:flex-row md:items-center md:p-5">
              <Img src={salon.cover} className="h-28 w-full shrink-0 rounded-2xl md:h-24 md:w-32" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={st.tone}>{st[s.lang]}</Badge><span className="text-[11.5px] text-mute">{b.code}</span>{b.windowId && <Badge tone="gold">{t('Fascia speciale', 'Special window')}</Badge>}</div>
                <Link to={`/salone/${salon.slug}`} className="mt-2 block font-serif text-3xl leading-tight hover:text-gold">{salon.name}</Link>
                <div className="text-sm text-ivory/80">{svs.map((x) => x.name).join(' + ')}{staff && <span className="text-mute"> · {t('con', 'with')} {staff.name}</span>}</div>
                <div className="mt-2 flex flex-wrap gap-4 text-[12.5px] text-mute"><span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(b.date, s.lang)}</span><span className="flex items-center gap-1.5"><Clock size={13} />{b.time} · {b.durationMin} min</span><span className="flex items-center gap-1.5"><MapPin size={13} />{salon.city}</span><span>{eur(b.total)}</span></div>
              </div>
              <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
                {tab === 'up' && <>
                  {!b.windowId && <Button size="sm" variant="line" onClick={() => { setResched(b); setRd({ date: b.date, time: null }); }}>{t('Sposta', 'Reschedule')}</Button>}
                  <Button size="sm" variant="danger" onClick={() => setCancel(b)}>{t('Annulla', 'Cancel')}</Button>
                </>}
                {tab === 'past' && b.status === 'completed' && !b.reviewed && <Button size="sm" variant="gold" onClick={() => { setReview(b); setRv({ rating: 5, text: '' }); }}>{t('Recensisci', 'Review')}</Button>}
                {tab !== 'up' && <Button size="sm" variant="line" to={`/prenota/${salon.slug}?s=${b.serviceIds.join(',')}`}><RotateCcw size={13} />{t('Prenota di nuovo', 'Book again')}</Button>}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!resched} onClose={() => setResched(null)} title={t('Sposta appuntamento', 'Reschedule')} wide
        footer={<><Button variant="ghost" onClick={() => setResched(null)}>{t('Chiudi', 'Close')}</Button><Button disabled={!rd.time} onClick={() => { s.rescheduleBooking(resched!.id, rd.date, rd.time!); toast(t('Appuntamento spostato ✓', 'Rescheduled ✓'), 'ok'); setResched(null); }}>{t('Conferma nuovo orario', 'Confirm new time')}</Button></>}>
        {resched && <SlotPicker salon={s.salons.find((x) => x.id === resched.salonId)!} duration={resched.durationMin} staffId={resched.staffId} date={rd.date} time={rd.time} onDate={(d) => setRd({ date: d, time: null })} onTime={(x) => setRd({ ...rd, time: x })} ignoreBookingId={resched.id} />}
      </Modal>

      <Modal open={!!cancel} onClose={() => setCancel(null)} title={t('Annullare la prenotazione?', 'Cancel booking?')}
        footer={<><Button variant="ghost" onClick={() => setCancel(null)}>{t('No, tienila', 'Keep it')}</Button><Button onClick={() => { s.cancelBooking(cancel!.id); toast(t('Prenotazione annullata', 'Booking cancelled')); setCancel(null); }}>{t('Sì, annulla', 'Yes, cancel')}</Button></>}>
        {cancel && <>
          <p className="text-sm text-ivory/85">{s.salons.find((x) => x.id === cancel.salonId)!.policies.cancellation}</p>
          {hoursUntil(cancel) < 24 ? <p className="mt-3 rounded-2xl border border-crimson/40 bg-crimson/10 p-3 text-sm text-err">{t('Mancano meno di 24 ore: l’eventuale caparra non sarà rimborsata.', 'Less than 24h left: any deposit will not be refunded.')}</p>
            : <p className="mt-3 rounded-2xl border border-ok/30 bg-ok/10 p-3 text-sm text-ok">{t('Cancellazione gratuita: riceverai il rimborso completo dell’eventuale caparra.', 'Free cancellation: any deposit will be fully refunded.')}</p>}
        </>}
      </Modal>

      <Modal open={!!review} onClose={() => setReview(null)} title={t('Com’è andata?', 'How was it?')}
        footer={<Button disabled={rv.text.trim().length < 10} onClick={() => { s.addReview({ salonId: review!.salonId, bookingId: review!.id, rating: rv.rating, text: rv.text }); s.updateProfile({ loyaltyPoints: (me.loyaltyPoints ?? 0) + 20 }); toast(t('Grazie! +20 punti', 'Thanks! +20 points'), 'ok'); setReview(null); }}>{t('Pubblica recensione', 'Publish review')}</Button>}>
        {review && <>
          <p className="text-sm text-mute">{s.salons.find((x) => x.id === review.salonId)!.name} · {fmtDate(review.date, s.lang)}</p>
          <div className="mt-4"><StarInput value={rv.rating} onChange={(n) => setRv({ ...rv, rating: n })} /></div>
          <Textarea className="mt-4" placeholder={t('Racconta la tua esperienza (min. 10 caratteri)', 'Tell us about it (min 10 characters)')} value={rv.text} onChange={(e) => setRv({ ...rv, text: e.target.value })} />
        </>}
      </Modal>
    </div>
  );
}
