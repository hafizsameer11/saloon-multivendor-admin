import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, eur, fmtDateShort, PRODUCT_CATEGORY_LABELS, uid, type Coupon, type Payout } from '@shared/index';
import { apiMode, useStore, useT } from '@/lib/store';
import { AdminMoneySettings, AdminWithdrawals } from './Money';
import { Avatar, Badge, Button, Field, Img, Input, Modal, Select, Stat, Table, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

export function AdminPayouts() {
  if (apiMode) return <AdminWithdrawals />;
  return <DemoPayouts />;
}

function DemoPayouts() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'scheduled' | 'paid'>('scheduled');
  const rows = s.payouts.filter((p) => p.status === tab && s.salons.find((x) => x.id === p.salonId)?.status === 'approved');
  const due = s.payouts.filter((p) => p.status === 'scheduled').reduce((a, p) => a + p.net, 0);
  const comm = s.payouts.reduce((a, p) => a + p.commission, 0);
  return (
    <div>
      <PageHead title="Payout" sub={t('Bonifici mensili ai saloni (in produzione: Stripe Connect automatico).', 'Monthly transfers to salons (in production: automatic Stripe Connect).')} actions={tab === 'scheduled' && rows.length > 0 && <Button onClick={() => { rows.forEach((p) => s.markPayoutPaid(p.id)); toast(t('Tutti i payout segnati come pagati', 'All payouts marked paid'), 'ok'); }}>{t('Paga tutti', 'Pay all')} · {eur(due)}</Button>} />
      <div className="mb-6 grid gap-4 md:grid-cols-3"><Stat label={t('Da pagare', 'Due')} value={eur(due)} tone="gold" /><Stat label={t('Commissioni totali', 'Total commission')} value={eur(Math.round(comm))} /><Stat label={t('Saloni pagati', 'Salons paid')} value={new Set(s.payouts.filter((p) => p.status === 'paid').map((p) => p.salonId)).size} /></div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'scheduled', label: t('Programmati', 'Scheduled'), count: s.payouts.filter((p) => p.status === 'scheduled').length }, { id: 'paid', label: t('Pagati', 'Paid'), count: s.payouts.filter((p) => p.status === 'paid').length }]} /></div>
      <Table<Payout> rows={rows} cols={[
        { key: 's', head: t('Salone', 'Salon'), cell: (p) => s.salons.find((x) => x.id === p.salonId)?.name },
        { key: 'p', head: t('Periodo', 'Period'), cell: (p) => p.period },
        { key: 'g', head: t('Lordo', 'Gross'), cell: (p) => eur(p.gross) },
        { key: 'c', head: t('Commissione', 'Commission'), cell: (p) => eur(p.commission) },
        { key: 'n', head: t('Netto', 'Net'), cell: (p) => <b>{eur(p.net)}</b> },
        { key: 'i', head: 'IBAN', cell: (p) => <span className="font-mono text-[11.5px]">{s.applications.find((a) => a.salonId === p.salonId)?.iban}</span> },
        { key: 'a', head: '', cell: (p) => p.status === 'scheduled' ? <Button size="sm" variant="line" onClick={() => { s.markPayoutPaid(p.id); toast(t('Segnato come pagato', 'Marked paid'), 'ok'); }}>{t('Segna pagato', 'Mark paid')}</Button> : <span className="text-[12px] text-mute">{p.paidAt}</span> },
      ]} />
    </div>
  );
}

export function AdminCategories() {
  const t = useT();
  const s = useStore();
  const [svc, setSvc] = useState(Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ id: k, it: v.it, en: v.en, img: v.img })));
  const [prd, setPrd] = useState(Object.entries(PRODUCT_CATEGORY_LABELS).map(([k, v]) => ({ id: k, it: v.it, en: v.en })));
  const [add, setAdd] = useState<'svc' | 'prd' | null>(null);
  const [n, setN] = useState({ it: '', en: '' });
  return (
    <div>
      <PageHead title={t('Categorie', 'Categories')} sub={t('Le categorie guidano ricerca, filtri e homepage.', 'Categories drive search, filters and the homepage.')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between"><h3 className="text-3xl">{t('Saloni / servizi', 'Salons / services')}</h3><Button size="sm" variant="line" onClick={() => { setAdd('svc'); setN({ it: '', en: '' }); }}><Plus size={13} />{t('Aggiungi', 'Add')}</Button></div>
          <ul className="mt-4 divide-y divide-smoke">{svc.map((c) => <li key={c.id} className="flex items-center gap-3 py-3"><Img src={c.img ? `https://images.unsplash.com/photo-${c.img}?w=200&q=60&auto=format&fit=crop` : undefined} className="h-10 w-10 rounded-lg" /><span className="flex-1">{c.it} <span className="text-mute">/ {c.en}</span></span><span className="text-[12px] text-mute">{s.salons.filter((x) => x.category === c.id).length} {t('saloni', 'salons')}</span></li>)}</ul>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between"><h3 className="text-3xl">{t('Prodotti', 'Products')}</h3><Button size="sm" variant="line" onClick={() => { setAdd('prd'); setN({ it: '', en: '' }); }}><Plus size={13} />{t('Aggiungi', 'Add')}</Button></div>
          <ul className="mt-4 divide-y divide-smoke">{prd.map((c) => <li key={c.id} className="flex items-center gap-3 py-3"><span className="flex-1">{c.it} <span className="text-mute">/ {c.en}</span></span><span className="text-[12px] text-mute">{s.products.filter((p) => p.category === c.id).length} {t('prodotti', 'products')}</span>{!s.products.some((p) => p.category === c.id) && <button onClick={() => setPrd(prd.filter((x) => x.id !== c.id))} className="text-mute hover:text-crimson" aria-label={t('Elimina', 'Delete')}><Trash2 size={14} /></button>}</li>)}</ul>
        </div>
      </div>
      <Modal open={!!add} onClose={() => setAdd(null)} title={t('Nuova categoria', 'New category')} footer={<Button disabled={!n.it} onClick={() => { const c = { id: uid('cat'), it: n.it, en: n.en || n.it }; if (add === 'svc') setSvc([...svc, { ...c, img: '' }]); else setPrd([...prd, c]); toast(t('Categoria aggiunta', 'Category added'), 'ok'); setAdd(null); }}>{t('Aggiungi', 'Add')}</Button>}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Nome (IT)"><Input value={n.it} onChange={(e) => setN({ ...n, it: e.target.value })} /></Field><Field label="Name (EN)"><Input value={n.en} onChange={(e) => setN({ ...n, en: e.target.value })} /></Field></div>
      </Modal>
    </div>
  );
}

export function AdminCms() {
  const t = useT();
  const s = useStore();
  const featured = s.salons.filter((x) => x.status === 'approved');
  return (
    <div>
      <PageHead title="CMS" sub={t('Gestisci banner e contenuti della homepage.', 'Manage homepage banners and content.')} />
      <h3 className="mb-4 text-3xl">Banner</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {s.banners.map((b) => (
          <div key={b.id} className="card overflow-hidden"><Img src={b.image} className="h-40 on-dark"><div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" /><div className="absolute bottom-4 left-5"><div className="font-serif text-3xl">{b.title}</div><div className="text-[12.5px] text-ivory/80">{b.subtitle}</div></div></Img>
            <div className="flex items-center justify-between p-4"><Toggle checked={b.active} onChange={() => { s.toggleBanner(b.id); toast(t('Banner aggiornato', 'Banner updated')); }} label={b.active ? t('Visibile', 'Visible') : t('Nascosto', 'Hidden')} /><span className="text-[12px] text-mute">→ {b.link}</span></div></div>
        ))}
      </div>
      <h3 className="mb-4 mt-10 text-3xl">{t('Saloni in evidenza', 'Featured salons')}</h3>
      <div className="card divide-y divide-smoke">
        {featured.map((x) => <div key={x.id} className="flex items-center gap-4 px-5 py-3"><Img src={x.cover} className="h-10 w-10 rounded-lg" /><span className="flex-1">{x.name} <span className="text-mute">· {x.city}</span></span><Toggle checked={!!x.featured} onChange={() => s.toggleFeatured(x.id)} /></div>)}
      </div>
      <h3 className="mb-4 mt-10 text-3xl">{t('Pagine statiche', 'Static pages')}</h3>
      <div className="grid gap-3 md:grid-cols-3">{[t('Chi siamo', 'About'), 'FAQ', t('Termini', 'Terms'), 'Privacy', 'Cookie', t('Come funziona', 'How it works')].map((p) => <div key={p} className="card flex items-center justify-between p-4"><span>{p}</span><Button size="sm" variant="ghost" onClick={() => toast(t('Editor testi disponibile con il backend', 'Text editor available with the backend'))}>{t('Modifica', 'Edit')}</Button></div>)}</div>
    </div>
  );
}

export function AdminCoupons() {
  const t = useT();
  const s = useStore();
  const [edit, setEdit] = useState<Coupon | null>(null);
  const blank = (): Coupon => ({ id: uid('c'), code: '', type: 'percent', value: 10, scope: 'platform', minSpend: 0, uses: 0, maxUses: 1000, active: true, expiresAt: '2026-12-31' });
  return (
    <div>
      <PageHead title="Coupon" sub={t('Codici della piattaforma e dei saloni.', 'Platform and salon codes.')} actions={<Button onClick={() => setEdit(blank())}><Plus size={15} />{t('Nuovo coupon', 'New coupon')}</Button>} />
      <Table<Coupon> rows={s.coupons} onRow={setEdit} cols={[
        { key: 'c', head: t('Codice', 'Code'), cell: (c) => <span className="font-mono font-semibold text-gold">{c.code}</span> },
        { key: 'v', head: t('Sconto', 'Discount'), cell: (c) => (c.type === 'percent' ? `${c.value}%` : eur(c.value)) },
        { key: 's', head: t('Ambito', 'Scope'), cell: (c) => (c.scope === 'platform' ? <Badge>{t('Piattaforma', 'Platform')}</Badge> : s.salons.find((x) => x.id === c.scope)?.name) },
        { key: 'u', head: t('Utilizzi', 'Uses'), cell: (c) => `${c.uses} / ${c.maxUses}` },
        { key: 'e', head: t('Scadenza', 'Expires'), cell: (c) => fmtDateShort(c.expiresAt, s.lang) },
        { key: 'a', head: t('Stato', 'Status'), cell: (c) => <Badge tone={c.active ? 'ok' : 'mute'}>{c.active ? t('Attivo', 'Active') : t('Inattivo', 'Inactive')}</Badge> },
      ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Coupon" footer={<Button disabled={!edit?.code} onClick={() => { s.upsertCoupon(edit!); toast(t('Coupon salvato', 'Coupon saved'), 'ok'); setEdit(null); }}>{t('Salva', 'Save')}</Button>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Codice', 'Code')} className="sm:col-span-2"><Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, '') })} /></Field>
          <Field label={t('Tipo', 'Type')}><Select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Coupon['type'] })}><option value="percent">%</option><option value="fixed">€</option></Select></Field>
          <Field label={t('Valore', 'Value')}><Input type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: +e.target.value })} /></Field>
          <Field label={t('Spesa minima', 'Min spend')}><Input type="number" value={edit.minSpend} onChange={(e) => setEdit({ ...edit, minSpend: +e.target.value })} /></Field>
          <Field label={t('Utilizzi massimi', 'Max uses')}><Input type="number" value={edit.maxUses} onChange={(e) => setEdit({ ...edit, maxUses: +e.target.value })} /></Field>
          <Field label={t('Scadenza', 'Expiry')}><Input type="date" className="[color-scheme:dark]" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
          <div className="flex items-end pb-3"><Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label={t('Attivo', 'Active')} /></div>
        </div>}
      </Modal>
    </div>
  );
}

export function AdminSupport() {
  const t = useT();
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const tk = s.tickets.find((x) => x.id === sel);
  return (
    <div>
      <PageHead title={t('Supporto', 'Support')} sub={t('Ticket da clienti e saloni.', 'Tickets from customers and salons.')} />
      <Table rows={s.tickets} onRow={(x) => { setSel(x.id); setReply(''); }} cols={[
        { key: 'f', head: t('Da', 'From'), cell: (x) => <div className="flex items-center gap-3"><Avatar name={x.from} size={32} />{x.from}</div> },
        { key: 's', head: t('Oggetto', 'Subject'), cell: (x) => x.subject },
        { key: 'd', head: t('Data', 'Date'), cell: (x) => fmtDateShort(x.at, s.lang) },
        { key: 'st', head: t('Stato', 'Status'), cell: (x) => <Badge tone={x.status === 'open' ? 'gold' : 'mute'}>{x.status === 'open' ? t('Aperto', 'Open') : t('Chiuso', 'Closed')}</Badge> },
      ]} />
      <Modal open={!!tk} onClose={() => setSel(null)} title={tk?.subject} footer={<><Button variant="ghost" onClick={() => { s.setTicketStatus(tk!.id, tk!.status === 'open' ? 'closed' : 'open'); setSel(null); }}>{tk?.status === 'open' ? t('Chiudi ticket', 'Close ticket') : t('Riapri', 'Reopen')}</Button><Button disabled={!reply} onClick={() => { s.setTicketStatus(tk!.id, 'closed'); toast(t('Risposta inviata e ticket chiuso', 'Reply sent, ticket closed'), 'ok'); setSel(null); }}>{t('Rispondi e chiudi', 'Reply & close')}</Button></>}>
        {tk && <><p className="text-sm text-mute">{tk.from} · {fmtDateShort(tk.at, s.lang)}</p><div className="mt-4 rounded-2xl border border-smoke p-4 text-sm">{t('Buongiorno, avrei bisogno di assistenza riguardo:', 'Hello, I need help with:')} {tk.subject.toLowerCase()}.</div><Textarea className="mt-4" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t('Scrivi la risposta…', 'Write a reply…')} /></>}
      </Modal>
    </div>
  );
}

export function AdminSettings() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'fees' | 'emails' | 'team'>('fees');
  const [f, setF] = useState({ commission: 12, deposit: 20, vat: 22, approvalSla: 48, freeShip: 49 });
  const admins = s.users.filter((u) => u.role === 'admin');
  return (
    <div className="max-w-4xl">
      <PageHead title={t('Impostazioni', 'Settings')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'fees', label: t('Commissioni e tasse', 'Fees & tax') }, { id: 'emails', label: t('Email', 'Emails') }, { id: 'team', label: t('Team admin', 'Admin team') }]} />
      <div className="mt-6">
        {tab === 'fees' && apiMode && <AdminMoneySettings />}
        {tab === 'fees' && !apiMode && <div className="card grid gap-4 p-6 sm:grid-cols-2">
          <Field label={t('Commissione predefinita (%)', 'Default commission (%)')}><Input type="number" value={f.commission} onChange={(e) => setF({ ...f, commission: +e.target.value })} /></Field>
          <Field label={t('Caparra massima (%)', 'Max deposit (%)')}><Input type="number" value={f.deposit} onChange={(e) => setF({ ...f, deposit: +e.target.value })} /></Field>
          <Field label={t('IVA (%)', 'VAT (%)')}><Input type="number" value={f.vat} onChange={(e) => setF({ ...f, vat: +e.target.value })} /></Field>
          <Field label={t('SLA approvazione (ore)', 'Approval SLA (hours)')}><Input type="number" value={f.approvalSla} onChange={(e) => setF({ ...f, approvalSla: +e.target.value })} /></Field>
          <Button className="justify-self-start" onClick={() => toast(t('Impostazioni salvate', 'Settings saved'), 'ok')}>{t('Salva', 'Save')}</Button>
        </div>}
        {tab === 'emails' && <div className="card divide-y divide-smoke">{[t('Benvenuto cliente', 'Customer welcome'), t('Conferma prenotazione', 'Booking confirmation'), t('Promemoria 24h', '24h reminder'), t('Ordine spedito', 'Order shipped'), t('Richiesta venditore ricevuta', 'Seller application received'), t('Salone approvato', 'Salon approved'), t('Recupero password', 'Password reset')].map((e) => <div key={e} className="flex items-center justify-between px-5 py-4"><span>{e}</span><Button size="sm" variant="ghost" onClick={() => toast(apiMode ? t('Editor dei template email non ancora sviluppato: i testi sono nel codice del backend.', 'Email template editor not built yet: texts live in the backend code.') : t('Editor template disponibile con il backend', 'Template editor available with the backend'))}>{t('Modifica', 'Edit')}</Button></div>)}</div>}
        {tab === 'team' && <div className="card divide-y divide-smoke">{admins.map((u) => <div key={u.id} className="flex items-center gap-3 px-5 py-4"><Avatar src={u.avatar} name={u.name} size={36} /><div className="flex-1"><div className="font-semibold">{u.name}</div><div className="text-[12px] text-mute">{u.email}</div></div><Badge>Super admin</Badge></div>)}<div className="p-5"><Button size="sm" variant="line" onClick={() => toast(apiMode ? t('Inviti admin non ancora sviluppati: per ora si crea l’utente dal database.', 'Admin invites not built yet: create the user in the database for now.') : t('Invito admin disponibile con il backend', 'Admin invites available with the backend'))}><Plus size={13} />{t('Invita admin', 'Invite admin')}</Button></div></div>}
      </div>
    </div>
  );
}
