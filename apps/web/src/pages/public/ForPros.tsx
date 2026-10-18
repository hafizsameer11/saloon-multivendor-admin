import { BarChart3, CalendarCheck, Check, CreditCard, ShoppingBag, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { PHOTOS, u } from '@shared/index';
import { useT } from '@/lib/store';
import { Button, cn, Img, Reveal } from '@/components/ui';

export default function ForPros() {
  const t = useT();
  const [revenue, setRevenue] = useState(4000);
  const features = [
    [<CalendarCheck key="1" />, t('Agenda online 24/7', 'Online agenda 24/7'), t('I clienti prenotano anche di notte. Tu vedi tutto per operatore, giorno e settimana.', 'Clients book even at night. You see everything by staff, day and week.')],
    [<ShoppingBag key="2" />, t('Vetrina e-commerce', 'E-commerce storefront'), t('Vendi i prodotti che usi: spedizione o ritiro in salone, stock sotto controllo.', 'Sell what you use: shipping or salon pickup, stock under control.')],
    [<CreditCard key="3" />, t('Caparre e pagamenti', 'Deposits & payments'), t('Riduci i no-show con caparre online. Bonifico automatico ogni mese.', 'Cut no-shows with online deposits. Automatic monthly payouts.')],
    [<Star key="4" />, t('Recensioni verificate', 'Verified reviews'), t('Solo da clienti reali. Rispondi e costruisci la tua reputazione.', 'Only from real clients. Reply and build your reputation.')],
    [<Users key="5" />, t('Mini CRM', 'Mini CRM'), t('Storico clienti, note e preferenze sempre a portata di mano.', 'Client history, notes and preferences at hand.')],
    [<BarChart3 key="6" />, t('Statistiche', 'Analytics'), t('Incassi servizi e prodotti, operatori più richiesti, trend mensili.', 'Service and product revenue, top staff, monthly trends.')],
  ];
  return (
    <>
      <section className="relative">
        <div className="on-dark relative h-[86vh] min-h-[620px] overflow-hidden rounded-b-[36px]">
          <Img src={u(PHOTOS.salonInterior[2], 2200)} className="absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,15,.95)_10%,rgba(14,13,15,.55)_60%,rgba(14,13,15,.2))]" />
          <div className="wrap relative flex h-full flex-col justify-end pb-20">
            <div className="eyebrow">{t('Per i professionisti della bellezza', 'For beauty professionals')}</div>
            <h1 className="mt-5 max-w-4xl text-[60px] leading-[.88] md:text-[104px]">{t('Più clienti.', 'More clients.')}<br /><em className="text-gold">{t('Meno telefonate.', 'Fewer calls.')}</em></h1>
            <p className="mt-6 max-w-lg text-ivory/80">{t('Apri il tuo salone su MyBeauty+: agenda, shop e pagamenti in un unico pannello. Approvazione in 48 ore.', 'Open your salon on MyBeauty+: agenda, shop and payments in one dashboard. Approved within 48 hours.')}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button to="/registrati?tipo=pro" size="lg">{t('Inizia gratis', 'Start free')}</Button><Button to="/contatti" variant="line" size="lg">{t('Parla con noi', 'Talk to us')}</Button></div>
          </div>
        </div>
      </section>
      <section className="wrap mt-24 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map(([i, h, p], k) => <Reveal key={String(h)} delay={k * 0.05}><div className="card h-full p-7"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-crimson/15 text-gold">{i}</div><h3 className="mt-5 text-3xl">{h}</h3><p className="mt-2 text-sm text-mute">{p}</p></div></Reveal>)}
      </section>
      <section className="wrap mt-24">
        <div className="eyebrow">{t('Come si entra', 'How to join')}</div>
        <h2 className="mt-3 text-5xl md:text-6xl">{t('Quattro passi per andare online', 'Four steps to go live')}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {[[t('Registrati', 'Sign up'), t('Crea l’account professionale.', 'Create your pro account.')], [t('Compila la richiesta', 'Apply'), t('Dati aziendali, P.IVA, documenti, IBAN.', 'Business data, VAT, documents, IBAN.')], [t('Verifica', 'Verification'), t('Il nostro team controlla entro 48 ore.', 'Our team checks within 48 hours.')], [t('Online!', 'Live!'), t('Pubblica servizi e prodotti e ricevi prenotazioni.', 'Publish services and products, get bookings.')]].map(([h, p], i) => (
            <li key={h} className="relative rounded-[26px] border border-smoke p-6"><span className="outline-num font-serif text-7xl leading-none">{i + 1}</span><h3 className="mt-3 text-3xl">{h}</h3><p className="mt-1 text-sm text-mute">{p}</p></li>
          ))}
        </ol>
      </section>
      <section className="wrap mt-24 grid gap-8 lg:grid-cols-2">
        <div className="card p-8 md:p-10">
          <div className="eyebrow">{t('Prezzi', 'Pricing')}</div>
          <h2 className="mt-3 text-5xl">{t('Nessun canone.', 'No monthly fee.')} <em className="text-gold">12%</em> {t('su ciò che incassi.', 'of what you earn.')}</h2>
          <ul className="mt-6 space-y-3 text-sm">{[t('Agenda illimitata e staff illimitato', 'Unlimited agenda and staff'), t('Vetrina prodotti con spedizioni e ritiro', 'Product storefront with shipping & pickup'), t('Pagamenti, caparre e payout mensile', 'Payments, deposits and monthly payout'), t('Supporto in italiano', 'Italian-speaking support')].map((x) => <li key={x} className="flex gap-3"><Check size={18} className="text-gold" />{x}</li>)}</ul>
          <Button to="/registrati?tipo=pro" className="mt-8">{t('Apri il tuo salone', 'List your salon')}</Button>
        </div>
        <div className="card p-8 md:p-10">
          <div className="eyebrow">{t('Calcolatore', 'Calculator')}</div>
          <h3 className="mt-3 text-4xl">{t('Quanto ricevi ogni mese', 'What you receive monthly')}</h3>
          <label className="mt-8 block text-sm text-mute">{t('Incasso mensile tramite MyBeauty+', 'Monthly revenue via MyBeauty+')}: <b className="text-ivory">€{revenue.toLocaleString('it-IT')}</b></label>
          <input type="range" min={500} max={20000} step={250} value={revenue} onChange={(e) => setRevenue(+e.target.value)} className="mt-3 w-full accent-[#B3202A]" />
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-smoke p-5"><div className="text-[11px] uppercase tracking-[.16em] text-mute">{t('Commissione', 'Commission')}</div><div className="mt-1 font-serif text-4xl">€{Math.round(revenue * 0.12).toLocaleString('it-IT')}</div></div>
            <div className={cn('rounded-2xl border border-gold/40 bg-gold/10 p-5')}><div className="text-[11px] uppercase tracking-[.16em] text-gold">{t('Ricevi', 'You receive')}</div><div className="mt-1 font-serif text-4xl text-gold">€{Math.round(revenue * 0.88).toLocaleString('it-IT')}</div></div>
          </div>
          <p className="mt-4 text-[12px] text-mute">{t('Esempio indicativo. Costi di pagamento inclusi nella commissione.', 'Indicative example. Payment costs included in the commission.')}</p>
        </div>
      </section>
    </>
  );
}
