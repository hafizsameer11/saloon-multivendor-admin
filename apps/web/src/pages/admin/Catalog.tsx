import { Check, Eye, Search, Star, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, eur, fmtDateShort, PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS, SALON_STATUS, type Product, type ProductStatus, type Salon } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Badge, Button, Drawer, Field, Img, Input, Modal, Select, Table, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';
import { MediaGallery } from '@/components/Gallery';

export function AdminSalons() {
  const t = useT();
  const s = useStore();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [sel, setSel] = useState<Salon | null>(null);
  const rows = s.salons.filter((x) => (!st || x.status === st) && (!q || x.name.toLowerCase().includes(q.toLowerCase()) || x.city.toLowerCase().includes(q.toLowerCase())));
  const cur = sel && s.salons.find((x) => x.id === sel.id)!;
  const stats = (id: string) => ({ b: s.bookings.filter((b) => b.salonId === id && b.status === 'completed').length, o: s.subOrders.filter((x) => x.salonId === id).length, p: s.products.filter((p) => p.salonId === id && p.status === 'published').length });
  return (
    <div>
      <PageHead title={t('Saloni', 'Salons')} sub={`${s.salons.length} ${t('totali', 'total')}`} />
      <div className="mb-5 flex flex-wrap gap-3"><div className="relative w-72"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" /><Input className="!pl-10 !py-2.5" placeholder={t('Cerca salone o città', 'Search salon or city')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={st} onChange={(e) => setSt(e.target.value)} className="!py-2.5"><option value="">{t('Tutti gli stati', 'All statuses')}</option>{Object.entries(SALON_STATUS).map(([k, v]) => <option key={k} value={k}>{v[s.lang]}</option>)}</Select></div>
      <Table<Salon> rows={rows} onRow={setSel} cols={[
        { key: 'n', head: t('Salone', 'Salon'), cell: (x) => <div className="flex items-center gap-3"><Img src={x.cover} className="h-11 w-11 rounded-xl" /><div><div className="flex items-center gap-1.5 font-semibold">{x.name}{x.featured && <Star size={12} className="text-gold" fill="currentColor" />}</div><div className="text-[11.5px] text-mute">{CATEGORY_LABELS[x.category][s.lang]}</div></div></div> },
        { key: 'c', head: t('Città', 'City'), cell: (x) => x.city },
        { key: 'r', head: t('Voto', 'Rating'), cell: (x) => (x.rating ? `★ ${x.rating.toFixed(1)}` : '—') },
        { key: 'k', head: t('Commissione', 'Commission'), cell: (x) => `${Math.round(x.commissionRate * 100)}%` },
        { key: 'b', head: t('Prenot. completate', 'Completed bookings'), cell: (x) => stats(x.id).b },
        { key: 's', head: t('Stato', 'Status'), cell: (x) => <Badge tone={SALON_STATUS[x.status].tone}>{SALON_STATUS[x.status][s.lang]}</Badge> },
      ]} />
      <Drawer open={!!cur} onClose={() => setSel(null)} title={cur?.name}>
        {cur && <div className="space-y-5">
          <Img src={cur.cover} className="h-40 rounded-2xl" />
          <div className="grid grid-cols-3 gap-2 text-center">{[[t('Prenot.', 'Bookings'), stats(cur.id).b], [t('Ordini', 'Orders'), stats(cur.id).o], [t('Prodotti', 'Products'), stats(cur.id).p]].map(([l, v]) => <div key={String(l)} className="rounded-xl border border-smoke p-3"><div className="font-serif text-3xl">{v}</div><div className="text-[11px] text-mute">{l}</div></div>)}</div>
          <Field label={t('Commissione', 'Commission')}><Select value={Math.round(cur.commissionRate * 100)} onChange={(e) => { s.setCommission(cur.id, +e.target.value / 100); toast(t('Commissione aggiornata', 'Commission updated'), 'ok'); }}>{[8, 10, 12, 15, 18, 20].map((p) => <option key={p} value={p}>{p}%</option>)}</Select></Field>
          <Toggle checked={!!cur.featured} onChange={() => { s.toggleFeatured(cur.id); toast(t('Aggiornato', 'Updated')); }} label={t('In evidenza in homepage', 'Featured on homepage')} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="line" to={`/salone/${cur.slug}`}><Eye size={14} />{t('Vetrina', 'Storefront')}</Button>
            <Button size="sm" variant="line" to={`/admin/richieste/${cur.id}`}>{t('Richiesta', 'Application')}</Button>
            {cur.status === 'approved' && <Button size="sm" variant="danger" onClick={() => { s.setSalonStatus(cur.id, 'suspended'); toast(t('Salone sospeso: non è più visibile', 'Salon suspended: no longer visible')); }}>{t('Sospendi', 'Suspend')}</Button>}
            {cur.status === 'suspended' && <Button size="sm" onClick={() => { s.setSalonStatus(cur.id, 'approved'); toast(t('Salone riattivato', 'Salon reactivated'), 'ok'); }}>{t('Riattiva', 'Reactivate')}</Button>}
          </div>
        </div>}
      </Drawer>
    </div>
  );
}

export function AdminProducts() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<ProductStatus | 'all'>('review');
  const [sel, setSel] = useState<Product | null>(null);
  const [rej, setRej] = useState(false);
  const [reason, setReason] = useState('');
  const rows = s.products.filter((p) => tab === 'all' || p.status === tab);
  const c = (st: ProductStatus) => s.products.filter((p) => p.status === st).length;
  return (
    <div>
      <PageHead title={t('Moderazione prodotti', 'Product moderation')} sub={t('Controlla INCI, foto e descrizioni prima della pubblicazione (Reg. CE 1223/2009).', 'Check INCI, photos and descriptions before publishing (Reg. EC 1223/2009).')} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'review', label: PRODUCT_STATUS.review[s.lang], count: c('review') }, { id: 'published', label: PRODUCT_STATUS.published[s.lang], count: c('published') }, { id: 'rejected', label: PRODUCT_STATUS.rejected[s.lang], count: c('rejected') }, { id: 'draft', label: PRODUCT_STATUS.draft[s.lang], count: c('draft') }, { id: 'all', label: t('Tutti', 'All'), count: s.products.length }]} /></div>
      <Table<Product> rows={rows} onRow={setSel} empty={t('Niente da moderare 🎉', 'Nothing to moderate 🎉')} cols={[
        { key: 'p', head: t('Prodotto', 'Product'), cell: (p) => <div className="flex items-center gap-3"><Img src={p.images[0]} className="h-12 w-12 rounded-xl" /><div><div className="font-semibold">{p.name}</div><div className="text-[11.5px] text-mute">{p.brand}</div></div></div> },
        { key: 's', head: t('Salone', 'Salon'), cell: (p) => s.salons.find((x) => x.id === p.salonId)?.name },
        { key: 'c', head: t('Categoria', 'Category'), cell: (p) => PRODUCT_CATEGORY_LABELS[p.category][s.lang] },
        { key: 'pr', head: t('Prezzo', 'Price'), cell: (p) => eur(p.price) },
        { key: 'd', head: t('Creato', 'Created'), cell: (p) => fmtDateShort(p.createdAt, s.lang) },
        { key: 'st', head: t('Stato', 'Status'), cell: (p) => <Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status][s.lang]}</Badge> },
      ]} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} footer={sel && sel.status === 'review' ? <div className="flex gap-2"><Button className="flex-1" onClick={() => { s.moderateProduct(sel.id, true); toast(t('Prodotto pubblicato', 'Product published'), 'ok'); setSel(null); }}><Check size={15} />{t('Approva', 'Approve')}</Button><Button variant="danger" onClick={() => { setRej(true); setReason(''); }}><X size={15} />{t('Rifiuta', 'Reject')}</Button></div> : sel?.status === 'published' ? <Button full variant="danger" onClick={() => { setRej(true); setReason(''); }}>{t('Ritira dalla vendita', 'Remove from sale')}</Button> : undefined}>
        {sel && <div className="space-y-4 text-sm">
          <MediaGallery images={sel.images} title={sel.name} aspect="aspect-square" thumbs="bottom" rounded="rounded-2xl" />
          <div><span className="label">{t('Salone', 'Salon')}</span>{s.salons.find((x) => x.id === sel.salonId)?.name}</div>
          <div><span className="label">{t('Descrizione', 'Description')}</span>{sel.description}</div>
          <div><span className="label">INCI</span><span className="font-mono text-[12px]">{sel.inci || <span className="text-err">{t('mancante', 'missing')}</span>}</span></div>
          <div><span className="label">{t('Modo d’uso', 'How to use')}</span>{sel.howToUse || '—'}</div>
          <div className="grid grid-cols-3 gap-2"><div><span className="label">{t('Prezzo', 'Price')}</span>{eur(sel.price)}</div><div><span className="label">Stock</span>{sel.stock}</div><div><span className="label">SKU</span>{sel.sku}</div></div>
          {sel.variants.length > 0 && <div><span className="label">{t('Varianti', 'Variants')}</span>{sel.variants.map((v) => v.label).join(', ')}</div>}
        </div>}
      </Drawer>
      <Modal open={rej} onClose={() => setRej(false)} title={t('Motivo del rifiuto', 'Rejection reason')} footer={<Button disabled={reason.length < 5} onClick={() => { s.moderateProduct(sel!.id, false, reason); toast(t('Venditore avvisato', 'Seller notified')); setRej(false); setSel(null); }}>{t('Invia', 'Send')}</Button>}>
        <Select value="" onChange={(e) => setReason(e.target.value)} className="mb-3"><option value="">{t('Motivi frequenti…', 'Common reasons…')}</option>{[t('Elenco INCI incompleto o mancante', 'INCI list incomplete or missing'), t('Foto non corrispondenti al prodotto', 'Photos don’t match the product'), t('Prodotto non ammesso sulla piattaforma', 'Product not allowed on the platform'), t('Claim non consentiti (es. “cura”, “guarisce”)', 'Claims not allowed (e.g. “cures”, “heals”)')].map((r) => <option key={r}>{r}</option>)}</Select>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </div>
  );
}
