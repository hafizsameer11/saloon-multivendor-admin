import { Download, MessageSquare, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { WEEKDAYS_SHORT, eur, fmtDate, fmtDateShort, uid, type Coupon, type Staff as StaffT } from '@shared/index';
import { apiMode, useMySalon, useStore, useT } from '@/lib/store';
import Wallet from './Wallet';
import { Avatar, Badge, Button, Checkbox, Chip, Drawer, Empty, Field, Input, Modal, Select, Stars, Stat, Table, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { ImagePicker } from '@/components/ImagePicker';
import { PageHead } from '@/components/layout/DashboardLayout';



export function Staff() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const staff = s.staff.filter((x) => x.salonId === salon.id);
  const services = s.services.filter((x) => x.salonId === salon.id);
  const [edit, setEdit] = useState<StaffT | null>(null);
  const [pick, setPick] = useState(false);
  const blank = (): StaffT => ({ id: uid('st'), salonId: salon.id, name: '', role: 'Stylist', photo: '', bio: '', serviceIds: services.map((x) => x.id), workingDays: [1, 2, 3, 4, 5], active: true });
  return (
    <div>
      <PageHead title="Staff" sub={t('Gli operatori appaiono nella vetrina e nella prenotazione.', 'Staff appear on your storefront and in booking.')} actions={<Button onClick={() => setEdit(blank())}><Plus size={15} />{t('Aggiungi operatore', 'Add staff')}</Button>} />
      {staff.length === 0 && <Empty title={t('Nessun operatore', 'No staff')} action={<Button onClick={() => setEdit(blank())}>{t('Aggiungi', 'Add')}</Button>} />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((m) => (
          <div key={m.id} className="card p-6">
            <div className="flex items-center gap-4"><Avatar src={m.photo} name={m.name} size={64} /><div className="flex-1"><div className="font-serif text-2xl">{m.name}</div><div className="text-[12px] text-gold">{m.role}</div></div>{!m.active && <Badge tone="mute">{t('Inattivo', 'Inactive')}</Badge>}</div>
            <div className="mt-4 flex gap-1">{WEEKDAYS_SHORT[s.lang].map((d, i) => <span key={d} className={`grid h-7 w-7 place-items-center rounded-full text-[10px] ${m.workingDays.includes(i) ? 'bg-gold/20 text-gold' : 'text-mute/50'}`}>{d[0]}</span>)}</div>
            <p className="mt-3 text-[12.5px] text-mute">{m.serviceIds.length} {t('servizi', 'services')} · {s.bookings.filter((b) => b.staffId === m.id && b.status === 'completed').length} {t('appuntamenti completati', 'completed appointments')}</p>
            <Button size="sm" variant="line" className="mt-4" onClick={() => setEdit(m)}><Pencil size={13} />{t('Modifica', 'Edit')}</Button>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('Operatore', 'Staff member')} wide footer={<Button disabled={!edit?.name} onClick={() => { s.upsertStaff(edit!); toast(t('Salvato', 'Saved'), 'ok'); setEdit(null); }}>{t('Salva', 'Save')}</Button>}>
        {edit && <div className="space-y-4">
          <div className="flex items-center gap-4"><Avatar src={edit.photo} name={edit.name || '?'} size={72} /><Button size="sm" variant="line" onClick={() => setPick(true)}>{t('Scegli foto', 'Choose photo')}</Button></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label={t('Nome', 'Name')}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field><Field label={t('Ruolo', 'Role')}><Input value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} /></Field></div>
          <Field label="Bio"><Textarea className="min-h-[70px]" value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} /></Field>
          <div><div className="label">{t('Giorni di lavoro', 'Working days')}</div><div className="flex flex-wrap gap-2">{WEEKDAYS_SHORT[s.lang].map((d, i) => <Chip key={d} active={edit.workingDays.includes(i)} onClick={() => setEdit({ ...edit, workingDays: edit.workingDays.includes(i) ? edit.workingDays.filter((x) => x !== i) : [...edit.workingDays, i] })}>{d}</Chip>)}</div></div>
          <div><div className="label">{t('Servizi eseguiti', 'Services performed')}</div><div className="grid gap-2 sm:grid-cols-2">{services.map((x) => <Checkbox key={x.id} checked={edit.serviceIds.includes(x.id)} onChange={(v) => setEdit({ ...edit, serviceIds: v ? [...edit.serviceIds, x.id] : edit.serviceIds.filter((y) => y !== x.id) })}>{x.name}</Checkbox>)}</div></div>
          <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label={t('Attivo e prenotabile', 'Active and bookable')} />
        </div>}
      </Modal>
      <ImagePicker open={pick} onClose={() => setPick(false)} onPick={(u) => edit && setEdit({ ...edit, photo: u[0] })} />
    </div>
  );
}

export function Clients() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const clients = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; visits: number; last: string; spent: number; noShow: number }>();
    s.bookings.filter((b) => b.salonId === salon.id).forEach((b) => {
      const c = m.get(b.customerName) ?? { name: b.customerName, phone: b.customerPhone, visits: 0, last: '', spent: 0, noShow: 0 };
      if (b.status === 'completed') { c.visits++; c.spent += b.total; if (b.date > c.last) c.last = b.date; }
      if (b.status === 'no_show') c.noShow++;
      m.set(b.customerName, c);
    });
    s.subOrders.filter((x) => x.salonId === salon.id).forEach((x) => { const o = s.orders.find((y) => y.id === x.orderId)!; const c = m.get(o.customerName) ?? { name: o.customerName, phone: '', visits: 0, last: '', spent: 0, noShow: 0 }; c.spent += x.subtotal; m.set(o.customerName, c); });
    return Array.from(m.values()).sort((a, b) => b.spent - a.spent);
  }, [s.bookings, s.subOrders, salon.id]);
  const rows = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const hist = sel ? s.bookings.filter((b) => b.salonId === salon.id && b.customerName === sel).sort((a, b) => b.date.localeCompare(a.date)) : [];
  return (
    <div>
      <PageHead title={t('Clienti', 'Clients')} sub={`${clients.length} ${t('clienti', 'clients')}`} actions={<Button variant="line" size="sm" onClick={() => toast(t('Esportazione CSV disponibile con il backend', 'CSV export available with the backend'))}><Download size={14} />CSV</Button>} />
      <div className="relative mb-5 max-w-sm"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" /><Input className="!pl-10" placeholder={t('Cerca cliente', 'Search client')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Table rows={rows} onRow={(c) => setSel(c.name)} cols={[
        { key: 'n', head: t('Cliente', 'Client'), cell: (c) => <div className="flex items-center gap-3"><Avatar name={c.name} size={34} /><div><div className="font-semibold">{c.name}</div><div className="text-[11.5px] text-mute">{c.phone}</div></div></div> },
        { key: 'v', head: t('Visite', 'Visits'), cell: (c) => c.visits },
        { key: 'l', head: t('Ultima visita', 'Last visit'), cell: (c) => (c.last ? fmtDateShort(c.last, s.lang) : '—') },
        { key: 's', head: t('Speso', 'Spent'), cell: (c) => eur(c.spent) },
        { key: 'ns', head: 'No-show', cell: (c) => (c.noShow ? <Badge tone="red">{c.noShow}</Badge> : '—') },
      ]} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel}>
        <div className="label">{t('Note interne', 'Internal notes')}</div>
        <Textarea value={notes[sel ?? ''] ?? ''} onChange={(e) => setNotes({ ...notes, [sel!]: e.target.value })} placeholder={t('Es. preferisce sfumatura bassa, allergia…', 'E.g. prefers low fade, allergy…')} className="min-h-[90px]" />
        <Button size="sm" variant="line" className="mt-2" onClick={() => toast(t('Nota salvata', 'Note saved'), 'ok')}>{t('Salva nota', 'Save note')}</Button>
        <div className="label mt-6">{t('Storico', 'History')}</div>
        <ul className="space-y-2">{hist.map((b) => <li key={b.id} className="rounded-xl border border-smoke p-3 text-sm"><div className="flex justify-between"><span>{fmtDate(b.date, s.lang)} · {b.time}</span><span>{eur(b.total)}</span></div><div className="text-[12px] text-mute">{s.services.filter((x) => b.serviceIds.includes(x.id)).map((x) => x.name).join(' + ')} · {b.status}</div></li>)}</ul>
      </Drawer>
    </div>
  );
}

export function SellerReviews() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const [tab, setTab] = useState<'all' | 'todo'>('todo');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const all = s.reviews.filter((r) => r.salonId === salon.id && !r.hidden);
  const list = tab === 'todo' ? all.filter((r) => !r.reply) : all;
  return (
    <div className="max-w-3xl">
      <PageHead title={t('Recensioni', 'Reviews')} sub={`${salon.rating.toFixed(1)} ★ · ${salon.reviewCount} ${t('recensioni', 'reviews')}`} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'todo', label: t('Senza risposta', 'Unanswered'), count: all.filter((r) => !r.reply).length }, { id: 'all', label: t('Tutte', 'All'), count: all.length }]} />
      <div className="mt-6 space-y-4">
        {list.length === 0 && <Empty title={t('Tutto risposto', 'All answered')} />}
        {list.map((r) => (
          <div key={r.id} className="card p-6">
            <div className="flex items-center gap-3"><Avatar src={r.customerAvatar} name={r.customerName} size={40} /><div className="flex-1"><div className="font-semibold">{r.customerName}</div><div className="text-[11.5px] text-mute">{fmtDateShort(r.createdAt, s.lang)}{r.productId && ` · ${s.products.find((p) => p.id === r.productId)?.name}`}</div></div><Stars value={r.rating} /></div>
            <p className="mt-3 text-sm text-ivory/85">{r.text}</p>
            {r.reply ? <div className="mt-3 rounded-2xl border-l-2 border-gold bg-white/[.03] px-4 py-3 text-[13px]"><span className="eyebrow mr-2 text-[10px]">{t('La tua risposta', 'Your reply')}</span>{r.reply}</div> : (
              <div className="mt-4 flex gap-2"><Input placeholder={t('Scrivi una risposta pubblica…', 'Write a public reply…')} value={draft[r.id] ?? ''} onChange={(e) => setDraft({ ...draft, [r.id]: e.target.value })} /><Button size="sm" disabled={!draft[r.id]} onClick={() => { s.replyReview(r.id, draft[r.id]); toast(t('Risposta pubblicata', 'Reply published'), 'ok'); }}><MessageSquare size={14} /></Button></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Promotions() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const mine = s.coupons.filter((c) => c.scope === salon.id);
  const [edit, setEdit] = useState<Coupon | null>(null);
  const blank = (): Coupon => ({ id: uid('c'), code: '', type: 'percent', value: 10, scope: salon.id, minSpend: 0, uses: 0, maxUses: 100, active: true, expiresAt: '2026-12-31' });
  return (
    <div>
      <PageHead title={t('Promozioni', 'Promotions')} sub={t('Codici sconto validi solo sui prodotti del tuo salone.', 'Discount codes valid only on your salon’s products.')} actions={<Button onClick={() => setEdit(blank())}><Plus size={15} />{t('Nuovo codice', 'New code')}</Button>} />
      {mine.length === 0 ? <Empty title={t('Nessuna promozione', 'No promotions')} action={<Button onClick={() => setEdit(blank())}>{t('Crea la prima', 'Create first')}</Button>} /> : (
        <Table<Coupon> rows={mine} onRow={setEdit} cols={[
          { key: 'c', head: t('Codice', 'Code'), cell: (c) => <span className="font-mono font-semibold text-gold">{c.code}</span> },
          { key: 'v', head: t('Sconto', 'Discount'), cell: (c) => (c.type === 'percent' ? `${c.value}%` : eur(c.value)) },
          { key: 'm', head: t('Spesa minima', 'Min spend'), cell: (c) => eur(c.minSpend) },
          { key: 'u', head: t('Utilizzi', 'Uses'), cell: (c) => `${c.uses} / ${c.maxUses}` },
          { key: 'e', head: t('Scadenza', 'Expires'), cell: (c) => fmtDateShort(c.expiresAt, s.lang) },
          { key: 's', head: t('Stato', 'Status'), cell: (c) => <Badge tone={c.active ? 'ok' : 'mute'}>{c.active ? t('Attivo', 'Active') : t('Inattivo', 'Inactive')}</Badge> },
        ]} />
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('Codice sconto', 'Discount code')} footer={<Button disabled={!edit?.code || edit.value <= 0} onClick={() => { s.upsertCoupon(edit!); toast(t('Codice salvato', 'Code saved'), 'ok'); setEdit(null); }}>{t('Salva', 'Save')}</Button>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Codice', 'Code')} className="sm:col-span-2"><Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="ELITE10" /></Field>
          <Field label={t('Tipo', 'Type')}><Select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Coupon['type'] })}><option value="percent">%</option><option value="fixed">€</option></Select></Field>
          <Field label={t('Valore', 'Value')}><Input type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: +e.target.value })} /></Field>
          <Field label={t('Spesa minima (€)', 'Min spend (€)')}><Input type="number" value={edit.minSpend} onChange={(e) => setEdit({ ...edit, minSpend: +e.target.value })} /></Field>
          <Field label={t('Utilizzi massimi', 'Max uses')}><Input type="number" value={edit.maxUses} onChange={(e) => setEdit({ ...edit, maxUses: +e.target.value })} /></Field>
          <Field label={t('Scadenza', 'Expiry')}><Input type="date" className="[color-scheme:dark]" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
          <div className="flex items-end pb-3"><Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label={t('Attivo', 'Active')} /></div>
        </div>}
      </Modal>
    </div>
  );
}

export function Payouts() {
  if (apiMode) return <Wallet />;
  return <DemoPayouts />;
}

function DemoPayouts() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const app = s.applications.find((a) => a.salonId === salon.id);
  const rows = s.payouts.filter((p) => p.salonId === salon.id).sort((a, b) => b.period.localeCompare(a.period));
  const next = rows.find((p) => p.status === 'scheduled');
  const paidYear = rows.filter((p) => p.status === 'paid').reduce((a, p) => a + p.net, 0);
  return (
    <div>
      <PageHead title={t('Pagamenti', 'Payouts')} sub={`${t('Bonifico mensile su', 'Monthly transfer to')} ${app?.iban ?? '—'}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label={t('Prossimo payout', 'Next payout')} value={next ? eur(next.net) : '—'} delta={next ? `${t('Periodo', 'Period')} ${next.period} · ${t('il 28 del mese', 'on the 28th')}` : undefined} tone="gold" />
        <Stat label={t('Pagato quest’anno', 'Paid this year')} value={eur(paidYear)} />
        <Stat label={t('Commissione', 'Commission')} value={`${Math.round(salon.commissionRate * 100)}%`} delta={t('su servizi e prodotti', 'on services and products')} tone="gold" />
      </div>
      <div className="mt-6">
        <Table rows={rows} cols={[
          { key: 'p', head: t('Periodo', 'Period'), cell: (p) => p.period },
          { key: 'g', head: t('Lordo', 'Gross'), cell: (p) => eur(p.gross) },
          { key: 'c', head: t('Commissione', 'Commission'), cell: (p) => `-${eur(p.commission)}` },
          { key: 'n', head: t('Netto', 'Net'), cell: (p) => <b>{eur(p.net)}</b> },
          { key: 's', head: t('Stato', 'Status'), cell: (p) => <Badge tone={p.status === 'paid' ? 'ok' : 'gold'}>{p.status === 'paid' ? `${t('Pagato', 'Paid')} ${p.paidAt}` : t('Programmato', 'Scheduled')}</Badge> },
        ]} />
      </div>
    </div>
  );
}
