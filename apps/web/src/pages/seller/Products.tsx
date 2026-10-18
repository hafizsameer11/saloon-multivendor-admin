import { ArrowLeft, Copy, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BRANDS, eur, PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS, uid, type Product, type ProductCategory, type ProductStatus } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { Badge, Button, Field, Img, Input, Modal, Select, Table, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { GalleryEditor } from '@/components/ImagePicker';
import { ThumbStack } from '@/components/Gallery';
import { PageHead } from '@/components/layout/DashboardLayout';

export function Products() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const nav = useNavigate();
  const [tab, setTab] = useState<'all' | ProductStatus>('all');
  const [q, setQ] = useState('');
  const all = s.products.filter((p) => p.salonId === salon.id);
  const rows = all.filter((p) => (tab === 'all' || p.status === tab) && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())));
  const count = (st: ProductStatus) => all.filter((p) => p.status === st).length;
  return (
    <div>
      <PageHead title={t('Prodotti', 'Products')} sub={t('Ogni nuovo prodotto viene verificato dall’admin prima della pubblicazione (conformità cosmetici UE).', 'Every new product is checked by admin before publishing (EU cosmetics compliance).')} actions={<Button to="/seller/prodotti/nuovo"><Plus size={15} />{t('Nuovo prodotto', 'New product')}</Button>} />
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: t('Tutti', 'All'), count: all.length }, { id: 'published', label: PRODUCT_STATUS.published[s.lang], count: count('published') }, { id: 'review', label: PRODUCT_STATUS.review[s.lang], count: count('review') }, { id: 'draft', label: PRODUCT_STATUS.draft[s.lang], count: count('draft') }, { id: 'rejected', label: PRODUCT_STATUS.rejected[s.lang], count: count('rejected') }]} />
        <div className="relative md:w-72"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" /><Input className="!pl-10 !py-2.5" placeholder={t('Cerca nome o SKU', 'Search name or SKU')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <Table<Product> rows={rows} onRow={(p) => nav(`/seller/prodotti/${p.id}`)} empty={t('Nessun prodotto', 'No products')} cols={[
        { key: 'p', head: t('Prodotto', 'Product'), cell: (p) => <div className="flex items-center gap-3"><ThumbStack images={p.images} className="h-12 w-12 rounded-xl" /><div><div className="font-semibold">{p.name}</div><div className="text-[11.5px] text-mute">{p.brand} · {p.sku}</div></div></div> },
        { key: 'c', head: t('Categoria', 'Category'), cell: (p) => PRODUCT_CATEGORY_LABELS[p.category][s.lang] },
        { key: 'pr', head: t('Prezzo', 'Price'), cell: (p) => eur(p.price) },
        { key: 'st', head: 'Stock', cell: (p) => <span className={p.stock <= 5 ? 'text-err' : ''}>{p.stock}</span> },
        { key: 'so', head: t('Venduti', 'Sold'), cell: (p) => p.sold },
        { key: 's', head: t('Stato', 'Status'), cell: (p) => <div><Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status][s.lang]}</Badge>{p.rejectionReason && p.status === 'rejected' && <div className="mt-1 max-w-[200px] text-[11px] text-err">{p.rejectionReason}</div>}</div> },
      ]} />
    </div>
  );
}

export function ProductEditor() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const nav = useNavigate();
  const existing = s.products.find((p) => p.id === id && p.salonId === salon.id);
  const [p, setP] = useState<Product>(() => existing ?? {
    id: uid('p'), salonId: salon.id, brand: BRANDS[0], category: 'capelli', name: '', short: '', description: '', images: [], price: 0, stock: 10, sku: `${salon.slug.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
    variants: [], inci: '', howToUse: '', rating: 0, reviewCount: 0, status: 'draft', weightGr: 200, createdAt: new Date().toISOString(), sold: 0,
  });
  const [del, setDel] = useState(false);
  const [sale, setSale] = useState(!!p.compareAtPrice);
  const isNew = !existing;
  const up = (patch: Partial<Product>) => setP({ ...p, ...patch });
  const errors = { name: p.name.length < 3, images: p.images.length < 1, price: p.price <= 0, inci: p.inci.length < 10, desc: p.description.length < 20 };
  const ok = !Object.values(errors).some(Boolean);
  const save = (submit: boolean) => {
    const status: ProductStatus = submit ? (salon.status === 'approved' ? 'review' : 'draft') : (existing?.status === 'published' ? 'review' : 'draft');
    s.upsertProduct({ ...p, compareAtPrice: sale ? p.compareAtPrice : undefined, status, rejectionReason: undefined });
    toast(submit ? (salon.status === 'approved' ? t('Inviato in revisione all’admin', 'Sent to admin for review') : t('Salvato: sarà inviato in revisione dopo l’approvazione del salone', 'Saved: will be reviewed after salon approval')) : t('Bozza salvata', 'Draft saved'), 'ok');
    nav('/seller/prodotti');
  };
  return (
    <div className="max-w-5xl">
      <Link to="/seller/prodotti" className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-gold"><ArrowLeft size={14} />{t('Prodotti', 'Products')}</Link>
      <PageHead title={isNew ? t('Nuovo prodotto', 'New product') : p.name} sub={existing ? `${PRODUCT_STATUS[existing.status][s.lang]} · SKU ${p.sku}` : undefined}
        actions={!isNew && <><Button variant="line" size="sm" to={`/prodotto/${p.id}`}><Eye size={14} />{t('Anteprima', 'Preview')}</Button><Button variant="line" size="sm" onClick={() => { s.upsertProduct({ ...p, id: uid('p'), name: p.name + ' (copia)', status: 'draft', sold: 0 }); toast(t('Prodotto duplicato', 'Product duplicated')); nav('/seller/prodotti'); }}><Copy size={14} />{t('Duplica', 'Duplicate')}</Button><Button variant="danger" size="sm" onClick={() => setDel(true)}><Trash2 size={14} /></Button></>} />
      {existing?.status === 'published' && <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm">{t('Modificando un prodotto pubblicato verrà inviato di nuovo in revisione.', 'Editing a published product will send it back for review.')}</div>}
      {existing?.status === 'rejected' && <div className="mb-5 rounded-2xl border border-crimson/40 bg-crimson/10 p-4 text-sm text-err">{t('Motivo del rifiuto', 'Rejection reason')}: {existing.rejectionReason}</div>}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="card space-y-4 p-6">
            <h3 className="text-2xl">{t('Informazioni', 'Details')}</h3>
            <Field label={t('Nome *', 'Name *')} error={errors.name && p.name ? t('Minimo 3 caratteri', 'Min 3 chars') : undefined}><Input value={p.name} onChange={(e) => up({ name: e.target.value })} /></Field>
            <Field label={t('Sottotitolo', 'Short description')}><Input value={p.short} onChange={(e) => up({ short: e.target.value })} placeholder={t('Es. Con olio d’oliva e proteine della seta', 'E.g. With olive oil and silk proteins')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand"><Input value={p.brand} onChange={(e) => up({ brand: e.target.value })} list="brands" /><datalist id="brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist></Field>
              <Field label={t('Categoria', 'Category')}><Select value={p.category} onChange={(e) => up({ category: e.target.value as ProductCategory })}>{(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((c) => <option key={c} value={c}>{PRODUCT_CATEGORY_LABELS[c][s.lang]}</option>)}</Select></Field>
            </div>
            <Field label={t('Descrizione * (min. 20 caratteri)', 'Description * (min 20 chars)')}><Textarea value={p.description} onChange={(e) => up({ description: e.target.value })} /></Field>
            <Field label={t('Modo d’uso', 'How to use')}><Textarea className="min-h-[80px]" value={p.howToUse} onChange={(e) => up({ howToUse: e.target.value })} /></Field>
            <Field label={t('Ingredienti INCI * (obbligatorio per i cosmetici UE)', 'INCI ingredients * (required for EU cosmetics)')}><Textarea className="min-h-[80px] font-mono text-[12.5px]" value={p.inci} onChange={(e) => up({ inci: e.target.value })} placeholder="Aqua, Glycerin, …" /></Field>
          </div>
          <div className="card p-6"><h3 className="mb-4 text-2xl">{t('Foto *', 'Photos *')}</h3><GalleryEditor images={p.images} onChange={(images) => up({ images })} max={10} label={t('Principale', 'Main')} /></div>
          <div className="card space-y-3 p-6">
            <div className="flex items-center justify-between"><h3 className="text-2xl">{t('Varianti', 'Variants')}</h3><Button size="sm" variant="line" onClick={() => up({ variants: [...p.variants, { id: uid('v'), label: '', priceDelta: 0, stock: 10 }] })}><Plus size={13} />{t('Aggiungi', 'Add')}</Button></div>
            {p.variants.length === 0 && <p className="text-sm text-mute">{t('Facoltativo: formati (250 ml / 1 L) o colori.', 'Optional: sizes (250 ml / 1 L) or shades.')}</p>}
            {p.variants.map((v, i) => (
              <div key={v.id} className="grid grid-cols-[1fr_110px_90px_auto] items-end gap-2">
                <Field label={i === 0 ? t('Etichetta', 'Label') : undefined}><Input value={v.label} onChange={(e) => up({ variants: p.variants.map((x) => (x.id === v.id ? { ...x, label: e.target.value } : x)) })} placeholder="250 ml" /></Field>
                <Field label={i === 0 ? '+ €' : undefined}><Input type="number" value={v.priceDelta} onChange={(e) => up({ variants: p.variants.map((x) => (x.id === v.id ? { ...x, priceDelta: +e.target.value } : x)) })} /></Field>
                <Field label={i === 0 ? 'Stock' : undefined}><Input type="number" value={v.stock} onChange={(e) => up({ variants: p.variants.map((x) => (x.id === v.id ? { ...x, stock: +e.target.value } : x)) })} /></Field>
                <button className="mb-3 text-mute hover:text-crimson" onClick={() => up({ variants: p.variants.filter((x) => x.id !== v.id) })} aria-label={t('Rimuovi', 'Remove')}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card space-y-4 p-6">
            <h3 className="text-2xl">{t('Prezzo e stock', 'Price & stock')}</h3>
            <Field label={t('Prezzo (€) * IVA inclusa', 'Price (€) * VAT incl.')}><Input type="number" step={0.1} min={0} value={p.price || ''} onChange={(e) => up({ price: +e.target.value })} /></Field>
            <Toggle checked={sale} onChange={setSale} label={t('In promozione (prezzo barrato)', 'On sale (compare-at price)')} />
            {sale && <Field label={t('Prezzo originale (€)', 'Original price (€)')}><Input type="number" step={0.1} value={p.compareAtPrice ?? ''} onChange={(e) => up({ compareAtPrice: +e.target.value })} /></Field>}
            <div className="grid grid-cols-2 gap-3"><Field label="Stock"><Input type="number" value={p.stock} onChange={(e) => up({ stock: +e.target.value })} /></Field><Field label="SKU"><Input value={p.sku} onChange={(e) => up({ sku: e.target.value })} /></Field></div>
            <Field label={t('Peso spedizione (g)', 'Shipping weight (g)')}><Input type="number" value={p.weightGr} onChange={(e) => up({ weightGr: +e.target.value })} /></Field>
            <div className="rounded-xl border border-smoke p-3 text-[12.5px] text-mute">{t('Ricavo stimato per pezzo', 'Estimated payout per unit')}: <b className="text-ivory">{eur(Math.round(p.price * (1 - salon.commissionRate) * 100) / 100)}</b> ({t('commissione', 'commission')} {Math.round(salon.commissionRate * 100)}%)</div>
          </div>
          <div className="card space-y-3 p-6">
            <h3 className="text-2xl">{t('Pubblicazione', 'Publishing')}</h3>
            <ul className="space-y-1.5 text-[13px]">
              {[[!errors.name, t('Nome', 'Name')], [!errors.desc, t('Descrizione', 'Description')], [!errors.images, t('Almeno 1 foto', 'At least 1 photo')], [!errors.price, t('Prezzo', 'Price')], [!errors.inci, 'INCI']].map(([v, l]) => <li key={String(l)} className={v ? 'text-ok' : 'text-mute'}>{v ? '✓' : '○'} {l}</li>)}
            </ul>
            <Button full disabled={!ok} onClick={() => save(true)}>{t('Invia in revisione', 'Submit for review')}</Button>
            <Button full variant="line" disabled={!p.name} onClick={() => save(false)}>{t('Salva bozza', 'Save draft')}</Button>
            {salon.status !== 'approved' && <p className="text-[12px] text-mute">{t('Il salone non è ancora approvato: il prodotto resta in bozza fino all’approvazione.', 'Salon not approved yet: the product stays as a draft until approval.')}</p>}
          </div>
        </div>
      </div>
      <Modal open={del} onClose={() => setDel(false)} title={t('Eliminare il prodotto?', 'Delete product?')} footer={<><Button variant="ghost" onClick={() => setDel(false)}>{t('Annulla', 'Cancel')}</Button><Button onClick={() => { s.deleteProduct(p.id); toast(t('Prodotto eliminato', 'Product deleted')); nav('/seller/prodotti'); }}>{t('Elimina', 'Delete')}</Button></>}>
        <p className="text-sm">{t('Gli ordini già effettuati restano visibili.', 'Existing orders remain visible.')}</p>
      </Modal>
    </div>
  );
}
