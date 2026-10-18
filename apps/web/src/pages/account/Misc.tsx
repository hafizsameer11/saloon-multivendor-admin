import { CreditCard, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataLabel, fmtDateTime, CITIES, fmtDateShort, uid, type Address } from '@shared/index';
import { useMe, useStore, useT } from '@/lib/store';
import { Avatar, Badge, Button, cn, Empty, Field, Img, Input, Modal, Select, Stars, Tabs, Toggle, toast } from '@/components/ui';
import { ProductCard, SalonCard } from '@/components/cards';
import { AHead } from './AccountRoutes';

export function Favourites() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'salons' | 'products'>('salons');
  const salons = s.salons.filter((x) => s.favSalons.includes(x.id) && x.status === 'approved');
  const products = s.products.filter((x) => s.favProducts.includes(x.id) && x.status === 'published');
  return (
    <div>
      <AHead title={t('Preferiti', 'Favourites')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'salons', label: t('Saloni', 'Salons'), count: salons.length }, { id: 'products', label: t('Prodotti', 'Products'), count: products.length }]} />
      <div className="mt-6">
        {tab === 'salons' && (salons.length ? <div className="grid gap-5 md:grid-cols-2">{salons.map((x) => <SalonCard key={x.id} salon={x} />)}</div> : <Empty title={t('Nessun salone salvato', 'No saved salons')} text={t('Tocca il cuore su un salone per salvarlo.', 'Tap the heart on a salon to save it.')} action={<Button to="/esplora">{t('Esplora', 'Explore')}</Button>} />)}
        {tab === 'products' && (products.length ? <div className="day grid grid-cols-2 gap-x-4 gap-y-10 rounded-[28px] p-6 md:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <Empty title={t('Nessun prodotto salvato', 'No saved products')} action={<Button to="/shop">Shop</Button>} />)}
      </div>
    </div>
  );
}

export function MyReviews() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const mine = s.reviews.filter((r) => r.customerId === me.id);
  const pending = s.bookings.filter((b) => b.customerId === me.id && b.status === 'completed' && !b.reviewed);
  return (
    <div>
      <AHead title={t('Le mie recensioni', 'My reviews')} />
      {pending.length > 0 && (
        <div className="mb-8 rounded-[26px] border border-gold/30 bg-gold/5 p-5">
          <div className="eyebrow">{t('In attesa della tua opinione', 'Waiting for your review')}</div>
          <div className="mt-3 space-y-2">{pending.map((b) => { const salon = s.salons.find((x) => x.id === b.salonId)!; return <div key={b.id} className="flex items-center justify-between gap-3 text-sm"><span>{salon.name} · {fmtDateShort(b.date, s.lang)}</span><Button size="sm" variant="gold" to="/account/prenotazioni?tab=past">{t('Scrivi', 'Write')}</Button></div>; })}</div>
        </div>
      )}
      {mine.length === 0 ? <Empty title={t('Ancora nessuna recensione', 'No reviews yet')} /> : (
        <div className="space-y-4">
          {mine.map((r) => { const salon = s.salons.find((x) => x.id === r.salonId)!; const prod = r.productId ? s.products.find((p) => p.id === r.productId) : null; return (
            <div key={r.id} className="card p-6">
              <div className="flex items-center justify-between gap-3"><Link to={prod ? `/prodotto/${prod.id}` : `/salone/${salon.slug}`} className="font-serif text-2xl hover:text-gold">{prod?.name ?? salon.name}</Link><Stars value={r.rating} /></div>
              <p className="mt-2 text-sm text-ivory/85">{r.text}</p><div className="mt-2 text-[12px] text-mute">{fmtDateShort(r.createdAt, s.lang)}{r.hidden && <Badge tone="red" className="ml-2">{t('Nascosta', 'Hidden')}</Badge>}</div>
              {r.reply && <div className="mt-3 rounded-2xl border-l-2 border-gold bg-white/[.03] px-4 py-3 text-[13px]"><span className="eyebrow mr-2 text-[10px]">{salon.name}</span>{r.reply}</div>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

export function Addresses() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const blank = (): Address => ({ id: uid('a'), label: 'Casa', name: me.name, street: '', city: '', zip: '', province: '', phone: me.phone });
  const [edit, setEdit] = useState<Address | null>(null);
  const valid = edit && edit.street && edit.city && edit.zip.length === 5 && edit.name;
  return (
    <div>
      <AHead title={t('Indirizzi', 'Addresses')} action={<Button onClick={() => setEdit(blank())}><Plus size={15} />{t('Aggiungi', 'Add')}</Button>} />
      {me.addresses.length === 0 ? <Empty title={t('Nessun indirizzo', 'No addresses')} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {me.addresses.map((a) => (
            <div key={a.id} className={cn('card p-6', a.isDefault && 'border-gold/40')}>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 font-serif text-2xl"><MapPin size={16} className="text-gold" />{dataLabel(a.label, s.lang)}</span>{a.isDefault && <Badge>{t('Predefinito', 'Default')}</Badge>}</div>
              <p className="mt-3 text-sm text-ivory/80">{a.name}<br />{a.street}<br />{a.zip} {a.city} ({a.province})<br />{a.phone}</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="line" onClick={() => setEdit(a)}><Pencil size={13} />{t('Modifica', 'Edit')}</Button>
                {!a.isDefault && <Button size="sm" variant="ghost" onClick={() => { s.saveAddress({ ...a, isDefault: true }); toast(t('Impostato come predefinito', 'Set as default')); }}>{t('Rendi predefinito', 'Make default')}</Button>}
                <Button size="sm" variant="ghost" onClick={() => { s.removeAddress(a.id); toast(t('Indirizzo eliminato', 'Address deleted')); }} aria-label={t('Elimina', 'Delete')}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('Indirizzo', 'Address')} footer={<Button disabled={!valid} onClick={() => { s.saveAddress(edit!); toast(t('Indirizzo salvato', 'Address saved'), 'ok'); setEdit(null); }}>{t('Salva', 'Save')}</Button>}>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('Etichetta', 'Label')}><Select value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })}>{['Casa', 'Ufficio', 'Altro'].map((x) => <option key={x} value={x}>{dataLabel(x, s.lang)}</option>)}</Select></Field>
            <Field label={t('Nome e cognome', 'Full name')}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label={t('Via e civico', 'Street')} className="sm:col-span-2"><Input value={edit.street} onChange={(e) => setEdit({ ...edit, street: e.target.value })} /></Field>
            <Field label={t('Città', 'City')}><Input value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} list="cities" /><datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist></Field>
            <div className="grid grid-cols-2 gap-3"><Field label={t('CAP', 'Postcode')}><Input value={edit.zip} onChange={(e) => setEdit({ ...edit, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} /></Field><Field label={t('Prov.', 'Province')}><Input value={edit.province} onChange={(e) => setEdit({ ...edit, province: e.target.value.toUpperCase().slice(0, 2) })} /></Field></div>
            <Field label={t('Telefono', 'Phone')}><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <div className="flex items-end pb-2"><Toggle checked={!!edit.isDefault} onChange={(v) => setEdit({ ...edit, isDefault: v })} label={t('Predefinito', 'Default')} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function Payments() {
  const t = useT();
  const [cards, setCards] = useState([{ id: 'c1', brand: 'Visa', last4: '4242', exp: '08/28', def: true }, { id: 'c2', brand: 'Mastercard', last4: '8812', exp: '02/27', def: false }]);
  const [open, setOpen] = useState(false);
  const [n, setN] = useState({ num: '', exp: '', cvc: '' });
  return (
    <div>
      <AHead title={t('Metodi di pagamento', 'Payment methods')} sub={t('Le carte sono salvate in modo sicuro dal provider di pagamento (Stripe), mai sui nostri server.', 'Cards are stored securely by the payment provider (Stripe), never on our servers.')} action={<Button onClick={() => setOpen(true)}><Plus size={15} />{t('Aggiungi carta', 'Add card')}</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="relative overflow-hidden rounded-[26px] border border-smoke bg-[linear-gradient(135deg,#221F20,#141213)] p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-crimson/20 blur-2xl" />
            <div className="relative flex items-center justify-between"><CreditCard className="text-gold" />{c.def && <Badge>{t('Predefinita', 'Default')}</Badge>}</div>
            <div className="relative mt-8 font-mono text-xl tracking-[.2em]">•••• •••• •••• {c.last4}</div>
            <div className="relative mt-4 flex items-center justify-between text-sm text-mute"><span>{c.brand} · {c.exp}</span>
              <span className="flex gap-3">{!c.def && <button className="hover:text-gold" onClick={() => setCards(cards.map((x) => ({ ...x, def: x.id === c.id })))}>{t('Predefinita', 'Default')}</button>}<button className="hover:text-crimson" onClick={() => { setCards(cards.filter((x) => x.id !== c.id)); toast(t('Carta rimossa', 'Card removed')); }}>{t('Rimuovi', 'Remove')}</button></span></div>
          </div>
        ))}
      </div>
      <div className="card mt-6 flex items-center justify-between p-6"><div><div className="font-serif text-2xl">PayPal</div><div className="text-[12.5px] text-mute">{t('Non collegato', 'Not connected')}</div></div><Button variant="line" size="sm" onClick={() => toast(t('Collegamento PayPal disponibile con il backend', 'PayPal linking available with the backend'))}>{t('Collega', 'Connect')}</Button></div>
      <Modal open={open} onClose={() => setOpen(false)} title={t('Nuova carta', 'New card')} footer={<Button disabled={n.num.replace(/\s/g, '').length < 12 || n.exp.length < 4 || n.cvc.length < 3} onClick={() => { setCards([...cards, { id: uid('c'), brand: n.num.startsWith('5') ? 'Mastercard' : 'Visa', last4: n.num.replace(/\s/g, '').slice(-4), exp: n.exp, def: false }]); setN({ num: '', exp: '', cvc: '' }); setOpen(false); toast(t('Carta aggiunta', 'Card added'), 'ok'); }}>{t('Salva carta', 'Save card')}</Button>}>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]"><Field label={t('Numero', 'Number')}><Input value={n.num} onChange={(e) => setN({ ...n, num: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} placeholder="4242 4242 4242 4242" /></Field><Field label="MM/AA"><Input value={n.exp} onChange={(e) => setN({ ...n, exp: e.target.value.slice(0, 5) })} /></Field><Field label="CVC"><Input value={n.cvc} onChange={(e) => setN({ ...n, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Field></div>
      </Modal>
    </div>
  );
}

export function Notifications() {
  const t = useT();
  const s = useStore();
  const items = s.notifications.filter((n) => n.userId === s.userId);
  const [prefs, setPrefs] = useState({ email: true, promo: false });
  return (
    <div>
      <AHead title={t('Notifiche', 'Notifications')} action={<Button variant="line" size="sm" onClick={() => { s.markNotificationsRead(); toast(t('Tutte lette', 'All read')); }}>{t('Segna tutte come lette', 'Mark all read')}</Button>} />
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-2">
          {items.length === 0 && <Empty title={t('Nessuna notifica', 'No notifications')} />}
          {items.map((n) => (
            <Link key={n.id} to={n.link ?? '#'} className={cn('block rounded-2xl border p-5 transition hover:border-gold/40', n.read ? 'border-smoke' : 'border-gold/30 bg-gold/5')}>
              <div className="flex items-center justify-between gap-3"><span className="font-semibold">{n.title}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-crimson" />}</div>
              <p className="mt-1 text-sm text-mute">{n.body}</p><span className="mt-2 block text-[11px] text-mute/70">{fmtDateTime(n.at, s.lang)}</span>
            </Link>
          ))}
        </div>
        <div className="card h-fit space-y-4 p-6">
          <div className="eyebrow">{t('Preferenze', 'Preferences')}</div>
          <Toggle checked={prefs.email} onChange={(v) => setPrefs({ ...prefs, email: v })} label={t('Conferme e promemoria via email', 'Email confirmations & reminders')} />
          <Toggle checked={prefs.promo} onChange={(v) => setPrefs({ ...prefs, promo: v })} label={t('Offerte e novità', 'Offers & news')} />
          <Button size="sm" variant="line" onClick={() => toast(t('Preferenze salvate', 'Preferences saved'), 'ok')}>{t('Salva', 'Save')}</Button>
        </div>
      </div>
    </div>
  );
}

export function Profile() {
  const t = useT();
  const s = useStore();
  const me = useMe()!;
  const nav = useNavigate();
  const [f, setF] = useState({ name: me.name, phone: me.phone, city: me.city ?? '', email: me.email });
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });
  const [del, setDel] = useState(false);
  return (
    <div>
      <AHead title={t('Profilo', 'Profile')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-4"><Avatar src={me.avatar} name={me.name} size={72} /><div><Button size="sm" variant="line" onClick={() => toast(t('Caricamento foto disponibile con il backend', 'Photo upload available with the backend'))}>{t('Cambia foto', 'Change photo')}</Button><p className="mt-1 text-[11.5px] text-mute">{t('Cliente dal', 'Member since')} {fmtDateShort(me.createdAt, s.lang)}</p></div></div>
          <div className="mt-6 grid gap-4">
            <Field label={t('Nome e cognome', 'Full name')}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email" hint={t('Per cambiare email ti invieremo un link di verifica.', 'We’ll send a verification link to change email.')}><Input value={f.email} disabled /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label={t('Telefono', 'Phone')}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label={t('Città', 'City')}><Select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}><option value="">—</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</Select></Field></div>
            <Button className="justify-self-start" onClick={() => { s.updateProfile({ name: f.name, phone: f.phone, city: f.city }); toast(t('Profilo aggiornato', 'Profile updated'), 'ok'); }}>{t('Salva modifiche', 'Save changes')}</Button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-3xl">{t('Sicurezza', 'Security')}</h2>
            <div className="mt-4 grid gap-3">
              <Field label={t('Password attuale', 'Current password')}><Input type="password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
              <Field label={t('Nuova password', 'New password')}><Input type="password" value={pw.n1} onChange={(e) => setPw({ ...pw, n1: e.target.value })} /></Field>
              <Field label={t('Conferma', 'Confirm')} error={pw.n2 && pw.n1 !== pw.n2 ? t('Le password non coincidono', 'Passwords don’t match') : undefined}><Input type="password" value={pw.n2} onChange={(e) => setPw({ ...pw, n2: e.target.value })} /></Field>
              <Button variant="line" className="justify-self-start" disabled={!pw.old || pw.n1.length < 8 || pw.n1 !== pw.n2} onClick={() => { setPw({ old: '', n1: '', n2: '' }); toast(t('Password aggiornata', 'Password updated'), 'ok'); }}>{t('Aggiorna password', 'Update password')}</Button>
            </div>
          </div>
          <div className="card border-crimson/30 p-6">
            <h2 className="text-3xl">{t('Elimina account', 'Delete account')}</h2>
            <p className="mt-2 text-sm text-mute">{t('Cancelleremo i tuoi dati personali secondo il GDPR. Le fatture restano conservate per obbligo di legge.', 'We’ll delete your personal data per GDPR. Invoices are retained as required by law.')}</p>
            <Button variant="danger" size="sm" className="mt-4" onClick={() => setDel(true)}>{t('Elimina il mio account', 'Delete my account')}</Button>
          </div>
        </div>
      </div>
      <Modal open={del} onClose={() => setDel(false)} title={t('Sei sicura?', 'Are you sure?')} footer={<><Button variant="ghost" onClick={() => setDel(false)}>{t('Annulla', 'Cancel')}</Button><Button onClick={() => { s.setUserBlocked(me.id, true); s.logout(); nav('/'); toast(t('Account eliminato', 'Account deleted')); }}>{t('Elimina definitivamente', 'Delete permanently')}</Button></>}>
        <p className="text-sm text-ivory/85">{t('L’operazione non è reversibile. Perderai prenotazioni, ordini e punti fedeltà.', 'This can’t be undone. You’ll lose bookings, orders and loyalty points.')}</p>
      </Modal>
    </div>
  );
}
