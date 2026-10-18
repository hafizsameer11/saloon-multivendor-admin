import { CalendarClock, ChevronLeft, ChevronRight, Phone, Plus } from 'lucide-react';
import { useState } from 'react';
import { addDays, BOOKING_STATUS, eur, fmtDate, hhmm, minutes, parseISO, toISO, type Booking, type BookingStatus, type TimeWindow } from '@shared/index';
import { useMySalon, useStore, useT, useWindows } from '@/lib/store';
import { Avatar, Badge, Button, Chip, cn, Drawer, Field, Input, Modal, Select, Textarea, toast } from '@/components/ui';
import { SlotPicker } from '@/components/SlotPicker';
import { PageHead } from '@/components/layout/DashboardLayout';

const START = 8 * 60 + 30, END = 20 * 60, PX = 1.25;
const tone: Record<BookingStatus, string> = {
  awaiting_payment: 'border-warn/50 bg-warn/10 border-dashed', booked: 'border-gold/60 bg-gold/15', confirmed: 'border-ok/60 bg-ok/15', in_progress: 'border-warn/70 bg-warn/20', completed: 'border-smoke bg-white/[.04] opacity-70', no_show: 'border-crimson/60 bg-crimson/15 opacity-70', cancelled: 'border-smoke bg-transparent opacity-40 line-through',
};

export default function Agenda() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const [date, setDate] = useState(toISO(new Date()));
  const [sel, setSel] = useState<Booking | null>(null);
  const [add, setAdd] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [win, setWin] = useState<TimeWindow | null>(null);
  const dayWindows = useWindows().filter((w) => w.salonId === salon.id && w.date === date);
  const staff = s.staff.filter((x) => x.salonId === salon.id && x.active);
  const day = s.bookings.filter((b) => b.salonId === salon.id && b.date === date && (showCancelled || b.status !== 'cancelled'));
  const services = s.services.filter((x) => x.salonId === salon.id);
  const svcName = (b: Booking) => services.filter((x) => b.serviceIds.includes(x.id)).map((x) => x.name).join(' + ');
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = date === toISO(new Date());
  const hours = Array.from({ length: Math.ceil((END - START) / 60) + 1 }, (_, i) => START - 30 + 60 * i).filter((m) => m >= START);
  const setStatus = (st: BookingStatus) => { s.setBookingStatus(sel!.id, st); setSel({ ...sel!, status: st }); toast(`${t('Stato', 'Status')}: ${BOOKING_STATUS[st][s.lang]}`); };
  const revenue = day.filter((b) => b.status !== 'cancelled' && b.status !== 'no_show').reduce((a, b) => a + b.total, 0);
  // walk-in form
  const [w, setW] = useState({ name: '', phone: '', svc: [] as string[], staffId: staff[0]?.id ?? '', date, time: null as string | null, notes: '' });
  const wDur = services.filter((x) => w.svc.includes(x.id)).reduce((a, x) => a + x.durationMin, 0);
  const wTot = services.filter((x) => w.svc.includes(x.id)).reduce((a, x) => a + x.price, 0);

  return (
    <div>
      <PageHead title="Agenda" sub={`${day.filter((b) => b.status !== 'cancelled').length} ${t('appuntamenti', 'appointments')} · ${eur(revenue)} ${t('previsti', 'expected')}`}
        actions={<Button onClick={() => { setW({ name: '', phone: '', svc: [], staffId: staff[0]?.id ?? '', date, time: null, notes: '' }); setAdd(true); }}><Plus size={15} />{t('Nuovo appuntamento', 'New appointment')}</Button>} />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-smoke">
          <button className="grid h-10 w-10 place-items-center hover:text-gold" onClick={() => setDate(toISO(addDays(parseISO(date), -1)))} aria-label={t('Giorno precedente', 'Previous day')}><ChevronLeft size={17} /></button>
          <span className="min-w-[170px] text-center font-serif text-xl">{fmtDate(date, s.lang)}</span>
          <button className="grid h-10 w-10 place-items-center hover:text-gold" onClick={() => setDate(toISO(addDays(parseISO(date), 1)))} aria-label={t('Giorno successivo', 'Next day')}><ChevronRight size={17} /></button>
        </div>
        <Button size="sm" variant="line" onClick={() => setDate(toISO(new Date()))}>{t('Oggi', 'Today')}</Button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="field !w-auto !py-2 text-sm [color-scheme:dark]" />
        <Chip active={showCancelled} onClick={() => setShowCancelled(!showCancelled)}>{t('Mostra annullati', 'Show cancelled')}</Chip>
        <div className="ml-auto hidden flex-wrap gap-2 xl:flex">{(['booked', 'confirmed', 'in_progress', 'completed', 'no_show'] as BookingStatus[]).map((k) => <span key={k} className="flex items-center gap-1.5 text-[11px] text-mute"><span className={cn('h-3 w-3 rounded border', tone[k])} />{BOOKING_STATUS[k][s.lang]}</span>)}</div>
      </div>
      {!salon.hours[(parseISO(date).getDay() + 6) % 7].open && <div className="mb-4 rounded-2xl border border-smoke p-4 text-sm text-mute">{t('Il salone è chiuso in questo giorno.', 'The salon is closed on this day.')}</div>}
      {dayWindows.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="agenda-windows">
          <span className="label !mb-0">{t('Fasce speciali', 'Special windows')}</span>
          {dayWindows.map((w) => (
            <button key={w.id} onClick={() => setWin(w)} className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/[.06] px-3 py-1.5 text-[12.5px] hover:bg-gold/10">
              <CalendarClock size={13} className="text-gold" />{w.start}–{w.end} · {w.booked}/{w.capacity} {t('posti', 'places')}{w.staffId ? ` · ${s.staff.find((x) => x.id === w.staffId)?.name ?? ''}` : ''}{!w.open ? ` · ${t('chiusa', 'closed')}` : ''}
            </button>
          ))}
        </div>
      )}
      <div className="card overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid border-b border-smoke" style={{ gridTemplateColumns: `64px repeat(${staff.length}, 1fr)` }}>
            <div />
            {staff.map((m) => <div key={m.id} className="flex items-center gap-2.5 border-l border-smoke px-4 py-3"><Avatar src={m.photo} name={m.name} size={32} /><div><div className="text-sm font-semibold">{m.name}</div><div className="text-[11px] text-mute">{day.filter((b) => b.staffId === m.id && b.status !== 'cancelled').length} {t('app.', 'appts')}</div></div></div>)}
          </div>
          <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${staff.length}, 1fr)`, height: (END - START) * PX }}>
            <div className="relative">{hours.map((m) => <div key={m} className="absolute right-2 -translate-y-2 text-[11px] text-mute" style={{ top: (m - START) * PX }}>{hhmm(m)}</div>)}</div>
            {staff.map((m) => (
              <div key={m.id} className="relative border-l border-smoke">
                {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-smoke/50" style={{ top: (h - START) * PX }} />)}
                <div className="absolute inset-x-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,.025)_6px,rgba(255,255,255,.025)_12px)]" style={{ top: (13 * 60 - START) * PX, height: 90 * PX }} />
                {dayWindows.filter((w) => w.staffId === m.id).map((w) => (
                  <button key={w.id} onClick={() => setWin(w)} className="absolute inset-x-1.5 overflow-hidden rounded-xl border border-dashed border-gold/60 bg-gold/[.07] px-2.5 py-1.5 text-left hover:bg-gold/[.12]" style={{ top: (minutes(w.start) - START) * PX + 1, height: Math.max((minutes(w.end) - minutes(w.start)) * PX - 3, 26) }}>
                    <div className="truncate text-[12px] font-semibold text-gold">{t('Fascia', 'Window')} {w.start}–{w.end}</div>
                    <div className="truncate text-[11px] text-mute">{w.booked}/{w.capacity} {t('posti', 'places')}{w.note ? ` · ${w.note}` : ''}</div>
                  </button>
                ))}
                {day.filter((b) => b.staffId === m.id && !b.windowId).map((b) => (
                  <button key={b.id} onClick={() => setSel(b)} className={cn('absolute inset-x-1.5 overflow-hidden rounded-xl border px-2.5 py-1.5 text-left transition hover:z-10 hover:brightness-125', tone[b.status])} style={{ top: (minutes(b.time) - START) * PX + 1, height: Math.max(b.durationMin * PX - 3, 26) }}>
                    <div className="truncate text-[12px] font-semibold">{b.time} · {b.customerName}</div>
                    {b.durationMin >= 30 && <div className="truncate text-[11px] text-ivory/70">{svcName(b)}</div>}
                  </button>
                ))}
              </div>
            ))}
            {isToday && nowM > START && nowM < END && <div className="pointer-events-none absolute left-16 right-0 z-20 h-[2px] bg-crimson" style={{ top: (nowM - START) * PX }}><span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-crimson" /></div>}
          </div>
        </div>
      </div>

      <Drawer open={!!win} onClose={() => setWin(null)} title={win ? `${t('Fascia', 'Window')} ${win.start}–${win.end}` : ''}>
        {win && <div className="space-y-4">
          <div className="text-sm text-mute">{fmtDate(win.date, s.lang)} · {win.booked}/{win.capacity} {t('posti prenotati', 'places booked')}{win.note ? ` · ${win.note}` : ''}</div>
          <div className="text-[12.5px] text-mute">{services.filter((x) => win.serviceIds.includes(x.id)).map((x) => x.name).join(' · ')}</div>
          <div className="space-y-2">
            {day.filter((b) => b.windowId === win.id).map((b) => (
              <button key={b.id} onClick={() => { setWin(null); setSel(b); }} className={cn('w-full rounded-xl border px-3 py-2 text-left text-sm', tone[b.status])}>
                <div className="font-semibold">{b.customerName}</div><div className="text-[12px] text-ivory/70">{svcName(b)} · {BOOKING_STATUS[b.status][s.lang]}</div>
              </button>
            ))}
            {!day.some((b) => b.windowId === win.id) && <p className="text-sm text-mute">{t('Ancora nessuna prenotazione.', 'No bookings yet.')}</p>}
          </div>
          <Button size="sm" variant="line" to="/seller/fasce">{t('Gestisci fasce', 'Manage windows')}</Button>
        </div>}
      </Drawer>

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.customerName}>
        {sel && <div className="space-y-5">
          <Badge tone={BOOKING_STATUS[sel.status].tone}>{BOOKING_STATUS[sel.status][s.lang]}</Badge>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-mute">{t('Codice', 'Code')}</span>{sel.code}</div>
            <div className="flex justify-between"><span className="text-mute">{t('Quando', 'When')}</span>{fmtDate(sel.date, s.lang)} · {sel.time}{sel.windowId ? ` (${t('fascia', 'window')})` : ''}</div>
            <div className="flex justify-between"><span className="text-mute">{t('Durata', 'Duration')}</span>{sel.durationMin} min</div>
            <div className="flex justify-between gap-4"><span className="text-mute">{t('Servizi', 'Services')}</span><span className="text-right">{svcName(sel)}</span></div>
            <div className="flex justify-between"><span className="text-mute">{t('Operatore', 'Staff')}</span>{s.staff.find((x) => x.id === sel.staffId)?.name}</div>
            <div className="flex justify-between"><span className="text-mute">{t('Totale', 'Total')}</span>{eur(sel.total)}</div>
            <div className="flex justify-between"><span className="text-mute">{t('Pagamento', 'Payment')}</span>{sel.paymentMode === 'in_salon' ? t('In salone', 'In salon') : `${t('Online', 'Online')} ${eur(sel.deposit)}`}</div>
            {sel.notes && <div className="rounded-xl border border-smoke p-3 text-[13px]"><span className="label">{t('Note', 'Notes')}</span>{sel.notes}</div>}
            {!!sel.pickupProductIds?.length && <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-[13px]"><span className="label">{t('Prodotti da preparare', 'Products to prepare')}</span>{s.products.filter((p) => sel.pickupProductIds!.includes(p.id)).map((p) => p.name).join(', ')}</div>}
          </div>
          <a href={`tel:${sel.customerPhone}`} className="flex items-center gap-2 text-sm text-gold"><Phone size={14} />{sel.customerPhone}</a>
          <div className="label">{t('Cambia stato', 'Change status')}</div>
          <div className="grid grid-cols-2 gap-2">
            {(['confirmed', 'in_progress', 'completed', 'no_show'] as BookingStatus[]).map((k) => <Button key={k} size="sm" variant={sel.status === k ? 'gold' : 'line'} onClick={() => setStatus(k)}>{BOOKING_STATUS[k][s.lang]}</Button>)}
          </div>
          {sel.status !== 'cancelled' && <Button full variant="danger" size="sm" onClick={() => setStatus('cancelled')}>{t('Annulla appuntamento', 'Cancel appointment')}</Button>}
        </div>}
      </Drawer>

      <Modal open={add} onClose={() => setAdd(false)} title={t('Nuovo appuntamento', 'New appointment')} wide
        footer={<Button disabled={!w.name || !w.svc.length || !w.time} onClick={() => { s.addWalkIn({ customerId: 'walk-in', customerName: w.name, customerPhone: w.phone, salonId: salon.id, staffId: w.staffId, serviceIds: w.svc, date: w.date, time: w.time!, durationMin: wDur, total: wTot, deposit: 0, paymentMode: 'in_salon', status: 'confirmed', notes: w.notes }); setDate(w.date); setAdd(false); toast(t('Appuntamento aggiunto', 'Appointment added'), 'ok'); }}>{t('Aggiungi', 'Add')} · {eur(wTot)}</Button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Cliente', 'Client')}><Input value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} list="clients" /><datalist id="clients">{Array.from(new Set(s.bookings.filter((b) => b.salonId === salon.id).map((b) => b.customerName))).map((n) => <option key={n} value={n} />)}</datalist></Field>
          <Field label={t('Telefono', 'Phone')}><Input value={w.phone} onChange={(e) => setW({ ...w, phone: e.target.value })} /></Field>
        </div>
        <div className="label mt-4">{t('Servizi', 'Services')}</div>
        <div className="flex flex-wrap gap-2">{services.map((x) => <Chip key={x.id} active={w.svc.includes(x.id)} onClick={() => setW({ ...w, svc: w.svc.includes(x.id) ? w.svc.filter((y) => y !== x.id) : [...w.svc, x.id], time: null })}>{x.name} · {x.durationMin}′</Chip>)}</div>
        <Field label={t('Operatore', 'Staff')} className="mt-4"><Select value={w.staffId} onChange={(e) => setW({ ...w, staffId: e.target.value, time: null })}>{staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
        <div className="label mt-4">{t('Data e ora', 'Date & time')}</div>
        {w.svc.length ? <SlotPicker salon={salon} duration={wDur} staffId={w.staffId} date={w.date} time={w.time} onDate={(d) => setW({ ...w, date: d, time: null })} onTime={(x) => setW({ ...w, time: x })} allowPast /> : <p className="text-sm text-mute">{t('Seleziona prima un servizio.', 'Select a service first.')}</p>}
        <Field label={t('Note', 'Notes')} className="mt-4"><Textarea className="min-h-[70px]" value={w.notes} onChange={(e) => setW({ ...w, notes: e.target.value })} /></Field>
      </Modal>
    </div>
  );
}
