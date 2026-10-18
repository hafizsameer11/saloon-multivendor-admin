import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Search, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_LABELS, CITIES, PHOTOS, u, toISO, addDays, type SalonCategory } from '@shared/index';
import { publicProducts, publicSalons, useStore, useT } from '@/lib/store';
import { Button, Img, Reveal, SectionTitle, Stars, toast } from '@/components/ui';
import { ProductCard, SalonCard } from '@/components/cards';

const mix = <T extends { salonId: string }>(arr: T[]) => {
  const by: Record<string, T[]> = {};
  arr.forEach((x) => (by[x.salonId] ||= []).push(x));
  const lists = Object.values(by); const out: T[] = [];
  for (let i = 0; out.length < arr.length; i++) lists.forEach((l) => l[i] && out.push(l[i]));
  return out;
};

export default function Home() {
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const salons = useMemo(() => publicSalons(s), [s.salons]);
  const products = useMemo(() => publicProducts(s), [s.products, s.salons]);
  const featured = salons.filter((x) => x.featured).slice(0, 3);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Catanzaro');
  const [date, setDate] = useState(toISO(new Date()));
  const reviews = s.reviews.filter((r) => !r.productId && r.rating === 5 && !r.hidden).slice(0, 3);
  const cats: SalonCategory[] = ['parrucchiere', 'barber', 'unghie', 'estetica', 'spa'];
  const count = (c: SalonCategory) => salons.filter((x) => x.category === c).length;
  const banner = s.banners.find((b) => b.active);

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <div className="on-dark relative h-[100svh] min-h-[640px] overflow-hidden rounded-b-[36px] md:h-[820px]">
          <motion.div initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: [0.2, 0.7, 0.2, 1] }} className="absolute inset-0">
            <Img src={u(PHOTOS.barber[0], 2200)} className="h-full w-full" />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,15,.94)_0%,rgba(14,13,15,.62)_48%,rgba(14,13,15,.12)_100%),linear-gradient(0deg,rgba(14,13,15,.95),transparent_45%)]" />
          <div className="wrap relative flex h-full flex-col justify-end pb-36 md:pb-40">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}>
              <div className="eyebrow">Calabria · {t('Parrucchieri · Barber · Unghie · Spa', 'Hair · Barber · Nails · Spa')}</div>
              <h1 className="mt-5 max-w-4xl font-serif text-[64px] font-normal leading-[.88] tracking-[-.02em] sm:text-[88px] lg:text-[112px]">
                {t('La bellezza,', 'Beauty,')}<br /><em className="text-gold">{t('su appuntamento.', 'by appointment.')}</em>
              </h1>
              <p className="mt-6 max-w-md text-[16px] text-[#cfc6bc]">{t('Prenota i migliori saloni della tua città in un minuto e porta a casa i prodotti che usano i professionisti.', 'Book the best salons in your city in a minute and take home the products professionals use.')}</p>
            </motion.div>
          </div>
          <div className="pointer-events-none absolute right-10 top-1/2 hidden origin-right translate-y-10 rotate-90 text-[11px] uppercase tracking-[.4em] text-gold lg:block">{t('Edizione Calabria — 2026', 'Calabria edition — 2026')}</div>
          <div className="absolute bottom-40 right-10 hidden text-right lg:block">
            <div className="outline-num font-serif text-[96px] leading-[.8]">{salons.length * 10}</div>
            <div className="mt-3 text-[11px] uppercase tracking-[.25em] text-mute">{t('saloni selezionati', 'curated salons')}</div>
          </div>
        </div>
        <div className="wrap relative z-10 -mt-[58px]">
          <form onSubmit={(e) => { e.preventDefault(); nav(`/esplora?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&data=${date}`); }}
            className="grid gap-1 rounded-[28px] border border-gold/25 bg-graphite/95 p-2 shadow-deep backdrop-blur-xl md:grid-cols-[1.4fr_1fr_1fr_auto] md:rounded-full md:pl-6">
            <label className="flex items-center gap-3 border-smoke px-4 py-2.5 md:border-r">
              <Search size={18} className="shrink-0 text-gold" />
              <span className="flex-1"><span className="block text-[10px] uppercase tracking-[.22em] text-gold">{t('Servizio o salone', 'Service or salon')}</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Taglio + barba, semipermanente…', 'Haircut, gel nails…')} className="w-full bg-transparent text-[14px] outline-none placeholder:text-mute" /></span>
            </label>
            <label className="flex items-center gap-3 border-smoke px-4 py-2.5 md:border-r">
              <MapPin size={18} className="shrink-0 text-gold" />
              <span className="flex-1"><span className="block text-[10px] uppercase tracking-[.22em] text-gold">{t('Dove', 'Where')}</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full appearance-none bg-transparent text-[14px] outline-none [&>option]:text-ink">{['', ...CITIES].map((c) => <option key={c} value={c}>{c || t('Tutta la Calabria', 'All Calabria')}</option>)}</select></span>
            </label>
            <label className="flex items-center gap-3 px-4 py-2.5">
              <CalendarDays size={18} className="shrink-0 text-gold" />
              <span className="flex-1"><span className="block text-[10px] uppercase tracking-[.22em] text-gold">{t('Quando', 'When')}</span>
                <select value={date} onChange={(e) => setDate(e.target.value)} className="w-full appearance-none bg-transparent text-[14px] outline-none [&>option]:text-ink">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => { const x = addDays(new Date(), d); return <option key={d} value={toISO(x)}>{d === 0 ? t('Oggi', 'Today') : d === 1 ? t('Domani', 'Tomorrow') : x.toLocaleDateString(s.lang === 'it' ? 'it-IT' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</option>; })}
                </select></span>
            </label>
            <Button type="submit" size="lg" className="m-1">{t('Cerca', 'Search')} <ArrowRight size={16} /></Button>
          </form>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mt-20 overflow-hidden whitespace-nowrap border-y border-smoke py-5">
        <div className="inline-block animate-marquee font-serif text-[30px] italic text-[#d9cfc3]">
          {[...CITIES, ...CITIES, ...CITIES, ...CITIES].map((c, i) => <span key={i}><Link to={`/esplora?city=${c}`} className="hover:text-gold">{c}</Link><span className="mx-7 align-middle text-lg not-italic text-crimson">✦</span></span>)}
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="wrap mt-24">
        <SectionTitle num="01" title={<>{t('Cosa ti', 'What would')} <em className="text-gold">{t('serve oggi?', 'you like today?')}</em></>} sub={t('Cinque mondi, un solo account. Scegli una categoria per vedere i saloni disponibili vicino a te.', 'Five worlds, one account. Pick a category to see available salons near you.')} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1.4fr_1fr_1fr] md:grid-rows-[300px_300px] md:gap-4">
          {cats.map((c, i) => (
            <Reveal key={c} delay={i * 0.06} className={i === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''}>
              <Link to={`/categoria/${c}`} className="img-zoom group relative block h-[220px] overflow-hidden rounded-[26px] md:h-full on-dark">
                <Img src={u(CATEGORY_LABELS[c].img, 1200)} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute left-5 top-4 font-serif italic text-gold">{['i.', 'ii.', 'iii.', 'iv.', 'v.'][i]}</span>
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                  <div><div className="text-[10.5px] uppercase tracking-[.22em] text-gold">{count(c) * 9 + 6} {t('saloni', 'salons')}</div><h3 className="mt-1 text-[34px] leading-none md:text-[42px]">{s.lang === 'it' ? CATEGORY_LABELS[c].it : CATEGORY_LABELS[c].en}</h3></div>
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-ivory/40 transition group-hover:border-gold group-hover:bg-gold group-hover:text-coal"><ArrowUpRight size={18} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED SALONS */}
      <section className="wrap mt-28">
        <SectionTitle num="02" title={<>{t('Disponibili', 'Available')} <em className="text-gold">{t('questa settimana', 'this week')}</em></>} sub={t('Orari reali, aggiornati dai saloni. Tocca un orario per prenotare subito.', 'Real-time availability from salons. Tap a time to book instantly.')}
          action={<Button to="/esplora" variant="line">{t('Tutti i saloni', 'All salons')} <ArrowRight size={15} /></Button>} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{featured.map((x, i) => <Reveal key={x.id} delay={i * 0.08}><SalonCard salon={x} /></Reveal>)}</div>
      </section>

      {/* HOW IT WORKS editorial */}
      <section className="wrap mt-32 grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="grid grid-cols-2 gap-4">
            <Img src={u(PHOTOS.hairStyling[1], 900)} className="h-[420px] rounded-t-full rounded-b-[26px]" />
            <Img src={u(PHOTOS.nails[3], 900)} className="mt-16 h-[420px] rounded-[26px]" />
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-gold/30 bg-graphite px-6 py-3 text-[12px] uppercase tracking-[.2em] text-gold shadow-deep">{t('Conferma immediata', 'Instant confirmation')}</div>
        </Reveal>
        <div>
          <div className="eyebrow">03 — {t('Come funziona', 'How it works')}</div>
          <h2 className="mt-4 text-5xl leading-[.95] md:text-[64px]">{t('Tre passi.', 'Three steps.')} <em className="text-gold">{t('Zero telefonate.', 'Zero phone calls.')}</em></h2>
          <ol className="mt-10 space-y-8">
            {[
              [t('Scegli', 'Choose'), t('Confronta saloni, prezzi, recensioni verificate e orari liberi in tempo reale.', 'Compare salons, prices, verified reviews and live availability.')],
              [t('Prenota', 'Book'), t('Seleziona servizio, operatore e orario. Paghi in salone o lasci una piccola caparra.', 'Pick service, stylist and time. Pay in salon or leave a small deposit.')],
              [t('Rilassati', 'Relax'), t('Ricevi conferma e promemoria. Aggiungi i prodotti e ritirali al tuo appuntamento.', 'Get confirmation and reminders. Add products and pick them up at your visit.')],
            ].map(([h, p], i) => (
              <li key={h} className="flex gap-6 border-t border-smoke pt-6">
                <span className="outline-num font-serif text-6xl leading-none">{i + 1}</span>
                <div><h3 className="text-3xl">{h}</h3><p className="mt-1 max-w-md text-sm text-mute">{p}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* DAYLIGHT SHOP */}
      <section className="day relative mx-2 mt-32 overflow-hidden rounded-[40px] py-20 sm:mx-4 md:py-28">
        <div className="wrap">
          <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-eyebrow text-crimson">04 — {t('Lo Shop', 'The Shop')}</div>
              <h2 className="mt-5 text-[52px] leading-[.95] md:text-[76px]">{t('I prodotti dei', 'The products')} <em className="text-crimson">{t('professionisti', 'professionals use')}</em>{t(', a casa tua.', ', at home.')}</h2>
              <p className="mt-6 max-w-md text-mute-2">{t('Ogni salone vende ciò che usa davvero: gel, shampoo, spray, skincare. Spedizione in tutta Italia o ritiro gratuito al tuo prossimo appuntamento.', 'Each salon sells what it really uses: gel, shampoo, sprays, skincare. Shipped across Italy or collected free at your next visit.')}</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button to="/shop" variant="dark">{t('Scopri lo shop', 'Explore the shop')}</Button><Button to="/shop?sort=new" variant="inkline">{t('Novità', 'New in')}</Button></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Img src={u(PHOTOS.skincare[2], 900)} className="h-[300px] rounded-t-full rounded-b-[22px] md:h-[400px]" />
              <Img src={u(PHOTOS.skincare[3], 900)} className="mt-14 h-[300px] rounded-[22px] md:h-[400px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{mix(products).slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      </section>

      {/* PROMO BANNER */}
      {banner && (
        <section className="wrap mt-24">
          <Link to={banner.link} className="img-zoom group relative block overflow-hidden rounded-[32px] on-dark">
            <Img src={banner.image} className="h-[300px] md:h-[360px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-8 md:p-14">
              <div className="eyebrow">{t('In corso', 'Now on')}</div>
              <h3 className="mt-3 text-5xl md:text-6xl">{banner.title}</h3>
              <p className="mt-3 text-ivory/80">{banner.subtitle}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.14em] text-gold">{banner.cta} <ArrowRight size={14} /></span>
            </div>
          </Link>
        </section>
      )}

      {/* REVIEWS */}
      <section className="wrap mt-28">
        <SectionTitle num="05" title={<>{t('Parola', 'In their')} <em className="text-gold">{t('di cliente', 'words')}</em></>} sub={t('Solo recensioni di chi ha davvero prenotato tramite MyBeauty+.', 'Only reviews from people who actually booked through MyBeauty+.')} />
        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => {
            const salon = s.salons.find((x) => x.id === r.salonId)!;
            return (
              <Reveal key={r.id} delay={i * 0.08}>
                <figure className="card h-full p-7">
                  <Stars value={r.rating} />
                  <blockquote className="mt-5 font-serif text-[26px] leading-[1.2]">“{r.text}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-smoke pt-5 text-sm">
                    <Img src={r.customerAvatar} className="h-10 w-10 rounded-full" />
                    <div><div className="font-semibold">{r.customerName}</div><Link to={`/salone/${salon.slug}`} className="text-[12px] text-gold hover:underline">{salon.name}</Link></div>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FOR PROS */}
      <section className="wrap mt-28">
        <div className="on-dark relative overflow-hidden rounded-[36px] border border-smoke">
          <Img src={u(PHOTOS.salonInterior[3], 2000)} className="absolute inset-0" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,15,.96)_30%,rgba(14,13,15,.55))]" />
          <div className="relative grid gap-10 p-8 md:p-16 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="eyebrow">{t('Per i professionisti', 'For professionals')}</div>
              <h2 className="mt-4 text-5xl leading-[.95] md:text-[68px]">{t('Il tuo salone,', 'Your salon,')} <em className="text-gold">{t('sempre pieno.', 'always booked.')}</em></h2>
              <p className="mt-5 max-w-lg text-ivory/75">{t('Agenda online, vetrina prodotti, pagamenti e recensioni in un unico pannello. Nessun canone d’ingresso: paghi solo una commissione su ciò che vendi.', 'Online agenda, product storefront, payments and reviews in one dashboard. No sign-up fee: you only pay commission on what you sell.')}</p>
              <div className="mt-8 flex flex-wrap gap-3"><Button to="/registrati?tipo=pro">{t('Apri il tuo salone', 'List your salon')}</Button><Button to="/professionisti" variant="line">{t('Scopri di più', 'Learn more')}</Button></div>
            </div>
            <div className="grid grid-cols-2 gap-3 self-end">
              {[['+38%', t('prenotazioni in 3 mesi', 'bookings in 3 months')], ['-60%', t('telefonate', 'phone calls')], ['12%', t('commissione, tutto incluso', 'commission, all-in')], ['48h', t('per l’approvazione', 'to get approved')]].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-smoke bg-black/40 p-5 backdrop-blur on-dark"><div className="font-serif text-4xl text-gold">{n}</div><div className="mt-1 text-[12px] text-mute">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* APP TEASER */}
      <section className="wrap mt-24 grid items-center gap-8 rounded-[32px] border border-smoke bg-graphite p-8 md:grid-cols-[auto_1fr_auto] md:p-12">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-crimson/15 text-gold"><Smartphone size={28} strokeWidth={1.4} /></div>
        <div><h3 className="text-4xl">{t('Presto anche in app', 'Coming soon as an app')}</h3><p className="mt-1 text-sm text-mute">{t('iOS e Android: prenotazione in un tocco, ordini e preferiti sempre con te.', 'iOS and Android: one-tap booking, orders and favourites always with you.')}</p></div>
        <Button variant="line" onClick={() => toast(t('Ti avviseremo al lancio ✓', 'We’ll let you know at launch ✓'), 'ok')}>{t('Avvisami', 'Notify me')}</Button>
      </section>
    </>
  );
}
