import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dataLabel, CITIES, type Salon } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { Button, Chip, Field, Input, Select, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { GalleryEditor } from '@/components/ImagePicker';
import { PageHead } from '@/components/layout/DashboardLayout';

const DAYS = { it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'], en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };
const AMENITIES = ['Wi-Fi', 'Aria condizionata', 'Pagamento con carta', 'Accessibile', 'Parcheggio', 'Caffè offerto', 'Prodotti vegan', 'Kids friendly'];

export default function StoreSettings() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const app = s.applications.find((a) => a.salonId === salon.id);
  const [tab, setTab] = useState<'shop' | 'hours' | 'policy' | 'account'>('shop');
  const [f, setF] = useState<Salon>(salon);
  useEffect(() => setF(salon), [salon.id]);
  const dirty = JSON.stringify(f) !== JSON.stringify(salon);
  const save = () => { s.updateSalon(salon.id, f); toast(t('Impostazioni salvate', 'Settings saved'), 'ok'); };
  const images = [f.cover, ...f.gallery].filter(Boolean);
  const [notif, setNotif] = useState({ booking: true, order: true, review: true });
  return (
    <div className="max-w-4xl">
      <PageHead title={t('Impostazioni', 'Settings')} actions={<><Button variant="line" to={`/salone/${salon.slug}`}><Eye size={15} />{t('Vetrina', 'Storefront')}</Button><Button disabled={!dirty} onClick={save}>{t('Salva modifiche', 'Save changes')}</Button></>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'shop', label: t('Vetrina', 'Storefront') }, { id: 'hours', label: t('Orari', 'Hours') }, { id: 'policy', label: t('Politiche e spedizioni', 'Policies & shipping') }, { id: 'account', label: 'Account' }]} />
      <div className="mt-6">
        {tab === 'shop' && <div className="space-y-6">
          <div className="card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Nome', 'Name')}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label={t('Città', 'City')}><Select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label={t('Indirizzo', 'Address')}><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
              <Field label={t('Telefono', 'Phone')}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            </div>
            <Field label={t('Slogan', 'Tagline')}><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
            <Field label={t('Descrizione', 'Description')}><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <div><div className="label">{t('Servizi del locale', 'Amenities')}</div><div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <Chip key={a} active={f.amenities.includes(a)} onClick={() => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] })}>{dataLabel(a, s.lang)}</Chip>)}</div></div>
          </div>
          <div className="card p-6"><h3 className="mb-4 text-2xl">{t('Galleria', 'Gallery')}</h3><GalleryEditor images={images} onChange={(x) => setF({ ...f, cover: x[0] ?? '', gallery: x.slice(1) })} max={10} /></div>
        </div>}
        {tab === 'hours' && <div className="card divide-y divide-smoke p-2">
          {f.hours.map((h, i) => (
            <div key={h.day} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <span className="w-28 font-serif text-xl">{DAYS[s.lang][h.day]}</span>
              <Toggle checked={!!h.open} onChange={(v) => setF({ ...f, hours: f.hours.map((x, k) => (k === i ? { ...x, open: v ? '09:00' : null, close: v ? '19:00' : null } : x)) })} label={h.open ? t('Aperto', 'Open') : t('Chiuso', 'Closed')} />
              {h.open && <div className="ml-auto flex items-center gap-2"><Input type="time" className="!w-32 !py-2 [color-scheme:dark]" value={h.open} onChange={(e) => setF({ ...f, hours: f.hours.map((x, k) => (k === i ? { ...x, open: e.target.value } : x)) })} /><span className="text-mute">–</span><Input type="time" className="!w-32 !py-2 [color-scheme:dark]" value={h.close ?? ''} onChange={(e) => setF({ ...f, hours: f.hours.map((x, k) => (k === i ? { ...x, close: e.target.value } : x)) })} /></div>}
            </div>
          ))}
        </div>}
        {tab === 'policy' && <div className="card space-y-4 p-6">
          <Field label={t('Politica di cancellazione', 'Cancellation policy')}><Textarea className="min-h-[70px]" value={f.policies.cancellation} onChange={(e) => setF({ ...f, policies: { ...f.policies, cancellation: e.target.value } })} /></Field>
          <Field label={t('Politica no-show', 'No-show policy')}><Textarea className="min-h-[70px]" value={f.policies.noShow} onChange={(e) => setF({ ...f, policies: { ...f.policies, noShow: e.target.value } })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t('Zone di spedizione', 'Shipping zones')}><Select value={f.policies.shippingZones} onChange={(e) => setF({ ...f, policies: { ...f.policies, shippingZones: e.target.value } })}>{['Italia', 'Solo Calabria', 'Solo ritiro in salone'].map((z) => <option key={z} value={z}>{dataLabel(z, s.lang)}</option>)}</Select></Field>
            <Field label={t('Costo spedizione (€)', 'Shipping fee (€)')}><Input type="number" step={0.1} value={f.policies.shippingFee} onChange={(e) => setF({ ...f, policies: { ...f.policies, shippingFee: +e.target.value } })} /></Field>
            <Field label={t('Gratis sopra (€)', 'Free over (€)')}><Input type="number" value={f.policies.freeShippingOver} onChange={(e) => setF({ ...f, policies: { ...f.policies, freeShippingOver: +e.target.value } })} /></Field>
          </div>
        </div>}
        {tab === 'account' && <div className="space-y-6">
          <div className="card space-y-2 p-6 text-sm">
            <h3 className="mb-2 text-2xl">{t('Dati aziendali', 'Business data')}</h3>
            {[[t('Ragione sociale', 'Company name'), app?.ragioneSociale], [t('P.IVA', 'VAT no.'), app?.pIva], ['SDI / PEC', `${app?.sdi} / ${app?.pec}`], ['IBAN', app?.iban], [t('Commissione', 'Commission'), `${Math.round(salon.commissionRate * 100)}%`]].map(([l, v]) => <div key={l} className="flex justify-between border-b border-smoke/60 pb-2"><span className="text-mute">{l}</span><span>{v || '—'}</span></div>)}
            <p className="pt-2 text-[12px] text-mute">{t('Per modificare dati fiscali o IBAN contatta il supporto: la modifica richiede una nuova verifica.', 'To change tax data or IBAN contact support: it requires re-verification.')}</p>
          </div>
          <div className="card space-y-3 p-6">
            <h3 className="mb-1 text-2xl">{t('Notifiche', 'Notifications')}</h3>
            <Toggle checked={notif.booking} onChange={(v) => setNotif({ ...notif, booking: v })} label={t('Nuove prenotazioni e cancellazioni', 'New bookings and cancellations')} />
            <Toggle checked={notif.order} onChange={(v) => setNotif({ ...notif, order: v })} label={t('Nuovi ordini', 'New orders')} />
            <Toggle checked={notif.review} onChange={(v) => setNotif({ ...notif, review: v })} label={t('Nuove recensioni', 'New reviews')} />
          </div>
        </div>}
      </div>
    </div>
  );
}
