import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PHOTOS, u } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { apiMode } from '@/lib/store';
import { errorText } from '@shared/api/client';
import { Button, cn, Field, Img, Input, Select, Textarea, toast } from '@/components/ui';

const PageHero = ({ eyebrow, title, sub, img }: { eyebrow: string; title: ReactNode; sub?: string; img?: string }) => (
  <section className="wrap pt-12">
    <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div><div className="eyebrow">{eyebrow}</div><h1 className="mt-4 text-[56px] leading-[.92] md:text-[88px]">{title}</h1>{sub && <p className="mt-5 max-w-xl text-mute">{sub}</p>}</div>
      {img && <Img src={u(img, 1000)} className="h-64 rounded-t-full rounded-b-[26px] md:h-80" />}
    </div>
    <div className="hairline mt-14" />
  </section>
);

export function HowItWorks() {
  const t = useT();
  const steps = [
    [t('Cerca', 'Search'), t('Filtra per città, servizio, prezzo e disponibilità. Ogni salone è verificato dal nostro team prima di apparire.', 'Filter by city, service, price and availability. Every salon is verified by our team before it appears.'), PHOTOS.salonInterior[2]],
    [t('Prenota', 'Book'), t('Scegli servizi, operatore e orario. Conferma immediata, promemoria via email.', 'Choose services, stylist and time. Instant confirmation, email reminders.'), PHOTOS.hairStyling[2]],
    [t('Acquista', 'Shop'), t('Compra i prodotti usati dal tuo salone. Spediti a casa o pronti al tuo prossimo appuntamento.', 'Buy the products your salon uses. Shipped home or ready at your next visit.'), PHOTOS.skincare[6]],
    [t('Recensisci', 'Review'), t('Dopo l’appuntamento lasci una recensione verificata e accumuli punti fedeltà.', 'After your visit leave a verified review and earn loyalty points.'), PHOTOS.face[3]],
  ];
  return (
    <>
      <PageHero eyebrow={t('Come funziona', 'How it works')} title={<>{t('Semplice per te,', 'Simple for you,')} <em className="text-gold">{t('potente per i saloni.', 'powerful for salons.')}</em></>} />
      <section className="wrap mt-16 space-y-20">
        {steps.map(([h, p, img], i) => (
          <div key={h} className={cn('grid items-center gap-10 md:grid-cols-2', i % 2 && 'md:[&>*:first-child]:order-2')}>
            <Img src={u(img, 1100)} className="h-80 rounded-[28px] md:h-[420px]" />
            <div><span className="outline-num font-serif text-[110px] leading-none">{i + 1}</span><h2 className="mt-2 text-5xl">{h}</h2><p className="mt-4 max-w-md text-mute">{p}</p></div>
          </div>
        ))}
        <div className="text-center"><Button to="/esplora" size="lg">{t('Inizia a esplorare', 'Start exploring')}</Button></div>
      </section>
    </>
  );
}

export function About() {
  const t = useT();
  return (
    <>
      <PageHero eyebrow={t('Chi siamo', 'About')} title={<>{t('Nati in Calabria,', 'Born in Calabria,')} <em className="text-gold">{t('per la Calabria.', 'for Calabria.')}</em></>} sub={t('MyBeauty+ nasce per dare ai saloni indipendenti gli stessi strumenti delle grandi catene: agenda online, vetrina e-commerce e clienti nuovi ogni settimana.', 'MyBeauty+ gives independent salons the same tools as big chains: online agenda, e-commerce storefront and new clients every week.')} img={PHOTOS.salonInterior[4]} />
      <section className="wrap mt-16 grid gap-6 md:grid-cols-3">
        {[[t('Selezione', 'Curation'), t('Ogni salone è verificato: documenti, partita IVA, foto reali.', 'Every salon is verified: documents, VAT number, real photos.')], [t('Trasparenza', 'Transparency'), t('Prezzi chiari, recensioni solo da prenotazioni reali.', 'Clear prices, reviews only from real bookings.')], [t('Territorio', 'Local'), t('Supportiamo l’economia locale: i saloni incassano direttamente.', 'We support the local economy: salons get paid directly.')]].map(([h, p], i) => (
          <div key={h} className="card p-8"><span className="font-serif text-xl italic text-gold">0{i + 1}</span><h3 className="mt-3 text-4xl">{h}</h3><p className="mt-3 text-sm text-mute">{p}</p></div>
        ))}
      </section>
    </>
  );
}

export function Faq() {
  const t = useT();
  const [open, setOpen] = useState<number | null>(0);
  const qs: [string, string][] = [
    [t('Quanto costa usare MyBeauty+?', 'How much does MyBeauty+ cost?'), t('Per i clienti è gratuito. Paghi solo il servizio o il prodotto, al prezzo del salone.', 'Free for customers. You only pay the salon’s price for the service or product.')],
    [t('Posso cancellare una prenotazione?', 'Can I cancel a booking?'), t('Sì, dalla sezione Prenotazioni. Ogni salone indica la sua politica di cancellazione (di solito gratuita fino a 24 ore prima).', 'Yes, from Bookings. Each salon sets its policy (usually free up to 24h before).')],
    [t('Come funziona la caparra?', 'How do deposits work?'), t('Alcuni servizi richiedono una piccola caparra online, scalata dal totale in salone.', 'Some services require a small online deposit, deducted from the total in salon.')],
    [t('Chi spedisce i prodotti?', 'Who ships the products?'), t('Ogni salone spedisce i propri prodotti. Se ordini da più saloni ricevi pacchi separati, con tracking per ciascuno.', 'Each salon ships its own products. Ordering from several salons means separate parcels, each tracked.')],
    [t('Posso restituire un prodotto?', 'Can I return a product?'), t('Hai 14 giorni dalla consegna per il recesso, per prodotti sigillati e non utilizzati.', 'You have 14 days from delivery to withdraw, for sealed unused products.')],
    [t('Sono un salone: come mi iscrivo?', 'I’m a salon: how do I join?'), t('Registrati come professionista, compila la richiesta con documenti e IBAN. Il nostro team approva entro 48 ore lavorative.', 'Register as a professional, complete the application with documents and IBAN. We approve within 48 working hours.')],
  ];
  return (
    <>
      <PageHero eyebrow="FAQ" title={<>{t('Domande', 'Frequently')} <em className="text-gold">{t('frequenti', 'asked')}</em></>} />
      <section className="wrap mt-12 max-w-3xl">
        {qs.map(([q, a], i) => (
          <div key={q} className="border-b border-smoke">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left"><span className="font-serif text-2xl md:text-3xl">{q}</span><ChevronDown className={cn('shrink-0 text-gold transition', open === i && 'rotate-180')} /></button>
            {open === i && <p className="-mt-2 pb-6 text-mute">{a}</p>}
          </div>
        ))}
      </section>
    </>
  );
}

export function Contact() {
  const t = useT();
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHero eyebrow={t('Contatti', 'Contact')} title={<>{t('Parliamone.', 'Let’s talk.')}</>} sub={t('Rispondiamo entro un giorno lavorativo.', 'We reply within one working day.')} />
      <section className="wrap mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {[[<Mail key="m" />, 'ciao@mybeauty.it'], [<Phone key="p" />, '+39 0961 000 000'], [<MapPin key="a" />, 'Via Indipendenza 12, 88100 Catanzaro']].map(([i, l]) => <div key={String(l)} className="card flex items-center gap-4 p-5 text-gold">{i}<span className="text-ivory">{l}</span></div>)}
        </div>
        <form className="card space-y-4 p-6 md:p-8" onSubmit={async (e) => {
          e.preventDefault();
          if (apiMode) {
            const f = new FormData(e.currentTarget);
            try { await useStore.getState().apiSendTicket!({ name: String(f.get('name') ?? ''), email: String(f.get('email') ?? ''), subject: String(f.get('topic') ?? 'Contatto'), message: String(f.get('message') ?? '') }); }
            catch (x) { toast(errorText(x), 'red'); return; }
          }
          setSent(true); toast(t('Messaggio inviato ✓', 'Message sent ✓'), 'ok');
        }}>
          {sent ? <div className="py-16 text-center"><h3 className="text-4xl">{t('Grazie!', 'Thank you!')}</h3><p className="mt-2 text-mute">{t('Ti risponderemo a breve.', 'We’ll get back to you shortly.')}</p></div> : <>
            <div className="grid gap-4 sm:grid-cols-2"><Field label={t('Nome', 'Name')}><Input name="name" required /></Field><Field label="Email"><Input name="email" required type="email" /></Field></div>
            <Field label={t('Argomento', 'Topic')}><Select name="topic"><option>{t('Assistenza cliente', 'Customer support')}</option><option>{t('Sono un salone', 'I’m a salon')}</option><option>Partnership</option></Select></Field>
            <Field label={t('Messaggio', 'Message')}><Textarea name="message" required minLength={10} /></Field>
            <Button type="submit">{t('Invia', 'Send')}</Button></>}
        </form>
      </section>
    </>
  );
}

export function Legal() {
  const { page } = useParams();
  const t = useT();
  const s = useStore();
  const title = page === 'privacy' ? 'Privacy Policy' : page === 'cookie' ? 'Cookie Policy' : t('Termini e condizioni', 'Terms & conditions');
  return (
    <>
      <PageHero eyebrow={t('Legale', 'Legal')} title={title} sub={t('Testo segnaposto per il prototipo: da sostituire con la versione redatta da un legale prima del lancio.', 'Placeholder text for the prototype: replace with a lawyer-drafted version before launch.')} />
      <section className="wrap mt-10 max-w-3xl space-y-6 text-[15px] leading-relaxed text-ivory/80">
        {(s.lang === 'it' ? ['1. Oggetto', '2. Ruolo di MyBeauty+ come intermediario', '3. Prenotazioni e cancellazioni', '4. Acquisti, spedizioni e diritto di recesso (14 giorni)', '5. Trattamento dei dati personali (GDPR)', '6. Contatti'] : ['1. Purpose', '2. MyBeauty+ as an intermediary', '3. Bookings and cancellations', '4. Purchases, shipping and the 14-day right of withdrawal', '5. Personal data (GDPR)', '6. Contact']).map((h) => (
          <div key={h}><h2 className="text-3xl text-ivory">{h}</h2><p className="mt-2">{t('MyBeauty+ mette in contatto clienti e professionisti del settore beauty. Il contratto relativo al servizio o al prodotto si conclude direttamente tra cliente e salone; MyBeauty+ gestisce la piattaforma, i pagamenti per conto dei saloni e l’assistenza.', 'MyBeauty+ connects customers with beauty professionals. The contract for the service or product is concluded directly between the customer and the salon; MyBeauty+ provides the technology, payments and support. Placeholder text: a lawyer must write the final version.')}</p></div>
        ))}
      </section>
    </>
  );
}

export function NotFound() {
  const t = useT();
  return (
    <section className="relative grid min-h-[80vh] place-items-center overflow-hidden">
      <Img src={u(PHOTOS.salonInterior[1], 1800)} className="absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-onyx via-onyx/70 to-onyx" />
      <div className="relative px-6 text-center">
        <div className="outline-num font-serif text-[160px] leading-none md:text-[220px]">404</div>
        <h1 className="mt-2 text-5xl">{t('Questa pagina è andata dal parrucchiere.', 'This page went to the hairdresser.')}</h1>
        <p className="mt-3 text-mute">{t('Non la troviamo, ma possiamo trovarti un salone.', 'We can’t find it, but we can find you a salon.')}</p>
        <div className="mt-8 flex justify-center gap-3"><Button to="/">Home</Button><Button to="/esplora" variant="line">{t('Esplora saloni', 'Explore salons')}</Button></div>
      </div>
    </section>
  );
}

export function SitemapDev() {
  const s = useStore();
  const salon = s.salons[0];
  const prod = s.products.find((p) => p.status === 'published')!;
  const groups: [string, [string, string][]][] = [
    ['Pubblico', [['/', 'Home'], ['/esplora', 'Esplora + mappa'], [`/salone/${salon.slug}`, 'Vetrina salone'], ['/shop', 'Shop'], [`/prodotto/${prod.id}`, 'Scheda prodotto'], ['/categoria/barber', 'Categoria'], ['/come-funziona', 'Come funziona'], ['/professionisti', 'Per i professionisti'], ['/chi-siamo', 'Chi siamo'], ['/faq', 'FAQ'], ['/contatti', 'Contatti'], ['/legale/termini', 'Termini'], ['/legale/privacy', 'Privacy'], ['/pagina-inesistente', '404']]],
    ['Flussi', [['/accedi', 'Accedi'], ['/registrati', 'Registrati cliente'], ['/registrati?tipo=pro', 'Registrati salone'], ['/password-dimenticata', 'Password dimenticata'], [`/prenota/${salon.slug}`, 'Prenotazione (wizard)'], ['/carrello', 'Carrello'], ['/checkout', 'Checkout']]],
    ['Cliente (login: Giulia)', [['/account', 'Dashboard'], ['/account/prenotazioni', 'Prenotazioni'], ['/account/ordini', 'Ordini'], ['/account/preferiti', 'Preferiti'], ['/account/recensioni', 'Recensioni'], ['/account/indirizzi', 'Indirizzi'], ['/account/pagamenti', 'Pagamenti'], ['/account/notifiche', 'Notifiche'], ['/account/profilo', 'Profilo']]],
    ['Venditore (login: Marco / Sofia)', [['/seller', 'Dashboard'], ['/seller/richiesta', 'Richiesta approvazione'], ['/seller/agenda', 'Agenda'], ['/seller/servizi', 'Servizi'], ['/seller/prodotti', 'Prodotti'], ['/seller/prodotti/nuovo', 'Nuovo prodotto'], ['/seller/ordini', 'Ordini'], ['/seller/staff', 'Staff'], ['/seller/clienti', 'Clienti'], ['/seller/recensioni', 'Recensioni'], ['/seller/promozioni', 'Promozioni'], ['/seller/pagamenti', 'Pagamenti'], ['/seller/impostazioni', 'Impostazioni']]],
    ['Admin', [['/admin', 'Dashboard'], ['/admin/richieste', 'Richieste venditori'], ['/admin/saloni', 'Saloni'], ['/admin/prodotti', 'Moderazione prodotti'], ['/admin/prenotazioni', 'Prenotazioni'], ['/admin/ordini', 'Ordini'], ['/admin/clienti', 'Clienti'], ['/admin/recensioni', 'Recensioni'], ['/admin/pagamenti', 'Pagamenti'], ['/admin/categorie', 'Categorie'], ['/admin/cms', 'CMS'], ['/admin/coupon', 'Coupon'], ['/admin/supporto', 'Supporto'], ['/admin/impostazioni', 'Impostazioni']]],
  ];
  return (
    <section className="wrap pt-12">
      <div className="eyebrow">Demo</div><h1 className="mt-3 text-6xl">Sitemap</h1><p className="mt-2 text-mute">{s.lang === 'it' ? 'Tutte le pagine del prototipo. Usa il pulsante “Demo” in basso a sinistra per cambiare ruolo.' : 'Every page of the prototype. Use the “Demo” button bottom-left to switch role.'}</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(([h, ls]) => <div key={h} className="card p-6"><h2 className="text-3xl">{h}</h2><ul className="mt-4 space-y-1.5 text-sm">{ls.map(([to, l]) => <li key={to}><Link to={to} className="link-u">{l}</Link> <span className="text-[11px] text-mute">{to}</span></li>)}</ul></div>)}
      </div>
    </section>
  );
}
