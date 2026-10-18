import { ArrowLeft, Check, Eye, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_LABELS, fmtDate, fmtDateShort, SALON_STATUS, type SalonStatus, type SellerApplication } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { apiMode } from '@/lib/store';
import { Badge, Button, Checkbox, Field, Img, Modal, Select, Table, Tabs, Textarea, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

export function Applications() {
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<SalonStatus | 'all'>('pending');
  const rows = s.applications.filter((a) => tab === 'all' || a.status === tab).sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  const c = (st: SalonStatus) => s.applications.filter((a) => a.status === st).length;
  return (
    <div>
      <PageHead title={t('Richieste venditori', 'Seller applications')} sub={t('Verifica documenti, P.IVA e foto prima di approvare. Solo i saloni approvati possono vendere.', 'Check documents, VAT and photos before approving. Only approved salons can sell.')} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'pending', label: SALON_STATUS.pending[s.lang], count: c('pending') }, { id: 'needs_info', label: SALON_STATUS.needs_info[s.lang], count: c('needs_info') }, { id: 'draft', label: t('Incomplete', 'Incomplete'), count: c('draft') }, { id: 'approved', label: SALON_STATUS.approved[s.lang], count: c('approved') }, { id: 'rejected', label: SALON_STATUS.rejected[s.lang], count: c('rejected') }, { id: 'all', label: t('Tutte', 'All'), count: s.applications.length }]} /></div>
      <Table<SellerApplication> rows={rows} onRow={(a) => nav(`/admin/richieste/${a.salonId}`)} empty={t('Nessuna richiesta', 'No applications')} cols={[
        { key: 's', head: t('Salone', 'Salon'), cell: (a) => { const x = s.salons.find((y) => y.id === a.salonId)!; return <div className="flex items-center gap-3"><Img src={x.cover} className="h-11 w-11 rounded-xl" /><div><div className="font-semibold">{x.name}</div><div className="text-[11.5px] text-mute">{CATEGORY_LABELS[x.category][s.lang]} · {x.city}</div></div></div>; } },
        { key: 'o', head: t('Titolare', 'Owner'), cell: (a) => s.users.find((u) => u.id === a.ownerId)?.name },
        { key: 'p', head: 'P.IVA', cell: (a) => a.pIva || '—' },
        { key: 'd', head: t('Documenti', 'Docs'), cell: (a) => `${a.documents.length}` },
        { key: 'at', head: t('Inviata', 'Submitted'), cell: (a) => (a.submittedAt ? fmtDateShort(a.submittedAt, s.lang) : '—') },
        { key: 'st', head: t('Stato', 'Status'), cell: (a) => <Badge tone={SALON_STATUS[a.status].tone}>{SALON_STATUS[a.status][s.lang]}</Badge> },
      ]} />
    </div>
  );
}

const REASONS: [string, string][] = [['Documenti illeggibili o scaduti', 'Documents unreadable or expired'], ['Partita IVA non attiva / non corrispondente', 'VAT number inactive / not matching'], ['Foto non reali o di bassa qualità', 'Photos not genuine or low quality'], ['Attività non conforme alle categorie della piattaforma', 'Business outside the platform categories'], ['Manca la SCIA dell’attività', 'Business licence (SCIA) missing']];

export function ApplicationDetail() {
  const { salonId } = useParams();
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const salon = s.salons.find((x) => x.id === salonId);
  const app = s.applications.find((a) => a.salonId === salonId);
  const [mode, setMode] = useState<'reject' | 'info' | null>(null);
  const [reason, setReason] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const [notes, setNotes] = useState(app?.adminNotes ?? '');
  const [check, setCheck] = useState(app?.checklist ?? { docs: false, vat: false, iban: false, photos: false });
  if (!salon || !app) return <div className="text-mute">{t('Richiesta non trovata', 'Application not found')}</div>;
  const owner = s.users.find((u) => u.id === app.ownerId)!;
  const allChecked = Object.values(check).every(Boolean);
  const canDecide = app.status === 'pending' || app.status === 'needs_info';
  const svc = s.services.filter((x) => x.salonId === salon.id).length;
  const prd = s.products.filter((x) => x.salonId === salon.id).length;
  return (
    <div className="max-w-6xl">
      <Link to="/admin/richieste" className="inline-flex items-center gap-2 text-[12.5px] text-mute hover:text-gold"><ArrowLeft size={14} />{t('Richieste', 'Applications')}</Link>
      <PageHead title={salon.name} sub={`${CATEGORY_LABELS[salon.category][s.lang]} · ${salon.city} · ${app.submittedAt ? `${t('inviata', 'submitted')} ${fmtDate(app.submittedAt, s.lang)}` : t('non ancora inviata', 'not submitted yet')}`}
        actions={<><Badge tone={SALON_STATUS[app.status].tone} className="self-center">{SALON_STATUS[app.status][s.lang]}</Badge><Button variant="line" size="sm" to={`/salone/${salon.slug}`}><Eye size={14} />{t('Anteprima vetrina', 'Preview storefront')}</Button></>} />
      {app.rejectionReason && app.status !== 'approved' && <div className="mb-6 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn">{t('Ultimo messaggio al venditore', 'Last message to seller')}: {app.rejectionReason}</div>}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-2xl">{t('Dati aziendali', 'Business data')}</h3>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[[t('Ragione sociale', 'Company name'), app.ragioneSociale], [t('P.IVA', 'VAT no.'), app.pIva], [t('Codice fiscale', 'Tax code'), app.codiceFiscale], ['SDI', app.sdi], ['PEC', app.pec], [t('Sede legale', 'Registered address'), app.legalAddress], ['IBAN', app.iban], [t('Intestatario', 'Holder'), app.accountHolder], [t('Titolare', 'Owner'), `${owner.name} · ${owner.email}`], [t('Telefono', 'Phone'), owner.phone]].map(([l, v]) => <div key={l}><dt className="text-[10.5px] uppercase tracking-[.16em] text-mute">{l}</dt><dd className="mt-0.5 break-words">{v || <span className="text-err">{t('mancante', 'missing')}</span>}</dd></div>)}
            </dl>
          </div>
          <div className="card p-6">
            <h3 className="text-2xl">{t('Documenti', 'Documents')}</h3>
            <ul className="mt-4 space-y-2">
              {app.documents.length === 0 && <li className="text-sm text-err">{t('Nessun documento caricato', 'No documents uploaded')}</li>}
              {app.documents.map((d) => <li key={d.id} className="flex items-center gap-3 rounded-xl border border-smoke px-4 py-3 text-sm"><FileText size={16} className="text-gold" /><span className="flex-1">{d.name}</span><Badge tone="mute">{d.type}</Badge><Button size="sm" variant="ghost" onClick={async () => { if (!apiMode) return setDoc(d.name); const url = await s.apiDocumentUrl!(app.salonId, d.id).catch(() => null); if (url) window.open(url, '_blank', 'noopener'); else toast(t('File demo: nessun documento reale caricato', 'Demo file: no real document uploaded'), 'red'); }}>{t('Apri', 'Open')}</Button></li>)}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-2xl">{t('Profilo e foto', 'Profile & photos')}</h3>
            <p className="mt-2 font-serif text-xl italic text-gold">{salon.tagline || '—'}</p>
            <p className="mt-2 text-sm text-ivory/80">{salon.description || <span className="text-err">{t('Descrizione mancante', 'Missing description')}</span>}</p>
            <p className="mt-2 text-sm text-mute">{salon.address}, {salon.city} · {svc} {t('servizi', 'services')} · {prd} {t('prodotti in bozza', 'draft products')}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">{[salon.cover, ...salon.gallery].filter(Boolean).map((g, i) => <Img key={i} src={g} className="aspect-square rounded-xl" />)}</div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card space-y-3 p-6">
            <h3 className="text-2xl">{t('Checklist verifica', 'Verification checklist')}</h3>
            <Checkbox checked={check.docs} onChange={(v) => setCheck({ ...check, docs: v })}>{t('Visura e documento validi e leggibili', 'Extract and ID valid and legible')}</Checkbox>
            <Checkbox checked={check.vat} onChange={(v) => setCheck({ ...check, vat: v })}>{t('P.IVA attiva (verificata su VIES/AdE)', 'VAT active (checked on VIES/AdE)')}</Checkbox>
            <Checkbox checked={check.iban} onChange={(v) => setCheck({ ...check, iban: v })}>{t('IBAN intestato all’attività', 'IBAN in the business name')}</Checkbox>
            <Checkbox checked={check.photos} onChange={(v) => setCheck({ ...check, photos: v })}>{t('Foto reali e adeguate', 'Real, appropriate photos')}</Checkbox>
            <Field label={t('Note interne', 'Internal notes')}><Textarea className="min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            <Button size="sm" variant="line" onClick={() => { s.setApplicationNotes(salon.id, notes, check); toast(t('Note salvate', 'Notes saved'), 'ok'); }}>{t('Salva note', 'Save notes')}</Button>
          </div>
          <div className="card space-y-3 p-6">
            <h3 className="text-2xl">{t('Decisione', 'Decision')}</h3>
            {!canDecide && <p className="text-sm text-mute">{app.status === 'approved' ? t('Salone già approvato.', 'Salon already approved.') : app.status === 'draft' ? t('Il venditore non ha ancora inviato la richiesta.', 'The seller hasn’t submitted yet.') : t('Richiesta rifiutata.', 'Application rejected.')}</p>}
            <Button full disabled={!canDecide || !allChecked} onClick={() => { s.setApplicationNotes(salon.id, notes, check); s.approveApplication(salon.id); toast(`${salon.name} ${t('approvato e online', 'approved and live')}`, 'ok'); nav('/admin/richieste'); }}><Check size={15} />{t('Approva', 'Approve')}</Button>
            {canDecide && !allChecked && <p className="text-[12px] text-mute">{t('Completa la checklist per approvare.', 'Complete the checklist to approve.')}</p>}
            <Button full variant="line" disabled={!canDecide} onClick={() => { setMode('info'); setReason(''); }}>{t('Richiedi informazioni', 'Request info')}</Button>
            <Button full variant="danger" disabled={app.status === 'rejected' || app.status === 'draft'} onClick={() => { setMode('reject'); setReason(''); }}><X size={15} />{app.status === 'approved' ? t('Revoca / rifiuta', 'Revoke / reject') : t('Rifiuta', 'Reject')}</Button>
          </div>
        </div>
      </div>
      <Modal open={!!mode} onClose={() => setMode(null)} title={mode === 'reject' ? t('Rifiuta richiesta', 'Reject application') : t('Richiedi informazioni', 'Request information')}
        footer={<Button disabled={reason.trim().length < 8} onClick={() => { if (mode === 'reject') s.rejectApplication(salon.id, reason); else s.requestInfo(salon.id, reason); toast(t('Messaggio inviato al venditore', 'Message sent to seller'), 'ok'); setMode(null); nav('/admin/richieste'); }}>{t('Invia', 'Send')}</Button>}>
        <p className="mb-3 text-sm text-mute">{t('Il motivo viene mostrato al venditore, che potrà correggere e inviare di nuovo.', 'The reason is shown to the seller, who can fix and resubmit.')}</p>
        <Select value="" onChange={(e) => setReason(e.target.value)} className="mb-3"><option value="">{t('Motivi frequenti…', 'Common reasons…')}</option>{REASONS.map(([it, en]) => <option key={it}>{t(it, en)}</option>)}</Select>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Scrivi il messaggio (obbligatorio)', 'Write the message (required)')} />
      </Modal>
      <Modal open={!!doc} onClose={() => setDoc(null)} title={doc ?? ''} wide>
        <div className="grid h-80 place-items-center rounded-2xl border border-dashed border-smoke text-center text-sm text-mute"><div><FileText size={40} className="mx-auto mb-3 text-gold" />{t('Anteprima documento', 'Document preview')}<br />{t('In produzione: PDF da storage privato con link firmato a scadenza.', 'In production: PDF from private storage via expiring signed link.')}</div></div>
      </Modal>
    </div>
  );
}
