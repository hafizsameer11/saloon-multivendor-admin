import { ArrowRight, CalendarClock, Clock, Grid2x2, Users, Heart, MapPin, Phone, Share2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dataLabel, bookingTotal, CATEGORY_LABELS, eur, fmtDate, fmtDateShort, weekdayIdx, windowCheck, windowPlacesLeft } from '@shared/index';
import { useStore, useT, useWindows } from '@/lib/store';
import { Badge, Button, cn, Empty, Img, Modal, Stars, Tabs, toast } from '@/components/ui';
import { CalabriaMap, ProductCard, ServiceRow } from '@/components/cards';
import { Lightbox, MediaGallery } from '@/components/Gallery';
import { NotFound } from './StaticPages';

const DAY_NAMES = { it: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'], en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] };

export default function SalonPage() {
  const { slug } = useParams();
  const t = useT();
  const s = useStore();
  const nav = useNavigate();
  const salon = s.salons.find((x) => x.slug === slug);
  const [tab, setTab] = useState<'services' | 'shop' | 'staff' | 'reviews' | 'info'>('services');
  const [picked, setPicked] = useState<string[]>([]);
  const [gallery, setGallery] = useState<number | null>(null);
  const [svc, setSvc] = useState<string | null>(null);
  const services = useMemo(() => s.services.filter((x) => x.salonId === salon?.id && x.active), [s.services, salon]);
  const groups = useMemo(() => Array.from(new Set(services.map((x) => x.category))), [services]);
  const allWindows = useWindows();
  if (!salon || (salon.status !== 'approved' && s.userId !== salon.ownerId && s.userId !== 'u-admin')) return <NotFound />;
  const products = s.products.filter((p) => p.salonId === salon.id && p.status === 'published');
  const staff = s.staff.filter((x) => x.salonId === salon.id && x.active);
  const reviews = s.reviews.filter((r) => r.salonId === salon.id && !r.productId && !r.hidden);
  const fav = s.favSalons.includes(salon.id);
  const sel = services.filter((x) => picked.includes(x.id));
  const tot = bookingTotal(sel);
  const today = weekdayIdx(new Date());
  const openNow = (() => { const h = salon.hours[today]; if (!h.open || !h.close) return false; const n = new Date(); const m = n.getHours() * 60 + n.getMinutes(); const [a, b] = [h.open, h.close].map((x) => +x.slice(0, 2) * 60 + +x.slice(3)); return m >= a && m < b; })();
  // upcoming special windows a customer can still book (open, places left, not started); 'service' check is per booking
  const windows = allWindows.filter((w) => w.salonId === salon.id && !['closed', 'full', 'past'].includes(windowCheck(w, []) ?? '')).slice(0, 6);
  const book = (ids = picked) => nav(`/prenota/${salon.slug}?s=${ids.join(',')}`);
  const togglePick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));

  return (
    <>
      {salon.status !== 'approved' && <div className="fixed inset-x-0 top-[72px] z-30 bg-gold py-2 text-center text-[12px] font-semibold text-coal">{t('Anteprima: il salone non è ancora pubblico (in attesa di approvazione).', 'Preview: this salon is not public yet (awaiting approval).')}</div>}
      {/* HERO MOSAIC */}
      <section className="relative">
        <div className="grid h-[62vh] min-h-[460px] grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden md:h-[640px]">
          <button onClick={() => setGallery(0)} className="img-zoom col-span-4 row-span-2 md:col-span-2"><Img src={salon.cover} className="h-full" /></button>
          {salon.gallery.slice(0, 4).map((g, i) => (
            <button key={i} onClick={() => setGallery(i + 1)} className="img-zoom hidden md:block"><Img src={g} className="h-full" /></button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx via-onyx/30 to-black/40" />
        <button onClick={() => setGallery(0)} className="absolute right-4 top-24 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-[12px] backdrop-blur md:bottom-40 md:right-10 md:top-auto on-dark"><Grid2x2 size={14} />{salon.gallery.length + 1} {t('foto', 'photos')}</button>
        <div className="wrap absolute inset-x-0 bottom-0 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{s.lang === 'it' ? CATEGORY_LABELS[salon.category].it : CATEGORY_LABELS[salon.category].en}</Badge>
            {salon.verified && <Badge tone="ok"><ShieldCheck size={12} /> {t('Verificato', 'Verified')}</Badge>}
            <Badge tone={openNow ? 'ok' : 'mute'}>{openNow ? t('Aperto ora', 'Open now') : t('Chiuso ora', 'Closed now')}</Badge>
          </div>
          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-[56px] leading-[.9] md:text-[92px]">{salon.name}</h1>
              <p className="mt-3 font-serif text-2xl italic text-gold">{salon.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ivory/80">
                <span className="flex items-center gap-2"><Stars value={salon.rating} />{salon.rating.toFixed(1)} · {salon.reviewCount} {t('recensioni', 'reviews')}</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} />{salon.address}, {salon.city}</span>
                <span>{'€'.repeat(salon.priceLevel)}<span className="text-mute">{'€'.repeat(3 - salon.priceLevel)}</span></span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { s.toggleFavSalon(salon.id); toast(fav ? t('Rimosso dai preferiti', 'Removed') : t('Salvato nei preferiti', 'Saved')); }} className={cn('grid h-12 w-12 place-items-center rounded-full border border-ivory/25 backdrop-blur', fav && 'border-crimson text-crimson')} aria-label={t('Preferito', 'Favourite')}><Heart size={18} fill={fav ? 'currentColor' : 'none'} /></button>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast(t('Link copiato', 'Link copied'), 'ok'); }} className="grid h-12 w-12 place-items-center rounded-full border border-ivory/25 backdrop-blur" aria-label={t('Condividi', 'Share')}><Share2 size={18} /></button>
              <Button size="lg" onClick={() => book([])}>{t('Prenota ora', 'Book now')}</Button>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <Tabs value={tab} onChange={setTab} tabs={[
            { id: 'services', label: t('Servizi', 'Services'), count: services.length },
            { id: 'shop', label: 'Shop', count: products.length },
            { id: 'staff', label: 'Staff', count: staff.length },
            { id: 'reviews', label: t('Recensioni', 'Reviews'), count: reviews.length },
            { id: 'info', label: 'Info' },
          ]} />
          <div className="pt-8">
            {tab === 'services' && (
              <div className="space-y-10">
                {windows.length > 0 && (
                  <div data-testid="salon-windows">
                    <div className="mb-4 flex items-center gap-4"><h3 className="flex items-center gap-3 text-3xl"><CalendarClock size={22} className="text-gold" />{t('Fasce speciali', 'Special windows')}</h3><span className="h-px flex-1 bg-smoke" /></div>
                    <p className="-mt-2 mb-4 text-[13px] text-mute">{t('Orari aperti apposta dal salone, con posti limitati.', 'Times the salon opened on purpose, with limited places.')}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {windows.map((w) => {
                        const left = windowPlacesLeft(w);
                        const names = services.filter((x) => w.serviceIds.includes(x.id)).map((x) => x.name);
                        return (
                          <div key={w.id} className="rounded-[22px] border border-gold/30 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div><div className="text-[12px] uppercase tracking-[.14em] text-gold">{fmtDate(w.date, s.lang)}</div><div className="font-serif text-2xl">{w.start}–{w.end}</div></div>
                              <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', left <= 1 ? 'bg-crimson/15 text-err' : 'bg-gold/15 text-gold')}><Users size={12} />{left} {left === 1 ? t('posto', 'place') : t('posti', 'places')}</span>
                            </div>
                            {w.note && <div className="mt-1 text-[13px]">{w.note}</div>}
                            <div className="mt-1 text-[12px] text-mute">{names.join(' · ')}</div>
                            <Button size="sm" className="mt-3" onClick={() => nav(`/prenota/${salon.slug}?fascia=${w.id}`)}>{t('Prenota un posto', 'Book a place')}</Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {groups.map((g) => (
                  <div key={g}>
                    <div className="mb-4 flex items-center gap-4"><h3 className="text-3xl">{g}</h3><span className="h-px flex-1 bg-smoke" /></div>
                    <div className="space-y-3">{services.filter((x) => x.category === g).map((x) => <ServiceRow key={x.id} service={x} selected={picked.includes(x.id)} onBook={() => togglePick(x.id)} onOpen={() => setSvc(x.id)} />)}</div>
                  </div>
                ))}
                {services.length === 0 && <Empty title={t('Nessun servizio ancora', 'No services yet')} />}
              </div>
            )}
            {tab === 'shop' && (products.length ? (
              <div className="day -mx-2 rounded-[28px] p-5 md:p-8">
                <p className="mb-6 text-sm text-mute-2">{t('Spedizione', 'Shipping')} {eur(salon.policies.shippingFee)} · {t('gratis sopra', 'free over')} {eur(salon.policies.freeShippingOver)} · {t('oppure ritiro gratuito in salone', 'or free pickup in salon')}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              </div>
            ) : <Empty title={t('Nessun prodotto in vendita', 'No products for sale')} />)}
            {tab === 'staff' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {staff.map((m) => (
                  <div key={m.id} className="card flex gap-4 p-4">
                    <Img src={m.photo} className="h-28 w-24 shrink-0 rounded-2xl" />
                    <div><h4 className="text-2xl">{m.name}</h4><div className="eyebrow mt-1 text-[10px]">{m.role}</div><p className="mt-2 text-[12.5px] text-mute">{m.bio}</p>
                      <button onClick={() => nav(`/prenota/${salon.slug}?staff=${m.id}`)} className="mt-3 text-[12px] font-semibold uppercase tracking-[.12em] text-gold hover:underline">{t('Prenota con', 'Book with')} {m.name} →</button></div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'reviews' && (
              <div className="grid gap-8 md:grid-cols-[240px_1fr]">
                <div className="card h-fit p-6 text-center">
                  <div className="font-serif text-7xl">{salon.rating.toFixed(1)}</div><Stars value={salon.rating} size={16} className="mt-2" />
                  <div className="mt-2 text-[12px] text-mute">{salon.reviewCount} {t('recensioni verificate', 'verified reviews')}</div>
                  <div className="mt-5 space-y-1.5">{dist.map((d) => <div key={d.n} className="flex items-center gap-2 text-[11px] text-mute"><span className="w-3">{d.n}</span><span className="h-1.5 flex-1 overflow-hidden rounded bg-smoke"><span className="block h-full bg-gold" style={{ width: `${reviews.length ? (d.c / reviews.length) * 100 : 0}%` }} /></span></div>)}</div>
                </div>
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-smoke pb-5">
                      <div className="flex items-center gap-3"><Img src={r.customerAvatar} className="h-10 w-10 rounded-full" /><div className="flex-1"><div className="text-sm font-semibold">{r.customerName}</div><div className="text-[11.5px] text-mute">{fmtDateShort(r.createdAt, s.lang)} · {t('Prenotazione verificata', 'Verified booking')}</div></div><Stars value={r.rating} /></div>
                      <p className="mt-3 text-[14.5px] text-ivory/85">{r.text}</p>
                      {r.reply && <div className="mt-3 rounded-2xl border-l-2 border-gold bg-white/[.03] px-4 py-3 text-[13px]"><span className="eyebrow mr-2 text-[10px]">{t('Risposta del salone', 'Salon reply')}</span>{r.reply}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'info' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="card p-6"><h3 className="text-3xl">{t('Il salone', 'About')}</h3><p className="mt-3 text-sm leading-relaxed text-ivory/80">{salon.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{salon.amenities.map((a) => <Badge key={a} tone="mute">{dataLabel(a, s.lang)}</Badge>)}</div>
                  <div className="mt-6 space-y-2 text-sm"><div className="flex items-center gap-2"><Phone size={14} className="text-gold" />{salon.phone}</div><div className="flex items-center gap-2"><MapPin size={14} className="text-gold" />{salon.address}, {salon.city}</div></div></div>
                <div className="card p-6"><h3 className="flex items-center gap-2 text-3xl"><Clock size={20} className="text-gold" />{t('Orari', 'Hours')}</h3>
                  <ul className="mt-4 space-y-2 text-sm">{salon.hours.map((h) => <li key={h.day} className={cn('flex justify-between border-b border-smoke/60 pb-2', h.day === today && 'text-gold')}><span>{DAY_NAMES[s.lang][h.day]}</span><span>{h.open ? `${h.open} – ${h.close}` : t('Chiuso', 'Closed')}</span></li>)}</ul></div>
                <div className="card overflow-hidden md:col-span-2"><div className="h-72"><CalabriaMap salons={[salon]} active={salon.id} /></div></div>
                <div className="card p-6 md:col-span-2"><h3 className="text-3xl">{t('Politiche', 'Policies')}</h3><p className="mt-3 text-sm text-ivory/80">{salon.policies.cancellation}</p><p className="mt-2 text-sm text-ivory/80">{salon.policies.noShow}</p></div>
              </div>
            )}
          </div>
        </div>

        {/* sticky booking card */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-6">
            <div className="eyebrow">{t('La tua prenotazione', 'Your booking')}</div>
            {sel.length === 0 ? (
              <p className="mt-4 text-sm text-mute">{t('Seleziona uno o più servizi dalla lista per vedere durata e prezzo totale.', 'Select one or more services to see total time and price.')}</p>
            ) : (
              <ul className="mt-4 space-y-2">{sel.map((x) => <li key={x.id} className="flex justify-between text-sm"><span>{x.name}</span><span>{eur(x.price)}</span></li>)}</ul>
            )}
            <div className="hairline my-5" />
            <div className="flex items-end justify-between"><div className="text-[12px] text-mute">{tot.duration} min</div><div className="font-serif text-4xl">{eur(tot.price)}</div></div>
            <Button full size="lg" className="mt-5" onClick={() => book()}>{sel.length ? t('Scegli data e ora', 'Pick date & time') : t('Prenota', 'Book')} <ArrowRight size={15} /></Button>
            <p className="mt-3 text-center text-[11.5px] text-mute">{t('Cancellazione gratuita fino a 24h prima', 'Free cancellation up to 24h before')}</p>
          </div>
        </aside>
      </div>

      {sel.length > 0 && (
        <div className="fixed inset-x-3 bottom-[84px] z-30 flex items-center justify-between rounded-2xl border border-gold/30 bg-graphite/95 p-3 pl-5 backdrop-blur lg:hidden">
          <div><div className="text-[12px] text-mute">{sel.length} {t('servizi', 'services')} · {tot.duration} min</div><div className="font-serif text-2xl">{eur(tot.price)}</div></div>
          <Button onClick={() => book()}>{t('Continua', 'Continue')}</Button>
        </div>
      )}

      <Lightbox images={[salon.cover, ...salon.gallery].filter(Boolean)} index={gallery} onClose={() => setGallery(null)} title={salon.name} />

      {(() => { const sv = services.find((x) => x.id === svc); if (!sv) return null; const performers = staff.filter((m) => m.serviceIds.includes(sv.id)); const on = picked.includes(sv.id); return (
        <Modal open={!!sv} onClose={() => setSvc(null)} title={sv.name} wide
          footer={<><Button variant="line" onClick={() => { togglePick(sv.id); setSvc(null); }}>{on ? t('Rimuovi dalla selezione', 'Remove from selection') : t('Aggiungi alla selezione', 'Add to selection')}</Button><Button onClick={() => book(Array.from(new Set([...picked, sv.id])))}>{t('Prenota ora', 'Book now')}</Button></>}>
          <div className="grid gap-6 md:grid-cols-[1.25fr_1fr]">
            <MediaGallery images={sv.images?.length ? sv.images : [sv.image]} title={sv.name} aspect="aspect-[4/3]" thumbs="bottom" rounded="rounded-[22px]" />
            <div>
              <div className="eyebrow">{sv.category}</div>
              <div className="mt-2 flex items-baseline gap-3"><span className="font-serif text-5xl">{eur(sv.price)}</span><span className="text-sm text-mute">· {sv.durationMin} min</span></div>
              <p className="mt-4 text-sm leading-relaxed text-ivory/85">{sv.description}</p>
              {sv.depositPct > 0 && <p className="mt-3 text-[12.5px] text-gold">{t('Caparra online', 'Online deposit')} {sv.depositPct}% · {eur(Math.round(sv.price * sv.depositPct) / 100)}</p>}
              {performers.length > 0 && <><div className="label mt-6">{t('Eseguito da', 'Performed by')}</div><div className="flex flex-wrap gap-2">{performers.map((m) => <span key={m.id} className="flex items-center gap-2 rounded-full border border-smoke py-1 pl-1 pr-3 text-[12.5px]"><Img src={m.photo} className="h-7 w-7 rounded-full" />{m.name}</span>)}</div></>}
              <p className="mt-6 text-[12px] text-mute">{salon.policies.cancellation}</p>
            </div>
          </div>
        </Modal>
      ); })()}
    </>
  );
}
