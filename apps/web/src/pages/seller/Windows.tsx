/**
 * Seller: special time windows ("fasce orarie").
 * A window = date + time range + services offered + number of places (+ optional stylist).
 * Created in bulk (date range × weekdays). Customers book one place each; full windows disappear.
 */
import { CalendarClock, Lock, Minus, Plus, Trash2, Unlock, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fmtDate, planWindows, toISO, WEEKDAYS_SHORT, windowText, type TimeWindow, type WindowInput } from '@shared/index';
import { errorText } from '@shared/api/client';
import { useMySalon, useStore, useT, useWindows } from '@/lib/store';
import { Badge, Button, Chip, cn, Empty, Field, Input, Modal, Select, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

const isoWd = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return (new Date(y, m - 1, d).getDay() + 6) % 7; };

export default function Windows() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const all = useWindows();
  const today = toISO(new Date());
  const [open, setOpen] = useState(false);
  const windows = all.filter((w) => w.salonId === salon.id && w.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const services = s.services.filter((x) => x.salonId === salon.id && x.active);
  const staff = s.staff.filter((x) => x.salonId === salon.id && x.active);
  const byDate = useMemo(() => {
    const m = new Map<string, TimeWindow[]>();
    for (const w of windows) m.set(w.date, [...(m.get(w.date) ?? []), w]);
    return [...m.entries()];
  }, [windows]);
  const placesTotal = windows.reduce((a, w) => a + w.capacity, 0);
  const placesBooked = windows.reduce((a, w) => a + w.booked, 0);

  return (
    <div>
      <PageHead
        title={t('Fasce orarie', 'Time windows')}
        sub={t(
          `Apri orari speciali con posti limitati, anche nei giorni di chiusura. ${windows.length} fasce in programma · ${placesBooked}/${placesTotal} posti prenotati.`,
          `Open special times with limited places, even on closed days. ${windows.length} upcoming windows · ${placesBooked}/${placesTotal} places booked.`,
        )}
        actions={<Button onClick={() => setOpen(true)}><Plus size={15} />{t('Nuove fasce', 'New windows')}</Button>}
      />
      <div className="mb-6 grid gap-3 rounded-2xl border border-smoke p-4 text-[13px] text-mute sm:grid-cols-3">
        <p><b className="text-ivory">{t('Posti', 'Places')}</b> — {t('ogni cliente prenota un posto. A posti finiti la fascia sparisce dall’app.', 'each client books one place. When places run out the window disappears from the app.')}</p>
        <p><b className="text-ivory">{t('Operatore', 'Stylist')}</b> — {t('se scegli un operatore, i suoi orari normali sono bloccati durante la fascia.', 'if you pick a stylist, their normal times are blocked during the window.')}</p>
        <p><b className="text-ivory">{t('Senza operatore', 'No stylist')}</b> — {t('i posti si aggiungono ai normali orari, che restano prenotabili.', 'places are added on top of normal hours, which stay bookable.')}</p>
      </div>

      {byDate.length === 0 ? (
        <Empty title={t('Nessuna fascia in programma', 'No upcoming windows')} text={t('Esempio: sabato 13:00–14:00, 4 posti, taglio e piega.', 'Example: Saturday 13:00–14:00, 4 places, cut and blow-dry.')} action={<Button onClick={() => setOpen(true)}><Plus size={15} />{t('Crea la prima', 'Create the first')}</Button>} />
      ) : (
        <div className="space-y-6">
          {byDate.map(([date, list]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-3"><span className="font-serif text-2xl">{fmtDate(date, s.lang)}</span>{!salon.hours[isoWd(date)].open && <Badge tone="mute">{t('giorno di chiusura', 'closed day')}</Badge>}<span className="h-px flex-1 bg-smoke" /></div>
              <div className="grid gap-3 lg:grid-cols-2">{list.map((w) => <WindowRow key={w.id} w={w} />)}</div>
            </div>
          ))}
        </div>
      )}
      <CreateWindows open={open} onClose={() => setOpen(false)} services={services} staff={staff} />
    </div>
  );
}

function WindowRow({ w }: { w: TimeWindow }) {
  const t = useT();
  const s = useStore();
  const names = s.services.filter((x) => w.serviceIds.includes(x.id)).map((x) => x.name);
  const who = w.staffId ? s.staff.find((x) => x.id === w.staffId)?.name : null;
  const people = s.bookings.filter((b) => b.windowId === w.id && b.status !== 'cancelled');
  const pct = Math.round((w.booked / w.capacity) * 100);
  const setCap = (n: number) => { if (n < Math.max(1, w.booked) || n > 50) return; s.updateWindow(w.id, { capacity: n }); };
  return (
    <div className={cn('card p-4', !w.open && 'opacity-70')} data-testid="window-row">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-serif text-2xl"><CalendarClock size={17} className="text-gold" />{w.start}–{w.end}</div>
          {w.note && <div className="text-[13px]">{w.note}</div>}
          <div className="mt-1 text-[12px] text-mute">{names.join(' · ')}</div>
          <div className="mt-1 text-[12px] text-mute">{who ? `${t('Operatore', 'Stylist')}: ${who}` : t('Posti extra (nessun operatore bloccato)', 'Extra places (no stylist blocked)')}</div>
        </div>
        <Badge tone={!w.open ? 'mute' : w.booked >= w.capacity ? 'red' : 'ok'}>{!w.open ? t('Chiusa', 'Closed') : w.booked >= w.capacity ? t('Completa', 'Full') : t('Aperta', 'Open')}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Users size={14} className="text-mute" />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-graphite-2"><div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} /></div>
        <span className="text-[12.5px]"><b>{w.booked}</b>/{w.capacity} {t('posti', 'places')}</span>
        <div className="flex items-center rounded-full border border-smoke">
          <button className="grid h-8 w-8 place-items-center hover:text-gold disabled:opacity-30" disabled={w.capacity <= Math.max(1, w.booked)} onClick={() => setCap(w.capacity - 1)} aria-label={t('Un posto in meno', 'One place less')}><Minus size={14} /></button>
          <button className="grid h-8 w-8 place-items-center hover:text-gold disabled:opacity-30" disabled={w.capacity >= 50} onClick={() => setCap(w.capacity + 1)} aria-label={t('Un posto in più', 'One place more')}><Plus size={14} /></button>
        </div>
      </div>
      {people.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{people.map((b) => <span key={b.id} className="rounded-full border border-smoke px-2.5 py-1 text-[11.5px]">{b.customerName} · {s.services.filter((x) => b.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')}</span>)}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="line" onClick={() => { s.updateWindow(w.id, { open: !w.open }); toast(w.open ? t('Fascia chiusa: niente nuove prenotazioni', 'Window closed to new bookings') : t('Fascia riaperta', 'Window reopened')); }}>
          {w.open ? <><Lock size={13} />{t('Chiudi prenotazioni', 'Close bookings')}</> : <><Unlock size={13} />{t('Riapri', 'Reopen')}</>}
        </Button>
        <Button size="sm" variant="ghost" disabled={people.length > 0 || w.booked > 0} onClick={() => { s.deleteWindow(w.id); toast(t('Fascia eliminata', 'Window deleted')); }} title={w.booked ? t('Ha prenotazioni: chiudila invece', 'Has bookings: close it instead') : undefined}>
          <Trash2 size={13} />{t('Elimina', 'Delete')}
        </Button>
      </div>
    </div>
  );
}

function CreateWindows({ open, onClose, services, staff }: { open: boolean; onClose: () => void; services: { id: string; name: string; durationMin: number }[]; staff: { id: string; name: string }[] }) {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const all = useWindows();
  const today = toISO(new Date());
  const blank = (): WindowInput => ({ from: today, to: today, weekdays: [], start: '13:00', end: '14:00', serviceIds: [], capacity: 4, staffId: null, note: '' });
  const [f, setF] = useState<WindowInput>(blank);
  const [busy, setBusy] = useState(false);
  const up = (p: Partial<WindowInput>) => setF((x) => ({ ...x, ...p }));
  const plan = useMemo(
    () => planWindows(f, { services, existing: all.filter((w) => w.salonId === salon.id), bookings: s.bookings.filter((b) => b.salonId === salon.id) }),
    [f, services, all, s.bookings, salon.id],
  );
  const err = 'error' in plan ? windowText(plan.error, s.lang) + (plan.detail ? `: ${plan.detail}` : '') : null;
  const count = 'dates' in plan ? plan.dates.length : 0;
  const multiDay = (f.to ?? f.from) > f.from;
  const length = (() => { const [a, b] = [f.start, f.end].map((x) => +x.slice(0, 2) * 60 + +x.slice(3)); return b - a; })();

  const save = async () => {
    setBusy(true);
    try {
      const r = await s.createWindows({ ...f, to: f.to || f.from, weekdays: multiDay ? f.weekdays : [], note: f.note?.trim() || undefined });
      const skipped = r.skipped.length ? ` · ${r.skipped.length} ${t('saltate', 'skipped')} (${r.skipped.slice(0, 3).map((x) => `${fmtDate(x.date, s.lang)}: ${windowText(x.reason, s.lang)}`).join('; ')})` : '';
      toast(`${r.created.length} ${t('fasce create', 'windows created')}${skipped}`, r.created.length ? 'ok' : 'red');
      if (r.created.length) { setF(blank()); onClose(); }
    } catch (e) {
      toast(errorText(e), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Nuove fasce orarie', 'New time windows')} wide
      footer={<div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className={cn('text-[12.5px]', err ? 'text-err' : 'text-mute')}>{err ?? t(`Verranno create ${count} fasce`, `${count} windows will be created`)}{!err && 'dates' in plan && plan.skipped.length > 0 && ` · ${plan.skipped.length} ${t('giorni saltati', 'days skipped')}`}</span>
        <Button disabled={!!err || !count || busy} onClick={save}>{busy ? t('Creazione…', 'Creating…') : t(`Crea ${count} fasce`, `Create ${count} windows`)}</Button>
      </div>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Dal', 'From')}><Input type="date" min={today} value={f.from} onChange={(e) => e.target.value && up({ from: e.target.value, to: (f.to ?? '') < e.target.value ? e.target.value : f.to, weekdays: f.weekdays?.length ? f.weekdays : [] })} className="[color-scheme:dark]" /></Field>
        <Field label={t('Al (per ripetere)', 'To (to repeat)')}><Input type="date" min={f.from} value={f.to ?? f.from} onChange={(e) => e.target.value && up({ to: e.target.value })} className="[color-scheme:dark]" /></Field>
      </div>
      {multiDay && (
        <div className="mt-4">
          <div className="label">{t('Ripeti nei giorni', 'Repeat on')}</div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS_SHORT[s.lang].map((d, i) => <Chip key={d} active={f.weekdays?.includes(i)} onClick={() => up({ weekdays: f.weekdays?.includes(i) ? f.weekdays.filter((x) => x !== i) : [...(f.weekdays ?? []), i] })}>{d}</Chip>)}
          </div>
          <p className="mt-1 text-[11.5px] text-mute">{t('Nessun giorno selezionato = tutti i giorni del periodo.', 'No day selected = every day in the range.')}</p>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label={t('Inizio', 'Start')}><Input type="time" step={300} value={f.start} onChange={(e) => e.target.value && up({ start: e.target.value })} className="[color-scheme:dark]" /></Field>
        <Field label={t('Fine', 'End')} hint={length > 0 ? `${length} min` : undefined}><Input type="time" step={300} value={f.end} onChange={(e) => e.target.value && up({ end: e.target.value })} className="[color-scheme:dark]" /></Field>
        <Field label={t('Posti', 'Places')} hint={t('Clienti che possono prenotare', 'Clients who can book')}><Input type="number" min={1} max={50} value={f.capacity} onChange={(e) => up({ capacity: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })} /></Field>
      </div>
      <div className="label mt-4">{t('Servizi offerti in questa fascia', 'Services offered in this window')}</div>
      <div className="flex flex-wrap gap-2">
        {services.map((x) => {
          const on = f.serviceIds.includes(x.id);
          const tooLong = length > 0 && x.durationMin > length;
          return <Chip key={x.id} active={on} onClick={() => up({ serviceIds: on ? f.serviceIds.filter((y) => y !== x.id) : [...f.serviceIds, x.id] })}><span className={cn(tooLong && !on && 'opacity-50')}>{x.name} · {x.durationMin}′</span></Chip>;
        })}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t('Operatore', 'Stylist')} hint={f.staffId ? t('I suoi orari normali saranno bloccati durante la fascia', 'Their normal times will be blocked during the window') : t('Posti in più rispetto agli orari normali', 'Places on top of normal hours')}>
          <Select value={f.staffId ?? ''} onChange={(e) => up({ staffId: e.target.value || null })}>
            <option value="">{t('Nessuno (posti extra)', 'None (extra places)')}</option>
            {staff.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
        <Field label={t('Nota per i clienti (facoltativa)', 'Note for clients (optional)')}><Input maxLength={120} value={f.note ?? ''} onChange={(e) => up({ note: e.target.value })} placeholder={t('Es. Domenica speciale', 'E.g. Sunday special')} /></Field>
      </div>
    </Modal>
  );
}
