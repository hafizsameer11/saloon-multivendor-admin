import { addDays, availableSlots, dayShort, monthShort, toISO, type Booking, type Salon } from '@shared/index';
import { slotBookings, slotWindows, useStore, useT } from '@/lib/store';
import { cn } from './ui';

export function SlotPicker({ salon, duration, staffId, date, time, onDate, onTime, ignoreBookingId, allowPast }: {
  salon: Salon; duration: number; staffId: string | null; date: string; time: string | null; onDate: (d: string) => void; onTime: (t: string) => void; ignoreBookingId?: string; allowPast?: boolean;
}) {
  const t = useT();
  const s = useStore();
  const all = allowPast ? s.bookings : slotBookings(s);
  const bookings: Booking[] = ignoreBookingId ? all.filter((b) => b.id !== ignoreBookingId) : all;
  const slots = availableSlots({ salon, date, durationMin: duration, staffId, staff: s.staff, bookings, windows: allowPast ? s.windows : slotWindows(s), now: allowPast ? new Date(0) : new Date() });
  return (
    <div>
      <div className="scroll-x gap-2">
        {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((d) => {
          const iso = toISO(d);
          const h = salon.hours[(d.getDay() + 6) % 7];
          return (
            <button key={iso} type="button" disabled={!h.open} onClick={() => onDate(iso)} className={cn('flex w-[62px] shrink-0 flex-col items-center rounded-2xl border py-2 transition disabled:opacity-25', date === iso ? 'border-crimson bg-crimson' : 'border-smoke hover:border-gold/50')}>
              <span className="text-[10px] uppercase tracking-[.14em] opacity-75">{dayShort(d, s.lang)}</span><span className="font-serif text-2xl leading-tight">{d.getDate()}</span><span className="text-[10px] uppercase opacity-75">{monthShort(d, s.lang)}</span>
            </button>
          );
        })}
      </div>
      {slots.length === 0 ? <p className="mt-4 text-sm text-mute">{t('Chiuso in questa data.', 'Closed on this date.')}</p> : (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((x) => <button key={x.time} type="button" disabled={!x.free} onClick={() => onTime(x.time)} className={cn('rounded-xl border py-2.5 text-sm transition disabled:line-through disabled:opacity-25', time === x.time ? 'border-gold bg-gold/10 text-gold' : 'border-smoke hover:border-gold/50')}>{x.time}</button>)}
        </div>
      )}
    </div>
  );
}
