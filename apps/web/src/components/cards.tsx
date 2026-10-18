import { Heart, MapPin, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { availableSlots, eur, toISO, addDays, CATEGORY_LABELS, type Product, type Salon, type Service } from '@shared/index';
import { slotBookings, slotWindows, useStore, useT } from '@/lib/store';
import { Badge, cn, Img, Stars, toast } from './ui';
import { ThumbStack } from './Gallery';
import { useMemo } from 'react';

export function SalonCard({ salon, compact }: { salon: Salon; compact?: boolean }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const fav = useStore((s) => s.favSalons.includes(salon.id));
  const toggle = useStore((s) => s.toggleFavSalon);
  const services = useStore((s) => s.services);
  const staff = useStore((s) => s.staff);
  const bookings = useStore(slotBookings);
  const wins = useStore(slotWindows);
  const nav = useNavigate();
  const from = Math.min(...services.filter((x) => x.salonId === salon.id && x.active).map((x) => x.price), 999);
  const slots = useMemo(() => {
    for (let d = 0; d < 7; d++) {
      const date = toISO(addDays(new Date(), d));
      const free = availableSlots({ salon, date, durationMin: 30, staffId: null, staff, bookings, windows: wins }).filter((x) => x.free).slice(0, 3);
      if (free.length) return { d, date, free };
    }
    return null;
  }, [salon, staff, bookings, wins]);
  const dayLabel = (d: number) => (d === 0 ? t('Oggi', 'Today') : d === 1 ? t('Domani', 'Tomorrow') : new Date(Date.now() + d * 864e5).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { weekday: 'short' }));
  return (
    <article className="card card-hover group overflow-hidden">
      <Link to={`/salone/${salon.slug}`} className="img-zoom block">
        <Img src={salon.cover} alt={salon.name} className={cn('on-dark', compact ? 'h-48' : 'h-60')}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex gap-2">
            {salon.featured && <Badge className="border-gold/50 bg-black/60 backdrop-blur on-dark">✦ {t('In evidenza', 'Featured')}</Badge>}
          </div>
        </Img>
      </Link>
      <button onClick={() => { toggle(salon.id); toast(fav ? t('Rimosso dai preferiti', 'Removed from favourites') : t('Aggiunto ai preferiti', 'Added to favourites')); }}
        className={cn('absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/55 backdrop-blur transition hover:scale-105 on-dark', fav ? 'text-crimson' : 'text-ivory')} aria-label={t('Preferito', 'Favourite')}>
        <Heart size={17} fill={fav ? 'currentColor' : 'none'} />
      </button>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/salone/${salon.slug}`}><h3 className="text-[28px] leading-[1.05] transition group-hover:text-gold">{salon.name}</h3></Link>
          {salon.verified && <span title={t('Verificato', 'Verified')} className="mt-1 text-gold">✦</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-mute"><MapPin size={13} />{salon.city} · {lang === 'it' ? CATEGORY_LABELS[salon.category].it : CATEGORY_LABELS[salon.category].en}</div>
        {!compact && slots && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {slots.free.map((s, i) => (
              <button key={s.time} onClick={() => nav(`/prenota/${salon.slug}?data=${slots.date}&ora=${s.time}`)}
                className={cn('rounded-full border px-3 py-1.5 text-[12px] transition hover:border-gold hover:text-gold', i === 0 ? 'border-gold/60 text-gold' : 'border-smoke text-ivory/80')}>
                {i === 0 ? `${dayLabel(slots.d)} ` : ''}{s.time}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-smoke pt-4">
          <span className="flex items-center gap-2 text-[12px] text-mute"><Stars value={salon.rating} size={12} />{salon.rating.toFixed(1).replace('.', ',')} · {salon.reviewCount}</span>
          <span className="text-[12px] text-mute">{t('da', 'from')} <b className="font-serif text-2xl font-medium text-ivory">{eur(from === 999 ? 0 : from)}</b></span>
        </div>
      </div>
    </article>
  );
}

export function ProductCard({ product, light = true }: { product: Product; light?: boolean }) {
  const t = useT();
  const salon = useStore((s) => s.salons.find((x) => x.id === product.salonId));
  const add = useStore((s) => s.addToCart);
  const fav = useStore((s) => s.favProducts.includes(product.id));
  const toggle = useStore((s) => s.toggleFavProduct);
  const nav = useNavigate();
  const off = product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  return (
    <article className="group relative">
      <Link to={`/prodotto/${product.id}`} className={cn('relative block aspect-[4/5] overflow-hidden rounded-[22px]', light ? 'bg-ivory-2' : 'bg-graphite-2')}>
        <Img src={product.images[0]} alt={product.name} className="absolute inset-0 transition duration-700 group-hover:opacity-0" />
        <Img src={product.images[1] ?? product.images[0]} alt="" className="absolute inset-0 scale-105 opacity-0 transition duration-700 group-hover:scale-100 group-hover:opacity-100" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {off > 0 && <span className="rounded-full bg-crimson px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white">-{off}%</span>}
          {product.isNew && <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-ivory">{t('Novità', 'New')}</span>}
          {product.stock > 0 && product.stock <= 3 && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-ink">{t('Ultimi pezzi', 'Last few')}</span>}
        </div>
        {product.images.length > 1 && <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1 transition group-hover:opacity-0">{product.images.slice(0, 5).map((_, k) => <span key={k} className={cn('h-1.5 rounded-full', k === 0 ? 'w-4 bg-ink' : 'w-1.5 bg-ink/35')} />)}</span>}
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (product.variants.length) { nav(`/prodotto/${product.id}`); return; } add(product.id); toast(t('Aggiunto al carrello', 'Added to cart'), 'ok'); }}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 rounded-full bg-ink py-3 text-[11.5px] font-semibold uppercase tracking-[.12em] text-ivory opacity-0 transition hover:bg-black group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          <Plus size={14} />{product.variants.length ? t('Scegli variante', 'Choose option') : t('Aggiungi', 'Add to bag')}
        </button>
      </Link>
      <button onClick={() => toggle(product.id)} className={cn('absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 backdrop-blur transition', fav ? 'text-crimson' : 'text-ink')} aria-label={t('Preferito', 'Favourite')}><Heart size={15} fill={fav ? 'currentColor' : 'none'} /></button>
      <div className={cn('mt-3.5 text-[10.5px] uppercase tracking-[.2em]', light ? 'text-mute-2' : 'text-mute')}>{product.brand}</div>
      <Link to={`/prodotto/${product.id}`}><h3 className="mt-1 text-[22px] leading-[1.1]">{product.name}</h3></Link>
      <div className="mt-1.5 flex items-baseline gap-2 font-semibold">{eur(product.price)}{product.compareAtPrice && <s className={cn('text-[13px] font-normal', light ? 'text-mute-2' : 'text-mute')}>{eur(product.compareAtPrice)}</s>}</div>
      <div className={cn('mt-0.5 text-[11.5px]', light ? 'text-mute-2' : 'text-mute')}>{t('Venduto da', 'Sold by')} {salon?.name}</div>
    </article>
  );
}

export function ServiceRow({ service, onBook, selected, onOpen }: { service: Service; onBook: () => void; selected?: boolean; onOpen?: () => void }) {
  const t = useT();
  const imgs = service.images?.length ? service.images : [service.image];
  return (
    <div className={cn('flex items-center gap-4 rounded-[22px] border p-3 pr-4 transition', selected ? 'border-gold/60 bg-gold/5' : 'border-smoke hover:border-gold/30')}>
      <ThumbStack images={imgs} onClick={onOpen} className="h-20 w-20 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><button type="button" onClick={onOpen} className="text-left"><h4 className="text-[22px] leading-tight transition hover:text-gold">{service.name}</h4></button>{service.popular && <Badge tone="gold" className="hidden sm:inline-flex">{t('Più richiesto', 'Popular')}</Badge>}</div>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] text-mute">{service.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-mute"><span>{service.durationMin} min{service.depositPct ? ` · ${t('caparra', 'deposit')} ${service.depositPct}%` : ''}</span>{onOpen && imgs.length > 1 && <button type="button" onClick={onOpen} className="text-gold hover:underline">{t(`Vedi ${imgs.length} foto`, `See ${imgs.length} photos`)}</button>}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-serif text-2xl">{eur(service.price)}</span>
        <button onClick={onBook} className={cn('rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[.1em] transition', selected ? 'bg-gold text-coal' : 'bg-crimson text-snow hover:bg-crimson-dark')}>{selected ? t('Aggiunto ✓', 'Added ✓') : t('Prenota', 'Book')}</button>
      </div>
    </div>
  );
}

// ---------- Stylised map of Calabria (no external tiles needed) ----------
const COAST: [number, number][] = [[15.75, 40.02], [16.25, 40.05], [16.62, 40.02], [16.5, 39.72], [16.85, 39.5], [17.03, 39.38], [17.16, 39.2], [17.13, 39.05], [17.12, 38.9], [16.85, 38.92], [16.6, 38.8], [16.55, 38.65], [16.5, 38.45], [16.33, 38.3], [16.15, 38.12], [16.06, 37.93], [15.85, 37.92], [15.67, 37.95], [15.63, 38.1], [15.72, 38.25], [15.85, 38.38], [15.92, 38.52], [15.83, 38.63], [16.0, 38.72], [16.17, 38.75], [16.2, 38.9], [16.08, 39.1], [16.03, 39.36], [15.95, 39.53], [15.8, 39.8], [15.75, 40.02]];
export function CalabriaMap({ salons, active, onPick, className }: { salons: Salon[]; active?: string | null; onPick?: (id: string) => void; className?: string }) {
  const t = useT();
  const W = 520, H = 720;
  const x = (lng: number) => ((lng - 15.45) / (17.4 - 15.45)) * W;
  const y = (lat: number) => ((40.15 - lat) / (40.15 - 37.8)) * H;
  const path = COAST.map(([lng, lat], i) => `${i ? 'L' : 'M'}${x(lng).toFixed(1)} ${y(lat).toFixed(1)}`).join(' ') + 'Z';
  const cities: [string, number, number][] = [['Cosenza', 16.25, 39.3], ['Catanzaro', 16.59, 38.91], ['Lamezia T.', 16.31, 38.97], ['Crotone', 17.13, 39.08], ['Vibo V.', 16.1, 38.68], ['Reggio C.', 15.65, 38.11], ['Tropea', 15.9, 38.68]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('h-full w-full', className)} role="img" aria-label={t('Mappa dei saloni in Calabria', 'Map of salons in Calabria')}>
      <defs>
        <pattern id="mapgrid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#2E2A2B" strokeWidth=".6" /></pattern>
        <radialGradient id="land" cx="40%" cy="40%"><stop offset="0" stopColor="#262122" /><stop offset="1" stopColor="#1A1819" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="#121011" /><rect width={W} height={H} fill="url(#mapgrid)" />
      <text x="30" y={H - 30} className="fill-[#3a3436] font-serif italic" fontSize="26">{t('Mar Tirreno', 'Tyrrhenian Sea')}</text>
      <text x={W - 30} y="380" textAnchor="end" className="fill-[#3a3436] font-serif italic" fontSize="26">{t('Mar Ionio', 'Ionian Sea')}</text>
      <path d={path} fill="url(#land)" stroke="#CFAE6E" strokeOpacity=".55" strokeWidth="1.4" />
      {cities.map(([n, lng, lat]) => <text key={n} x={x(lng) + 8} y={y(lat) - 8} fontSize="12" className="fill-[#6F6862]" letterSpacing="1.5">{n.toUpperCase()}</text>)}
      {salons.map((s) => {
        const on = active === s.id;
        return (
          <g key={s.id} transform={`translate(${x(s.lng)} ${y(s.lat)})`} className="cursor-pointer" onClick={() => onPick?.(s.id)} onMouseEnter={() => onPick?.(s.id)}>
            {on && <circle r="22" fill="#B3202A" opacity=".25"><animate attributeName="r" values="12;26;12" dur="2s" repeatCount="indefinite" /></circle>}
            <circle r={on ? 9 : 6} fill={on ? '#B3202A' : '#CFAE6E'} stroke="#0E0D0F" strokeWidth="2" />
            {on && <g><rect x="14" y="-30" rx="10" width={s.name.length * 8 + 24} height="28" fill="#F4EEE6" /><text x="26" y="-11" fontSize="13" fontWeight="600" fill="#1B1716">{s.name}</text></g>}
          </g>
        );
      })}
    </svg>
  );
}
