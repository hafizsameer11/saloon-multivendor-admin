import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, Compass, Heart, Home, LogOut, Menu, Moon, Search, ShoppingBag, Sparkles, Sun, User, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMe, useStore, useT } from '@/lib/store';
import { cn, Avatar, Button, toast } from '@/components/ui';
import { DemoBar } from './DemoBar';

export const Logo = ({ className, small }: { className?: string; small?: boolean }) => (
  <Link to="/" className={cn('font-serif font-semibold leading-none tracking-[.01em]', small ? 'text-[22px]' : 'text-[28px]', className)}>
    MyBeauty<sup className="ml-0.5 text-[0.7em] text-crimson">+</sup>
  </Link>
);

/** Light / dark theme switch (remembered on this device). */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const lang = useStore((s) => s.lang);
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = lang === 'it' ? (next === 'light' ? 'Tema chiaro' : 'Tema scuro') : next === 'light' ? 'Light theme' : 'Dark theme';
  return (
    <button onClick={() => setTheme(next)} aria-label={label} title={label} className={cn('grid h-9 w-9 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-gold hover:text-gold', className)}>
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className={cn('flex rounded-full border border-ivory/20 p-0.5 text-[10.5px] font-semibold tracking-[.15em]', className)}>
      {(['it', 'en'] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)} className={cn('rounded-full px-2.5 py-1 uppercase transition', lang === l ? 'bg-ivory text-ink' : 'text-ivory/70 hover:text-ivory')}>{l}</button>
      ))}
    </div>
  );
}

function AccountMenu() {
  const me = useMe();
  const t = useT();
  const logout = useStore((s) => s.logout);
  const unread = useStore((s) => s.notifications.filter((n) => n.userId === s.userId && !n.read).length);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  if (!me) return <Link to="/accedi" className="text-[13px] text-ivory/85 hover:text-gold">{t('Accedi', 'Sign in')}</Link>;
  const home = me.role === 'admin' ? '/admin' : me.role === 'seller' ? '/seller' : '/account';
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative flex items-center gap-2 rounded-full border border-ivory/15 py-1 pl-1 pr-3 text-[13px] hover:border-gold/50">
        <Avatar src={me.avatar} name={me.name} size={28} />
        <span className="hidden max-w-[110px] truncate lg:inline">{me.name.split(' ')[0]}</span>
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-crimson px-1 text-[9px] font-bold">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} onMouseLeave={() => setOpen(false)}
            className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-smoke bg-graphite shadow-deep">
            <div className="border-b border-smoke px-4 py-3"><div className="text-sm font-semibold">{me.name}</div><div className="text-[11.5px] text-mute">{me.email}</div></div>
            {[
              [home, me.role === 'customer' ? t('Il mio account', 'My account') : t('Pannello', 'Dashboard'), <User size={15} key="u" />],
              ...(me.role === 'customer' ? [['/account/prenotazioni', t('Prenotazioni', 'Bookings'), <Calendar size={15} key="c" />], ['/account/preferiti', t('Preferiti', 'Favourites'), <Heart size={15} key="h" />]] : []),
              [me.role === 'customer' ? '/account/notifiche' : `${home}`, t('Notifiche', 'Notifications') + (unread ? ` (${unread})` : ''), <Bell size={15} key="b" />],
            ].map(([to, label, icon]) => (
              <Link key={String(label)} to={to as string} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5">{icon}{label}</Link>
            ))}
            <button onClick={() => { logout(); setOpen(false); nav('/'); }} className="flex w-full items-center gap-3 border-t border-smoke px-4 py-2.5 text-left text-sm text-mute hover:bg-white/5"><LogOut size={15} />{t('Esci', 'Sign out')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ transparent }: { transparent?: boolean }) {
  const t = useT();
  const cartCount = useStore((s) => s.cart.reduce((a, l) => a + l.qty, 0));
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 40); f(); window.addEventListener('scroll', f); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => setMenu(false), [loc.pathname]);
  const solid = !transparent || scrolled;
  const links = [
    ['/esplora', t('Saloni', 'Salons')],
    ['/categoria/parrucchiere', t('Servizi', 'Services')],
    ['/shop', 'Shop'],
    ['/professionisti', t('Per i professionisti', 'For professionals')],
  ];
  return (
    <header className={cn('fixed inset-x-0 top-0 z-40 transition duration-300', solid ? 'border-b border-smoke/70 bg-onyx/85 backdrop-blur-xl' : 'on-dark bg-gradient-to-b from-black/60 to-transparent')}>
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13px] tracking-wide lg:flex">
            {links.map(([to, l]) => <NavLink key={to} to={to} className={({ isActive }) => cn('transition hover:text-gold', isActive ? 'text-gold' : 'text-ivory/85')}>{l}</NavLink>)}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/esplora" className="hidden h-10 w-10 place-items-center rounded-full text-ivory/85 hover:text-gold md:grid" aria-label={t('Cerca', 'Search')}><Search size={18} /></Link>
          <ThemeToggle className="hidden sm:grid" />
          <LangToggle className="hidden sm:flex" />
          <Link to="/carrello" className="relative grid h-10 w-10 place-items-center rounded-full text-ivory/85 hover:text-gold" aria-label={t('Carrello', 'Cart')}>
            <ShoppingBag size={19} strokeWidth={1.6} />
            {cartCount > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-crimson px-1 text-[9px] font-bold">{cartCount}</span>}
          </Link>
          <div className="hidden md:block"><AccountMenu /></div>
          <Button to="/professionisti" variant="line" size="sm" className="hidden xl:inline-flex">{t('Apri il tuo salone', 'List your salon')}</Button>
          <button className="grid h-10 w-10 place-items-center lg:hidden" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={22} /></button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-onyx">
            <div className="wrap flex h-[72px] items-center justify-between"><Logo /><button onClick={() => setMenu(false)} aria-label={t('Chiudi', 'Close')}><X size={24} /></button></div>
            <div className="wrap mt-6 flex flex-col gap-1">
              {[...links, ['/carrello', t('Carrello', 'Cart')], ['/account', t('Il mio account', 'My account')]].map(([to, l], i) => (
                <motion.div key={to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={to} className="flex items-baseline gap-4 border-b border-smoke py-4 font-serif text-4xl"><span className="text-sm italic text-gold">0{i + 1}</span>{l}</Link>
                </motion.div>
              ))}
              <div className="mt-6 flex items-center justify-between"><div className="flex items-center gap-2"><LangToggle /><ThemeToggle /></div><AccountMenu /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  const t = useT();
  const cols: [string, [string, string][]][] = [
    [t('Scopri', 'Discover'), [['/esplora', t('Tutti i saloni', 'All salons')], ['/categoria/barber', 'Barber'], ['/categoria/unghie', t('Unghie', 'Nails')], ['/categoria/spa', 'Spa'], ['/shop', 'Shop']]],
    [t('Professionisti', 'Professionals'), [['/professionisti', t('Apri il tuo salone', 'List your salon')], ['/registrati?tipo=pro', t('Registrati come salone', 'Register as salon')], ['/accedi', t('Accedi al pannello', 'Dashboard login')]]],
    ['MyBeauty+', [['/come-funziona', t('Come funziona', 'How it works')], ['/chi-siamo', t('Chi siamo', 'About')], ['/faq', 'FAQ'], ['/contatti', t('Contatti', 'Contact')]]],
    [t('Legale', 'Legal'), [['/legale/termini', t('Termini', 'Terms')], ['/legale/privacy', 'Privacy'], ['/legale/cookie', 'Cookie'], ['/sitemap-dev', 'Sitemap (demo)']]],
  ];
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-smoke bg-graphite-3 pb-28 pt-20 md:pb-10">
      <div className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-serif text-[22vw] leading-none text-white/[.025]">MyBeauty+</div>
      <div className="wrap relative grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm text-mute">{t('Il marketplace della bellezza calabrese: prenota i migliori saloni e acquista i prodotti che usano i professionisti.', 'The Calabrian beauty marketplace: book the best salons and buy the products professionals use.')}</p>
          <form onSubmit={(e) => { e.preventDefault(); (e.currentTarget.elements[0] as HTMLInputElement).value = ''; toast(t('Iscrizione confermata ✓', 'Subscribed ✓'), 'ok'); }} className="mt-6 flex max-w-sm overflow-hidden rounded-full border border-smoke">
            <input required type="email" placeholder={t('La tua email', 'Your email')} className="flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-mute" />
            <button className="bg-crimson px-5 text-[11px] font-semibold uppercase tracking-[.12em]">{t('Iscriviti', 'Subscribe')}</button>
          </form>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map(([h, ls]) => (
            <div key={h}><div className="eyebrow mb-4">{h}</div><ul className="space-y-2.5 text-sm text-ivory/75">{ls.map(([to, l]) => <li key={to}><Link to={to} className="hover:text-gold">{l}</Link></li>)}</ul></div>
          ))}
        </div>
      </div>
      <div className="wrap relative mt-14 flex flex-col justify-between gap-3 border-t border-smoke pt-6 text-[12px] text-mute md:flex-row">
        <span>© 2026 MyBeauty+ S.r.l. · P.IVA 00000000000 · Catanzaro</span>
        <span>{t('Prototipo dimostrativo · dati di esempio', 'Demo prototype · sample data')}</span>
      </div>
    </footer>
  );
}

export function MobileTabBar() {
  const t = useT();
  const items: [string, ReactNode, string][] = [
    ['/', <Home size={19} strokeWidth={1.6} key="h" />, 'Home'],
    ['/esplora', <Compass size={19} strokeWidth={1.6} key="e" />, t('Esplora', 'Explore')],
    ['/shop', <Sparkles size={19} strokeWidth={1.6} key="s" />, 'Shop'],
    ['/account/prenotazioni', <Calendar size={19} strokeWidth={1.6} key="c" />, t('Prenot.', 'Bookings')],
    ['/account', <User size={19} strokeWidth={1.6} key="u" />, t('Profilo', 'Profile')],
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-[24px] border border-smoke bg-graphite/90 px-1 py-2 backdrop-blur-xl md:hidden" aria-label={t('Navigazione', 'Navigation')}>
      {items.map(([to, icon, label]) => (
        <NavLink key={to} to={to} end className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-semibold tracking-wide transition', isActive ? 'text-gold' : 'text-mute')}>
          {icon}{label}
        </NavLink>
      ))}
    </nav>
  );
}

export function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const transparent = pathname === '/' || pathname.startsWith('/salone/') || pathname === '/professionisti';
  return (
    <div className="grain min-h-screen">
      <Header transparent={transparent} />
      <main className={cn(!transparent && 'pt-[72px]')}><Outlet /></main>
      <Footer />
      <MobileTabBar />
      <DemoBar />
    </div>
  );
}
