import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { eur, uid, type Service } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { Badge, Button, Checkbox, Empty, Field, Img, Input, Modal, Select, Textarea, Toggle, toast } from '@/components/ui';
import { GalleryEditor } from '@/components/ImagePicker';
import { ThumbStack } from '@/components/Gallery';
import { PageHead } from '@/components/layout/DashboardLayout';

export default function Services() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const services = s.services.filter((x) => x.salonId === salon.id);
  const staff = s.staff.filter((x) => x.salonId === salon.id);
  const cats = Array.from(new Set(services.map((x) => x.category)));
  const [edit, setEdit] = useState<Service | null>(null);
  const [del, setDel] = useState<Service | null>(null);
  const [newCat, setNewCat] = useState('');
  const blank = (): Service => ({ id: uid('sv'), salonId: salon.id, category: cats[0] ?? 'Taglio', name: '', description: '', image: salon.cover, images: salon.cover ? [salon.cover] : [], durationMin: 30, price: 20, bufferMin: 10, depositPct: 0, active: true });
  const assigned = (svId: string) => staff.filter((m) => m.serviceIds.includes(svId)).map((m) => m.id);
  const [staffSel, setStaffSel] = useState<string[]>([]);
  const open = (sv: Service) => { setEdit({ ...sv, images: sv.images?.length ? sv.images : sv.image ? [sv.image] : [] }); setStaffSel(assigned(sv.id).length ? assigned(sv.id) : staff.map((m) => m.id)); setNewCat(''); };
  const save = () => {
    const sv = { ...edit!, category: newCat.trim() || edit!.category, image: edit!.images[0] ?? '' };
    s.upsertService(sv);
    staff.forEach((m) => { const has = m.serviceIds.includes(sv.id); const want = staffSel.includes(m.id); if (has !== want) s.upsertStaff({ ...m, serviceIds: want ? [...m.serviceIds, sv.id] : m.serviceIds.filter((x) => x !== sv.id) }); });
    toast(t('Servizio salvato', 'Service saved'), 'ok'); setEdit(null);
  };
  return (
    <div>
      <PageHead title={t('Servizi', 'Services')} sub={`${services.length} ${t('servizi', 'services')} · ${salon.status === 'approved' ? t('visibili ai clienti se attivi', 'visible to clients when active') : t('saranno visibili dopo l’approvazione', 'visible after approval')}`} actions={<Button onClick={() => open(blank())}><Plus size={15} />{t('Nuovo servizio', 'New service')}</Button>} />
      {services.length === 0 && <Empty title={t('Nessun servizio', 'No services')} text={t('Aggiungi il tuo listino: nome, durata e prezzo.', 'Add your price list: name, duration and price.')} action={<Button onClick={() => open(blank())}>{t('Aggiungi il primo', 'Add the first one')}</Button>} />}
      <div className="space-y-8">
        {cats.map((c) => (
          <div key={c}>
            <div className="mb-3 flex items-center gap-3"><h3 className="text-3xl">{c}</h3><span className="h-px flex-1 bg-smoke" /></div>
            <div className="space-y-2">
              {services.filter((x) => x.category === c).map((x) => (
                <div key={x.id} className="card flex items-center gap-4 p-3 pr-5">
                  <ThumbStack images={x.images?.length ? x.images : [x.image]} className="h-14 w-14 rounded-xl" />
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-serif text-xl">{x.name}</span>{!x.active && <Badge tone="mute">{t('Disattivo', 'Inactive')}</Badge>}{x.depositPct > 0 && <Badge>{t('Caparra', 'Deposit')} {x.depositPct}%</Badge>}</div><div className="truncate text-[12px] text-mute">{x.durationMin} min · {assigned(x.id).length} {t('operatori', 'staff')} · {x.description}</div></div>
                  <span className="font-serif text-2xl">{eur(x.price)}</span>
                  <Toggle checked={x.active} onChange={(v) => { s.upsertService({ ...x, active: v }); toast(v ? t('Attivato', 'Activated') : t('Disattivato', 'Deactivated')); }} />
                  <button onClick={() => open(x)} className="text-mute hover:text-gold" aria-label={t('Modifica', 'Edit')}><Pencil size={16} /></button>
                  <button onClick={() => setDel(x)} className="text-mute hover:text-crimson" aria-label={t('Elimina', 'Delete')}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit && services.some((x) => x.id === edit.id) ? t('Modifica servizio', 'Edit service') : t('Nuovo servizio', 'New service')} wide footer={<><Button variant="ghost" onClick={() => setEdit(null)}>{t('Annulla', 'Cancel')}</Button><Button disabled={!edit?.name || !edit.price || !edit.images.length} onClick={save}>{t('Salva', 'Save')}</Button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="grid gap-4 sm:col-span-2">
            <Field label={t('Nome *', 'Name *')}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Categoria', 'Category')}><Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{Array.from(new Set([...cats, edit.category])).map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label={t('…o nuova categoria', '…or new category')}><Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={t('Es. Trattamenti', 'E.g. Treatments')} /></Field>
            </div>
          </div>
          <div className="sm:col-span-2"><div className="label">{t('Foto del servizio * (risultati, prima/dopo, ambiente)', 'Service photos * (results, before/after, ambience)')}</div><GalleryEditor images={edit.images} onChange={(images) => setEdit({ ...edit, images, image: images[0] ?? '' })} max={8} /></div>
          <Field label={t('Descrizione', 'Description')} className="sm:col-span-2"><Textarea className="min-h-[80px]" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-4">
            <Field label={t('Durata (min)', 'Duration (min)')}><Input type="number" min={5} step={5} value={edit.durationMin} onChange={(e) => setEdit({ ...edit, durationMin: +e.target.value })} /></Field>
            <Field label={t('Prezzo (€)', 'Price (€)')}><Input type="number" min={0} step={0.5} value={edit.price} onChange={(e) => setEdit({ ...edit, price: +e.target.value })} /></Field>
            <Field label={t('Pausa dopo (min)', 'Buffer (min)')}><Input type="number" min={0} step={5} value={edit.bufferMin} onChange={(e) => setEdit({ ...edit, bufferMin: +e.target.value })} /></Field>
            <Field label={t('Caparra %', 'Deposit %')}><Select value={edit.depositPct} onChange={(e) => setEdit({ ...edit, depositPct: +e.target.value })}>{[0, 10, 20, 30, 50].map((p) => <option key={p} value={p}>{p}%</option>)}</Select></Field>
          </div>
          <div className="sm:col-span-2"><div className="label">{t('Chi lo esegue', 'Performed by')}</div><div className="flex flex-wrap gap-4">{staff.map((m) => <Checkbox key={m.id} checked={staffSel.includes(m.id)} onChange={(v) => setStaffSel(v ? [...staffSel, m.id] : staffSel.filter((x) => x !== m.id))}>{m.name}</Checkbox>)}{staff.length === 0 && <span className="text-sm text-mute">{t('Aggiungi prima lo staff.', 'Add staff first.')}</span>}</div></div>
          <div className="sm:col-span-2"><Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label={t('Prenotabile online', 'Bookable online')} /></div>
        </div>}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title={t('Eliminare il servizio?', 'Delete service?')} footer={<><Button variant="ghost" onClick={() => setDel(null)}>{t('Annulla', 'Cancel')}</Button><Button onClick={() => { s.deleteService(del!.id); toast(t('Servizio eliminato', 'Service deleted')); setDel(null); }}>{t('Elimina', 'Delete')}</Button></>}>
        <p className="text-sm text-ivory/85">{t('Le prenotazioni già fatte restano valide. In alternativa puoi disattivarlo.', 'Existing bookings remain valid. Alternatively you can deactivate it.')}</p>
      </Modal>
    </div>
  );
}
