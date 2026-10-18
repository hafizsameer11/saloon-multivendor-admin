import { Bell, ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMe, useStore, useT } from '@/lib/store';
import { fmtDateTime, type Role } from '@shared/index';
import { Avatar, cn, Drawer } from '@/components/ui';
import { DemoBar } from './DemoBar';
import { LangToggle, Logo, ScrollTop, ThemeToggle } from './PublicLayout';

export interface NavItem { to: string; label: string; icon: ReactNode; badge?: number; end?: boolean; disabled?: boolean }

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const me = useMe();
  const loc = useLocation();
  if (!me) return <Navigate to={`/accedi?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (me.role !== role) return <Navigate to={me.role === 'admin' ? '/admin' : me.role === 'seller' ? '/seller' : '/account'} replace />;
  return <>{children}</>;
}

function Notifications() {
  const lang = useStore((s) => s.lang);
  const t = useT();
  const items = useStore((s) => s.notifications.filter((n) => n.userId === s.userId).slice(0, 12));
  const mark = useStore((s) => s.markNotificationsRead);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;
  return (
    <>
      <button onClick={() => setOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full border border-smoke hover:border-gold/50" aria-label={t('Notifiche', 'Notifications')}>
        <Bell size={17} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-crimson px-1 text-[9px] font-bold">{unread}</span>}
      </button>
      <Drawer open={open} onClose={() => { setOpen(false); mark(); }} title={t('Notifiche', 'Notifications')}>
        {items.length === 0 && <p className="text-sm text-mute">{t('Nessuna notifica.', 'No notifications.')}</p>}
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Link to={n.link ?? '#'} onClick={() => { setOpen(false); mark(); }} className={cn('block rounded-2xl border p-4 transition hover:border-gold/40', n.read ? 'border-smoke' : 'border-gold/30 bg-gold/5')}>
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{n.title}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-crimson" />}</div>
                <p className="mt-1 text-[13px] text-mute">{n.body}</p>
                <span className="mt-2 block text-[11px] text-mute/70">{fmtDateTime(n.at, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}

export default function DashboardLayout({ nav, title, area, top }: { nav: NavItem[]; title: string; area: string; top?: ReactNode }) {
  const me = useMe()!;
  const t = useT();
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const Side = (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-6"><Logo small /><div className="eyebrow mt-2 text-[10px]">{area}</div></div>
      {top}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
        {nav.map((n) => n.disabled ? (
          <div key={n.to} title={t('Disponibile dopo l’approvazione', 'Available after approval')} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-mute/40">{n.icon}<span className="flex-1">{n.label}</span><span className="text-[9px] uppercase tracking-widest">🔒</span></div>
        ) : (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setMobile(false)}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition', isActive ? 'bg-crimson/15 text-ivory shadow-[inset_2px_0_0_#B3202A]' : 'text-mute hover:bg-white/[.03] hover:text-ivory')}>
            {n.icon}<span className="flex-1">{n.label}</span>{!!n.badge && <span className="rounded-full bg-crimson px-1.5 py-0.5 text-[10px] font-bold text-snow">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-smoke p-4">
        <div className="flex items-center gap-3"><Avatar src={me.avatar} name={me.name} size={36} /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{me.name}</div><div className="truncate text-[11px] text-mute">{me.email}</div></div>
          <button onClick={() => { logout(); navigate('/'); }} className="text-mute hover:text-crimson" aria-label={t('Esci', 'Sign out')}><LogOut size={16} /></button></div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-onyx">
      <ScrollTop />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-smoke bg-graphite-3 lg:block">{Side}</aside>
      {mobile && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobile(false)}>
          <aside className="h-full w-[280px] border-r border-smoke bg-graphite-3" onClick={(e) => e.stopPropagation()}>
            <button className="absolute left-[240px] top-5 text-mute" onClick={() => setMobile(false)}><X size={20} /></button>{Side}
          </aside>
        </div>
      )}
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-smoke bg-onyx/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu size={22} /></button>
            <h1 className="font-serif text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden items-center gap-1.5 text-[12px] text-mute hover:text-gold sm:flex"><ExternalLink size={13} />{t('Vai al sito', 'View site')}</Link>
            <ThemeToggle /><LangToggle className="hidden sm:flex" />
            <Notifications />
          </div>
        </header>
        <main className="px-4 py-8 sm:px-8"><Outlet /></main>
      </div>
      <DemoBar dash />
    </div>
  );
}

export const PageHead = ({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div><h2 className="text-4xl leading-none md:text-[44px]">{title}</h2>{sub && <p className="mt-2 text-sm text-mute">{sub}</p>}</div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);
