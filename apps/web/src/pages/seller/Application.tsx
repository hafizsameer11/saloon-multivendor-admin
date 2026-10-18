import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_LABELS, CITIES, uid, type SalonCategory } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import { apiMode } from '@/lib/store';
import { errorText } from '@shared/api/client';
import { Button, Checkbox, Field, FileDrop, Input, Select, Stepper, Textarea, toast } from '@/components/ui';
import { GalleryEditor } from '@/components/ImagePicker';
import { PageHead } from '@/components/layout/DashboardLayout';

const ibanOk = (v: string) => /^IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}$/.test(v.replace(/\s/g, '').toUpperCase());
const pivaOk = (v: string) => /^\d{11}$/.test(v.replace(/\s/g, ''));

export default function Application() {
  const t = useT();
  const s = useStore();
  const salon = useMySalon()!;
  const app = s.applications.find((a) => a.salonId === salon.id)!;
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState(false);
  const locked = app.status === 'pending' || app.status === 'approved';
  const A = (patch: Partial<typeof app>) => s.saveApplication(patch);
  const S = (patch: Partial<typeof salon>) => s.updateSalon(salon.id, patch);
  const steps = [t('Dati aziendali', 'Business data'), t('Profilo salone', 'Salon profile'), t('Foto', 'Photos'), t('Documenti', 'Documents'), t('Pagamenti e invio', 'Payouts & submit')];
  const images = [salon.cover, ...salon.gallery].filter(Boolean);
  const valid = [
    app.ragioneSociale.length > 2 && pivaOk(app.pIva) && app.codiceFiscale.length >= 11 && (app.sdi.length === 7 || app.pec.includes('@')) && app.legalAddress.length > 5,
    salon.name.length > 2 && salon.address.length > 4 && salon.tagline.length > 3 && salon.description.length > 30 && salon.phone.length > 5,
    images.length >= 3,
    app.documents.some((d) => d.type === 'visura') && app.documents.some((d) => d.type === 'id'),
    ibanOk(app.iban) && app.accountHolder.length > 3 && terms,
  ];
  const err = (cond: boolean, msg: string) => (touched && !cond ? msg : undefined);
  const next = () => { setTouched(true); if (!valid[step]) { toast(t('Completa i campi obbligatori', 'Complete the required fields'), 'red'); return; } setTouched(false); setStep(step + 1); };
  const submit = () => { setTouched(true); if (!valid.every(Boolean)) { toast(t('Alcuni passaggi sono incompleti', 'Some steps are incomplete'), 'red'); return; } s.submitApplication(); toast(t('Richiesta inviata! Ti avviseremo entro 48 ore.', 'Application sent! We’ll update you within 48h.'), 'ok'); nav('/seller'); };
  const addDocs = (type: 'visura' | 'id' | 'license' | 'other') => (names: string[], raw: File[] = []) => apiMode
    ? void s.addSellerDocuments!(type, raw.map((f) => ({ file: f, name: f.name }))).then(() => toast(t('Documento caricato', 'Document uploaded'), 'ok')).catch((e) => toast(errorText(e), 'red'))
    : A({ documents: [...app.documents, ...names.map((n) => ({ id: uid('d'), type, name: n, uploadedAt: new Date().toISOString() }))] });

  if (locked) return (
    <div className="card max-w-2xl p-10 text-center"><h2 className="text-4xl">{t('Richiesta già inviata', 'Application already sent')}</h2><p className="mt-2 text-mute">{t('Stiamo verificando i tuoi dati. Puoi seguire lo stato dalla dashboard.', 'We’re reviewing your data. Follow the status from your dashboard.')}</p><Button to="/seller" className="mt-6">Dashboard</Button></div>
  );

  return (
    <div className="max-w-3xl">
      <PageHead title={t('Richiesta di approvazione', 'Approval request')} sub={t('Compila tutti i passaggi: le modifiche vengono salvate automaticamente.', 'Complete all steps: changes are saved automatically.')} />
      {(app.status === 'needs_info' || app.status === 'rejected') && app.rejectionReason && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm"><AlertTriangle size={18} className="shrink-0 text-warn" /><div><b className="text-warn">{t('Richiesta dall’admin', 'Admin request')}:</b> {app.rejectionReason}</div></div>
      )}
      <Stepper steps={steps} current={step} />
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="card mt-6 space-y-4 p-6 md:p-8">
          {step === 0 && <>
            <h3 className="text-3xl">{steps[0]}</h3>
            <Field label={t('Ragione sociale *', 'Company name *')} error={err(app.ragioneSociale.length > 2, t('Obbligatorio', 'Required'))}><Input value={app.ragioneSociale} onChange={(e) => A({ ragioneSociale: e.target.value })} placeholder={t('Es. Barberia Elite di Marco Scalise', 'E.g. Barberia Elite di Marco Scalise')} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Partita IVA *', 'VAT number *')} hint={t('11 cifre', '11 digits')} error={err(pivaOk(app.pIva), t('La P.IVA deve avere 11 cifre', 'VAT must be 11 digits'))}><Input inputMode="numeric" value={app.pIva} onChange={(e) => A({ pIva: e.target.value.replace(/\D/g, '').slice(0, 11) })} /></Field>
              <Field label={t('Codice fiscale *', 'Tax code *')} error={err(app.codiceFiscale.length >= 11, t('Obbligatorio', 'Required'))}><Input value={app.codiceFiscale} onChange={(e) => A({ codiceFiscale: e.target.value.toUpperCase().slice(0, 16) })} /></Field>
              <Field label={t('Codice SDI', 'SDI code')} hint={t('Per la fatturazione elettronica (7 caratteri) oppure PEC', 'For e-invoicing (7 chars) or PEC')}><Input value={app.sdi} onChange={(e) => A({ sdi: e.target.value.toUpperCase().slice(0, 7) })} /></Field>
              <Field label="PEC" error={err(app.sdi.length === 7 || app.pec.includes('@'), t('Inserisci SDI o PEC', 'Enter SDI or PEC'))}><Input type="email" value={app.pec} onChange={(e) => A({ pec: e.target.value })} /></Field>
            </div>
            <Field label={t('Sede legale *', 'Registered address *')} error={err(app.legalAddress.length > 5, t('Obbligatorio', 'Required'))}><Input value={app.legalAddress} onChange={(e) => A({ legalAddress: e.target.value })} /></Field>
          </>}
          {step === 1 && <>
            <h3 className="text-3xl">{steps[1]}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Nome del salone *', 'Salon name *')}><Input value={salon.name} onChange={(e) => S({ name: e.target.value })} /></Field>
              <Field label={t('Categoria', 'Category')}><Select value={salon.category} onChange={(e) => S({ category: e.target.value as SalonCategory })}>{(Object.keys(CATEGORY_LABELS) as SalonCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c][s.lang]}</option>)}</Select></Field>
              <Field label={t('Città', 'City')}><Select value={salon.city} onChange={(e) => S({ city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
              <Field label={t('Indirizzo del salone *', 'Salon address *')} error={err(salon.address.length > 4, t('Obbligatorio', 'Required'))}><Input value={salon.address} onChange={(e) => S({ address: e.target.value })} placeholder="Via Roma 12" /></Field>
              <Field label={t('Telefono salone *', 'Salon phone *')}><Input value={salon.phone} onChange={(e) => S({ phone: e.target.value })} /></Field>
              <Field label={t('Fascia di prezzo', 'Price level')}><Select value={salon.priceLevel} onChange={(e) => S({ priceLevel: +e.target.value as 1 | 2 | 3 })}><option value={1}>€</option><option value={2}>€€</option><option value={3}>€€€</option></Select></Field>
            </div>
            <Field label={t('Slogan *', 'Tagline *')} error={err(salon.tagline.length > 3, t('Obbligatorio', 'Required'))}><Input value={salon.tagline} onChange={(e) => S({ tagline: e.target.value })} placeholder={t('Es. Colore couture e tagli su misura', 'E.g. Couture colour and tailored cuts')} /></Field>
            <Field label={t('Descrizione * (min. 30 caratteri)', 'Description * (min 30 chars)')} error={err(salon.description.length > 30, `${salon.description.length}/30`)}><Textarea value={salon.description} onChange={(e) => S({ description: e.target.value })} /></Field>
          </>}
          {step === 2 && <>
            <h3 className="text-3xl">{steps[2]}</h3>
            <p className="text-sm text-mute">{t('Almeno 3 foto reali del salone. La prima è la copertina. Foto luminose e orizzontali funzionano meglio.', 'At least 3 real photos. The first is the cover. Bright, landscape photos work best.')}</p>
            <GalleryEditor images={images} onChange={(x) => S({ cover: x[0] ?? '', gallery: x.slice(1) })} />
            {touched && !valid[2] && <p className="text-[12px] text-err">{t('Servono almeno 3 foto', 'At least 3 photos required')} ({images.length}/3)</p>}
          </>}
          {step === 3 && <>
            <h3 className="text-3xl">{steps[3]}</h3>
            <p className="text-sm text-mute">{t('I documenti sono visibili solo al team di verifica e conservati in modo criptato.', 'Documents are visible only to the verification team and stored encrypted.')}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div><div className="label">{t('Visura camerale *', 'Chamber of commerce extract *')}</div><FileDrop label={t('Carica visura', 'Upload extract')} files={app.documents.filter((d) => d.type === 'visura')} onAdd={addDocs('visura')} onRemove={(id) => A({ documents: app.documents.filter((d) => d.id !== id) })} /></div>
              <div><div className="label">{t('Documento d’identità *', 'ID document *')}</div><FileDrop label={t('Carica documento', 'Upload ID')} files={app.documents.filter((d) => d.type === 'id')} onAdd={addDocs('id')} onRemove={(id) => A({ documents: app.documents.filter((d) => d.id !== id) })} /></div>
              <div className="md:col-span-2"><div className="label">{t('SCIA / licenze (consigliato)', 'SCIA / licences (recommended)')}</div><FileDrop label={t('Carica SCIA o altre licenze', 'Upload SCIA or other licences')} files={app.documents.filter((d) => d.type === 'license' || d.type === 'other')} onAdd={addDocs('license')} onRemove={(id) => A({ documents: app.documents.filter((d) => d.id !== id) })} /></div>
            </div>
            {touched && !valid[3] && <p className="text-[12px] text-err">{t('Visura e documento d’identità sono obbligatori', 'Extract and ID are required')}</p>}
          </>}
          {step === 4 && <>
            <h3 className="text-3xl">{steps[4]}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="IBAN *" hint="IT60 X054 2811 1010 0000 0123 456" error={err(ibanOk(app.iban), t('IBAN italiano non valido', 'Invalid Italian IBAN'))} className="sm:col-span-2"><Input value={app.iban} onChange={(e) => A({ iban: e.target.value.toUpperCase() })} /></Field>
              <Field label={t('Intestatario conto *', 'Account holder *')}><Input value={app.accountHolder} onChange={(e) => A({ accountHolder: e.target.value })} /></Field>
            </div>
            <div className="rounded-2xl border border-smoke p-5">
              <div className="eyebrow mb-3 text-[10px]">{t('Riepilogo', 'Summary')}</div>
              <ul className="space-y-2 text-sm">{steps.slice(0, 4).map((x, i) => <li key={x} className="flex items-center justify-between"><span>{x}</span>{valid[i] ? <span className="flex items-center gap-1 text-ok"><Check size={14} />OK</span> : <button className="text-warn underline" onClick={() => setStep(i)}>{t('Da completare', 'Incomplete')}</button>}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-gold/25 bg-gold/5 p-4 text-sm text-ivory/85">{t('Commissione piattaforma: 12% su servizi e prodotti venduti tramite MyBeauty+. Nessun canone fisso. Payout mensile sull’IBAN indicato.', 'Platform commission: 12% on services and products sold via MyBeauty+. No fixed fee. Monthly payout to the IBAN above.')}</div>
            <Checkbox checked={terms} onChange={setTerms}>{t('Accetto le condizioni per i venditori e confermo che i dati inseriti sono veritieri.', 'I accept the seller terms and confirm the data is accurate.')}</Checkbox>
            {touched && !terms && <p className="text-[12px] text-err">{t('Devi accettare le condizioni', 'You must accept the terms')}</p>}
          </>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={15} />{t('Indietro', 'Back')}</Button>
        {step < 4 ? <Button onClick={next}>{t('Continua', 'Continue')} <ArrowRight size={15} /></Button> : <Button onClick={submit}><Send size={15} />{t('Invia richiesta', 'Submit application')}</Button>}
      </div>
    </div>
  );
}
