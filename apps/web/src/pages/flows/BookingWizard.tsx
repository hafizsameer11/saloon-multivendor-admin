import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Clock, CreditCard, Lock, Store, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addDays, availableSlots, bookingTotal, dayShort, eur, fmtDate, monthShort, toISO, windowCheck, windowPlacesLeft, windowText, type PaymentMode, type TimeWindow } from '@shared/index';
import { apiMode, slotBookings, slotWindows, useMe, useStore, useT, useWindows } from '@/lib/store';
import { PaymentPanel } from '@/components/PaymentPanel';
import { ApiError, errorText } from '@shared/api/client';
import type { PaymentStart } from '@shared/api/remote';
import { Avatar, Button, Checkbox, cn, Field, Img, Input, Stepper, Textarea, toast } from '@/components/ui';
import { NotFound } from '../public/StaticPages';
import { ThumbStack } from '@/components/Gallery';

export default function BookingWizard() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const t = useT();
  const s = useStore();
  const me = useMe();
  const nav = useNavigate();
  const salon = s.salons.find((x) => x.slug === slug && x.status === 'approved');
  const services = useMemo(() => s.services.filter((x) => x.salonId === salon?.id && x.active), [s.services, salon]);
  const [picked, setPicked] = useState<string[]>(() => (params.get('s') ?? '').split(',').filter(Boolean));
  const [staffId, setStaffId] = useState<string | null>(params.get('staff'));
  const [date, setDate] = useState(params.get('data') ?? toISO(new Date()));
  const [time, setTime] = useState<string | null>(params.get('ora'));
  /** booking a place in a salon time window instead of a normal slot */
  const [windowId, setWindowId] = useState<string | null>(params.get('fascia'));
  const allWindows = useWindows();
  const [winFirst] = useState(() => !!params.get('fascia')); // came from the salon page's window list
  const [extras, setExtras] = useState<string[]>([]);
  const [step, setStep] = useState(() => (params.get('fascia') ? 0 : params.get('ora') && params.get('s') ? 3 : params.get('s') ? 1 : 0));
  const [name, setName] = useState(me?.name ?? '');
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [pay, setPay] = useState<PaymentMode>('in_salon');
  const [policy, setPolicy] = useState(false);
  const [card, setCard] = useState({ n: '', e: '', c: '' });
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<{ bookingId: string; payment: PaymentStart } | null>(null);

  useEffect(() => { const p = new URLSearchParams(); if (picked.length) p.set('s', picked.join(',')); if (staffId) p.set('staff', staffId); p.set('data', date); if (time) p.set('ora', time); if (windowId) p.set('fascia', windowId); setParams(p, { replace: true }); }, [picked, staffId, date, time, windowId]);
  useEffect(() => { if (me) { setName((n) => n || me.name); setPhone((p) => p || me.phone); } }, [me]);

  // a chosen window fixes date + time (also when arriving from the salon page with ?fascia=)
  useEffect(() => { const w = allWindows.find((x) => x.id === windowId); if (w) { setDate(w.date); setTime(w.start); } }, [windowId, allWindows]);

  useEffect(() => { if (step === 2) setTimeout(() => document.querySelector('[data-day-on="1"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }), 60); }, [step, date]);
  if (!salon) return <NotFound />;
  const salonWindows = allWindows.filter((w) => w.salonId === salon.id);
  const win = windowId ? salonWindows.find((w) => w.id === windowId) ?? null : null;
  const sel = services.filter((x) => picked.includes(x.id));
  const winProblem = win ? windowCheck(win, sel) : null;
  /** windows a customer could book with the chosen services (and chosen stylist, if any) */
  const fits = (w: TimeWindow) => !windowCheck(w, sel) && (!staffId || !w.staffId || w.staffId === staffId);
  const dayWindows = salonWindows.filter((w) => w.date === date && fits(w));
  const otherWindows = salonWindows.filter((w) => w.date !== date && fits(w)).slice(0, 4);
  // 2 weeks by default; longer when the chosen date (or a window) is further away
  const stripDays = Math.min(92, Math.max(14, Math.round((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 864e5) + 4));
  const pickWindow = (w: TimeWindow) => { setWindowId(w.id); setDate(w.date); setTime(w.start); };
  const clearWindow = () => { setWindowId(null); setTime(null); };
  const winStaff = win?.staffId ? s.staff.find((x) => x.id === win.staffId) : null;
  const tot = bookingTotal(sel);
  const staff = s.staff.filter((x) => x.salonId === salon.id && x.active && sel.every((sv) => x.serviceIds.includes(sv.id)));
  const products = s.products.filter((p) => p.salonId === salon.id && p.status === 'published' && p.stock > 0);
  const extrasTotal = products.filter((p) => extras.includes(p.id)).reduce((a, p) => a + p.price, 0);
  const busyList = slotBookings(s);
  const slots = availableSlots({ salon, date, durationMin: Math.max(tot.duration, 15), staffId, staff: s.staff, bookings: busyList, windows: slotWindows(s), services: sel });
  const mustSignIn = apiMode && (!me || me.role !== 'customer');
  const steps = [t('Servizi', 'Services'), t('Operatore', 'Stylist'), t('Data e ora', 'Date & time'), t('Prodotti', 'Products'), t('Conferma', 'Confirm')];
  const needDeposit = tot.deposit > 0;
  const canNext = [sel.length > 0 && (!win || !winProblem), true, win ? !winProblem : !!time, true, name.trim().length > 2 && phone.trim().length > 5 && policy && !mustSignIn && (pay === 'in_salon' || apiMode || (card.n.replace(/\s/g, '').length >= 12 && card.e.length >= 4 && card.c.length >= 3))][step];
  const staffObj = s.staff.find((x) => x.id === staffId);

  const confirmApi = async () => {
    setBusy(true);
    try {
      if (me && !me.phone && phone.trim()) s.updateProfile({ phone: phone.trim() });
      const r = await s.apiCreateBooking!({ salonId: salon.id, serviceIds: picked, staffId: win ? null : staffId, ...(win ? { windowId: win.id } : { date, time: time! }), paymentMode: pay, notes: notes || undefined, pickupProductIds: extras });
      if (r.payment) setPaying({ bookingId: r.booking.id, payment: r.payment });
      else { toast(t('Prenotazione confermata!', 'Booking confirmed!'), 'ok'); nav(`/prenotazione/${r.booking.id}`); }
    } catch (e) {
      if (e instanceof ApiError && e.code.startsWith('window_')) { toast(errorText(e), 'red'); clearWindow(); setStep(2); s.refresh?.(); }
      else if (e instanceof ApiError && e.code === 'slot_taken') { toast(t('Qualcuno ha appena preso questo orario: scegline un altro.', 'Someone just took this time: pick another.'), 'red'); setTime(null); setStep(2); s.refresh?.(); }
      else toast(errorText(e), 'red');
    } finally { setBusy(false); }
  };

  const confirm = () => {
    if (apiMode) { void confirmApi(); return; }
    setBusy(true);
    setTimeout(() => {
      if (win) {
        const b = s.createBooking({ salonId: salon.id, serviceIds: picked, staffId: win.staffId, windowId: win.id, date: win.date, time: win.start, durationMin: tot.duration, total: tot.price, deposit: pay === 'deposit' ? tot.deposit : pay === 'card' ? tot.price : 0, paymentMode: pay, notes, name, phone, pickupProductIds: extras });
        toast(t('Prenotazione confermata!', 'Booking confirmed!'), 'ok');
        nav(`/prenotazione/${b.id}`);
        return;
      }
      const assigned = staffId ?? (staff.find((p) => !s.bookings.some((b) => b.staffId === p.id && b.date === date && b.time === time && b.status !== 'cancelled'))?.id ?? staff[0]?.id ?? null);
      const b = s.createBooking({ salonId: salon.id, serviceIds: picked, staffId: assigned, date, time: time!, durationMin: tot.duration, total: tot.price, deposit: pay === 'deposit' ? tot.deposit : pay === 'card' ? tot.price : 0, paymentMode: pay, notes, name, phone, pickupProductIds: extras });
      toast(t('Prenotazione confermata!', 'Booking confirmed!'), 'ok');
      nav(`/prenotazione/${b.id}`);
    }, 700);
  };

  if (paying) return (
    <div className="wrap max-w-lg pb-24 pt-12">
      <div className="eyebrow mb-3">{salon.name} · {fmtDate(date, s.lang)} {time}</div>
      <PaymentPanel payment={paying.payment} title={pay === 'deposit' ? t('Caparra', 'Deposit') : t('Pagamento', 'Payment')}
        onPaid={() => { toast(t('Pagamento riuscito. Prenotazione confermata!', 'Payment done. Booking confirmed!'), 'ok'); nav(`/prenotazione/${paying.bookingId}`); }}
        onCancel={() => { s.cancelBooking(paying.bookingId); setPaying(null); }} />
    </div>
  );

  return (
    <div className="wrap pb-24 pt-8">
      <Link to={`/salone/${salon.slug}`} className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-gold"><ArrowLeft size={14} />{salon.name}</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <Stepper steps={steps} current={step} />
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="mt-8">
              {step === 0 && (
                <>
                  <h1 className="text-5xl">{t('Cosa desideri?', 'What would you like?')}</h1>
                  <p className="mt-2 text-sm text-mute">{t('Puoi scegliere più servizi: li prenotiamo uno dopo l’altro.', 'Pick several services: we’ll book them back to back.')}</p>
                  {win && <WindowBanner w={win} onClear={clearWindow} problem={sel.length ? winProblem : null} />}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {services.filter((x) => !win || win.serviceIds.includes(x.id)).map((x) => {
                      const on = picked.includes(x.id);
                      return (
                        <button key={x.id} onClick={() => setPicked(on ? picked.filter((p) => p !== x.id) : [...picked, x.id])} className={cn('flex items-center gap-4 rounded-[22px] border p-3 text-left transition', on ? 'border-gold bg-gold/[.07]' : 'border-smoke hover:border-gold/40')}>
                          <ThumbStack images={x.images?.length ? x.images : [x.image]} className="h-16 w-16 rounded-2xl" />
                          <div className="flex-1"><div className="font-serif text-xl leading-tight">{x.name}</div><div className="text-[12px] text-mute">{x.durationMin} min · {eur(x.price)}</div></div>
                          <span className={cn('grid h-6 w-6 place-items-center rounded-full border', on ? 'border-gold bg-gold text-coal' : 'border-smoke')}>{on && <Check size={14} strokeWidth={3} />}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h1 className="text-5xl">{t('Con chi?', 'With whom?')}</h1>
                  <p className="mt-2 text-sm text-mute">{t('Mostriamo solo chi esegue tutti i servizi scelti.', 'Only showing staff who perform all chosen services.')}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button onClick={() => { setStaffId(null); setTime(null); }} className={cn('flex items-center gap-4 rounded-[22px] border p-4 text-left', !staffId ? 'border-gold bg-gold/[.07]' : 'border-smoke hover:border-gold/40')}>
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-crimson/15 font-serif text-2xl italic text-gold">∗</span>
                      <div><div className="font-serif text-2xl">{t('Primo disponibile', 'First available')}</div><div className="text-[12px] text-mute">{t('Più orari tra cui scegliere', 'More times to choose from')}</div></div>
                    </button>
                    {staff.map((m) => (
                      <button key={m.id} onClick={() => { setStaffId(m.id); setTime(null); }} className={cn('flex items-center gap-4 rounded-[22px] border p-4 text-left', staffId === m.id ? 'border-gold bg-gold/[.07]' : 'border-smoke hover:border-gold/40')}>
                        <Avatar src={m.photo} name={m.name} size={64} />
                        <div><div className="font-serif text-2xl">{m.name}</div><div className="text-[12px] text-mute">{m.role}</div></div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h1 className="text-5xl">{t('Quando?', 'When?')}</h1>
                  <div className="scroll-x mt-6 gap-2">
                    {Array.from({ length: stripDays }, (_, i) => addDays(new Date(), i)).map((d) => {
                      const iso = toISO(d);
                      const hasWin = salonWindows.some((w) => w.date === iso && fits(w));
                      const closed = !hasWin && availableSlots({ salon, date: iso, durationMin: 30, staffId, staff: s.staff, bookings: busyList, windows: slotWindows(s) }).length === 0;
                      return (
                        <button key={iso} data-day-on={date === iso ? '1' : undefined} disabled={closed} onClick={() => { setDate(iso); clearWindow(); }}
                          className={cn('flex w-[74px] shrink-0 flex-col items-center rounded-2xl border py-3 transition disabled:opacity-30', date === iso ? 'border-crimson bg-crimson' : 'border-smoke hover:border-gold/50')}>
                          <span className={cn('text-[10px] uppercase tracking-[.15em]', date === iso ? 'text-ivory/80' : 'text-mute')}>{dayShort(d, s.lang)}</span>
                          <span className="font-serif text-3xl leading-tight">{d.getDate()}</span>
                          <span className={cn('text-[10px] uppercase', date === iso ? 'text-ivory/80' : 'text-mute')}>{closed ? t('chiuso', 'closed') : monthShort(d, s.lang)}</span>
                          {hasWin && <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', date === iso ? 'bg-snow' : 'bg-gold')} title={t('Fascia speciale', 'Special window')} />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-sm text-mute">{fmtDate(date, s.lang)} · {staffObj ? staffObj.name : t('primo disponibile', 'first available')} · {tot.duration} min</div>
                  {dayWindows.length > 0 && (
                    <div className="mt-5">
                      <div className="label">{t('Fasce speciali del salone', 'Salon special windows')}</div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {dayWindows.map((w) => <WindowCard key={w.id} w={w} on={windowId === w.id} onPick={() => pickWindow(w)} />)}
                      </div>
                    </div>
                  )}
                  {slots.length === 0 ? (dayWindows.length ? null : <p className="mt-6 rounded-2xl border border-smoke p-6 text-mute">{t('Il salone è chiuso in questa data.', 'The salon is closed on this date.')}</p>) : (
                    <>
                      {dayWindows.length > 0 && <div className="label mt-6">{t('Orari normali', 'Regular times')}</div>}
                      <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-5', dayWindows.length ? 'mt-0' : 'mt-4')}>
                        {slots.map((x) => (
                          <button key={x.time} disabled={!x.free} onClick={() => { setWindowId(null); setTime(x.time); }} className={cn('rounded-xl border py-3 text-sm transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-25', !windowId && time === x.time ? 'border-gold bg-gold/10 text-gold' : 'border-smoke hover:border-gold/50')}>{x.time}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {otherWindows.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[.05] p-4">
                      <div className="text-[13px]">{t('Fasce speciali in altri giorni per questi servizi:', 'Special windows on other days for these services:')}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {otherWindows.map((w) => (
                          <button key={w.id} onClick={() => pickWindow(w)} className="rounded-full border border-gold/40 px-3 py-1.5 text-[12.5px] hover:bg-gold/10">
                            {fmtDate(w.date, s.lang)} · {w.start}–{w.end} · {windowPlacesLeft(w)} {windowPlacesLeft(w) === 1 ? t('posto', 'place') : t('posti', 'places')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  <h1 className="text-5xl">{t('Vuoi aggiungere un prodotto?', 'Add a product?')}</h1>
                  <p className="mt-2 text-sm text-mute">{t('Facoltativo. Lo trovi pronto al tuo appuntamento e lo paghi direttamente in salone.', 'Optional. It’ll be ready at your appointment; pay for it in the salon.')}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {products.slice(0, 6).map((p) => {
                      const on = extras.includes(p.id);
                      return (
                        <button key={p.id} onClick={() => setExtras(on ? extras.filter((x) => x !== p.id) : [...extras, p.id])} className={cn('flex items-center gap-4 rounded-[22px] border p-3 text-left', on ? 'border-gold bg-gold/[.07]' : 'border-smoke hover:border-gold/40')}>
                          <Img src={p.images[0]} className="h-16 w-16 shrink-0 rounded-2xl" />
                          <div className="flex-1"><div className="text-[10px] uppercase tracking-[.18em] text-mute">{p.brand}</div><div className="font-serif text-xl leading-tight">{p.name}</div><div className="text-[12px] text-gold">{eur(p.price)}</div></div>
                          <span className={cn('grid h-6 w-6 place-items-center rounded-full border', on ? 'border-gold bg-gold text-coal' : 'border-smoke')}>{on && <Check size={14} strokeWidth={3} />}</span>
                        </button>
                      );
                    })}
                    {products.length === 0 && <p className="text-mute">{t('Questo salone non vende prodotti.', 'This salon doesn’t sell products.')}</p>}
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <h1 className="text-5xl">{t('Ultimo passo.', 'Last step.')}</h1>
                  {mustSignIn && (
                    <div className="mt-5 rounded-2xl border border-crimson/50 bg-crimson/10 p-4 text-sm">
                      {me ? t('Le prenotazioni si fanno con un account cliente.', 'Bookings need a customer account.') : t('Per confermare serve un account: accedi o registrati, poi torni qui con tutto già selezionato.', 'You need an account to confirm: sign in or sign up, then come back with everything still selected.')}
                      {!me && <div className="mt-3 flex gap-2"><Button size="sm" to={`/accedi?next=${encodeURIComponent(`/prenota/${salon.slug}?${params.toString()}`)}`}>{t('Accedi', 'Sign in')}</Button><Button size="sm" variant="line" to={`/registrati?next=${encodeURIComponent(`/prenota/${salon.slug}?${params.toString()}`)}`}>{t('Registrati', 'Sign up')}</Button></div>}
                    </div>
                  )}
                  {!me && !apiMode && (
                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm">{t('Accedi per ritrovare la prenotazione nel tuo account e ricevere i promemoria.', 'Sign in to keep this booking in your account and get reminders.')}</p>
                      <Button size="sm" variant="line" to={`/accedi?next=${encodeURIComponent(`/prenota/${salon.slug}?${params.toString()}`)}`}>{t('Accedi', 'Sign in')}</Button>
                    </div>
                  )}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label={t('Nome e cognome', 'Full name')}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    <Field label={t('Telefono', 'Phone')}><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39" /></Field>
                    <Field label={t('Note per il salone (facoltativo)', 'Notes for the salon (optional)')} className="sm:col-span-2"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('Es. sfumatura bassa, allergia al nichel…', 'E.g. low fade, nickel allergy…')} className="min-h-[80px]" /></Field>
                  </div>
                  <div className="mt-6 label">{t('Pagamento', 'Payment')}</div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([['in_salon', <Store key="1" size={18} />, t('Paga in salone', 'Pay in salon'), t('Nessun anticipo', 'Nothing now')], ...(needDeposit ? [['deposit', <Lock key="2" size={18} />, t('Caparra online', 'Online deposit'), eur(tot.deposit)]] : []), ['card', <CreditCard key="3" size={18} />, t('Paga ora', 'Pay now'), eur(tot.price)]] as [PaymentMode, JSX.Element, string, string][]).map(([k, i, l, sub]) => (
                      <button key={k} onClick={() => setPay(k)} className={cn('rounded-2xl border p-4 text-left transition', pay === k ? 'border-gold bg-gold/[.07]' : 'border-smoke hover:border-gold/40')}><span className="text-gold">{i}</span><div className="mt-2 text-sm font-semibold">{l}</div><div className="text-[12px] text-mute">{sub}</div></button>
                    ))}
                  </div>
                  {pay !== 'in_salon' && apiMode && <p className="mt-4 flex items-center gap-2 text-[12.5px] text-mute"><Lock size={13} />{t('Dopo la conferma inserirai la carta nel modulo sicuro di Stripe. L’orario resta bloccato per 15 minuti.', 'After confirming you’ll enter your card in Stripe’s secure form. The time is held for 15 minutes.')}</p>}
                  {pay !== 'in_salon' && !apiMode && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-smoke p-4 sm:grid-cols-[2fr_1fr_1fr]">
                      <Field label={t('Numero carta', 'Card number')}><Input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.n} onChange={(e) => setCard({ ...card, n: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} /></Field>
                      <Field label="MM/AA"><Input placeholder="12/28" value={card.e} onChange={(e) => setCard({ ...card, e: e.target.value.slice(0, 5) })} /></Field>
                      <Field label="CVC"><Input placeholder="123" value={card.c} onChange={(e) => setCard({ ...card, c: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Field>
                      <p className="flex items-center gap-2 text-[11.5px] text-mute sm:col-span-3"><Lock size={12} />{t('Demo: nessun addebito reale. In produzione il pagamento passa da Stripe.', 'Demo: no real charge. In production payment goes through Stripe.')}</p>
                    </div>
                  )}
                  <div className="mt-6"><Checkbox checked={policy} onChange={setPolicy}>{salon.policies.cancellation} {salon.policies.noShow}</Checkbox></div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-10 flex items-center justify-between border-t border-smoke pt-6">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(win && winFirst && step === 3 ? 0 : step - 1)}><ArrowLeft size={15} />{t('Indietro', 'Back')}</Button>
            {step < 4 ? <Button disabled={!canNext} onClick={() => setStep(win && winFirst && step === 0 ? 3 : step + 1)}>{t('Continua', 'Continue')} <ArrowRight size={15} /></Button>
              : <Button disabled={!canNext || busy} onClick={confirm}>{busy ? t('Conferma in corso…', 'Confirming…') : t('Conferma prenotazione', 'Confirm booking')}</Button>}
          </div>
        </div>
        <aside>
          <div className="card sticky top-24 overflow-hidden">
            <Img src={salon.cover} className="h-36" />
            <div className="p-6">
              <div className="font-serif text-3xl">{salon.name}</div><div className="text-[12px] text-mute">{salon.address}, {salon.city}</div>
              <div className="hairline my-5" />
              {sel.length ? <ul className="space-y-2 text-sm">{sel.map((x) => <li key={x.id} className="flex justify-between gap-3"><span>{x.name} <span className="text-mute">· {x.durationMin}′</span></span><span>{eur(x.price)}</span></li>)}</ul> : <p className="text-sm text-mute">{t('Nessun servizio selezionato', 'No service selected')}</p>}
              {extras.length > 0 && <ul className="mt-3 space-y-2 border-t border-smoke pt-3 text-sm">{products.filter((p) => extras.includes(p.id)).map((p) => <li key={p.id} className="flex justify-between gap-3"><span className="text-mute">+ {p.name}</span><span>{eur(p.price)}</span></li>)}</ul>}
              <div className="mt-5 space-y-1.5 text-[13px] text-mute">
                <div className="flex justify-between"><span>{t('Operatore', 'Stylist')}</span><span className="text-ivory">{win ? winStaff?.name ?? t('Assegnato dal salone', 'Assigned by the salon') : staffObj?.name ?? t('Primo disponibile', 'First available')}</span></div>
                <div className="flex justify-between"><span>{t('Quando', 'When')}</span><span className="text-ivory">{win ? `${fmtDate(win.date, s.lang)}, ${win.start}–${win.end}` : time ? `${fmtDate(date, s.lang)}, ${time}` : '—'}</span></div>
                {win && <div className="flex justify-between"><span>{t('Tipo', 'Type')}</span><span className="text-gold">{t('Fascia speciale', 'Special window')}</span></div>}
              </div>
              <div className="hairline my-5" />
              <div className="flex items-end justify-between"><span className="text-[12px] text-mute">{t('Totale', 'Total')} · {tot.duration} min</span><span className="font-serif text-4xl">{eur(tot.price + extrasTotal)}</span></div>
              {needDeposit && <p className="mt-2 text-[12px] text-gold">{t('Caparra richiesta', 'Deposit available')}: {eur(tot.deposit)}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WindowCard({ w, on, onPick }: { w: TimeWindow; on: boolean; onPick: () => void }) {
  const t = useT();
  const s = useStore();
  const left = windowPlacesLeft(w);
  const names = s.services.filter((x) => w.serviceIds.includes(x.id)).map((x) => x.name);
  const who = w.staffId ? s.staff.find((x) => x.id === w.staffId)?.name : null;
  return (
    <button onClick={onPick} className={cn('rounded-2xl border p-4 text-left transition', on ? 'border-gold bg-gold/10' : 'border-gold/30 hover:border-gold/60')}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-serif text-2xl"><Clock size={16} className="text-gold" />{w.start}–{w.end}</span>
        <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', left <= 1 ? 'bg-crimson/15 text-err' : 'bg-gold/15 text-gold')}><Users size={12} />{left} {left === 1 ? t('posto', 'place') : t('posti', 'places')}</span>
      </div>
      {w.note && <div className="mt-1 text-[13px] text-ivory">{w.note}</div>}
      <div className="mt-1 text-[12px] text-mute">{names.join(' · ')}{who ? ` · ${t('con', 'with')} ${who}` : ''}</div>
    </button>
  );
}

function WindowBanner({ w, onClear, problem }: { w: TimeWindow; onClear: () => void; problem: string | null }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  return (
    <div className="mt-5 flex items-start justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/[.06] p-4 text-sm">
      <div>
        <div className="eyebrow text-[10px]">{t('Fascia speciale', 'Special window')}</div>
        <div className="mt-1">{fmtDate(w.date, lang)} · {w.start}–{w.end} · {windowPlacesLeft(w)} {t('posti liberi', 'places left')}{w.note ? ` · ${w.note}` : ''}</div>
        <div className="mt-1 text-[12px] text-mute">{t('Scegli uno o più servizi inclusi in questa fascia.', 'Choose one or more services included in this window.')}</div>
        {problem && <div className="mt-1 text-[12.5px] text-err">{windowText(problem, lang)}</div>}
      </div>
      <button onClick={onClear} className="text-mute hover:text-ivory" aria-label={t('Rimuovi fascia', 'Remove window')}><X size={16} /></button>
    </div>
  );
}
