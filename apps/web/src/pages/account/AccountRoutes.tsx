import { Bell, Calendar, CreditCard, Heart, LayoutGrid, MapPin, Package, Star, User } from 'lucide-react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useMe, useStore, useT } from '@/lib/store';
import { Avatar, cn } from '@/components/ui';
import Dashboard from './Dashboard';
import Bookings from './Bookings';
import { OrderDetail, Orders } from './Orders';
import { Addresses, Favourites, MyReviews, Notifications, Payments, Profile } from './Misc';
import { NotFound } from '../public/StaticPages';

export default function AccountRoutes() {
  const t = useT();
  const me = useMe()!;
  const unread = useStore((s) => s.notifications.filter((n) => n.userId === s.userId && !n.read).length);
  const nav = [
    ['/account', <LayoutGrid size={16} key="1" />, 'Dashboard', true],
    ['/account/prenotazioni', <Calendar size={16} key="2" />, t('Prenotazioni', 'Bookings')],
    ['/account/ordini', <Package size={16} key="3" />, t('Ordini', 'Orders')],
    ['/account/preferiti', <Heart size={16} key="4" />, t('Preferiti', 'Favourites')],
    ['/account/recensioni', <Star size={16} key="5" />, t('Recensioni', 'Reviews')],
    ['/account/indirizzi', <MapPin size={16} key="6" />, t('Indirizzi', 'Addresses')],
    ['/account/pagamenti', <CreditCard size={16} key="7" />, t('Pagamenti', 'Payments')],
    ['/account/notifiche', <Bell size={16} key="8" />, t('Notifiche', 'Notifications') + (unread ? ` · ${unread}` : '')],
    ['/account/profilo', <User size={16} key="9" />, t('Profilo', 'Profile')],
  ] as const;
  return (
    <div className="wrap pb-16 pt-10">
      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <div className="flex items-center gap-3"><Avatar src={me.avatar} name={me.name} size={52} /><div><div className="font-serif text-2xl leading-tight">{me.name}</div><div className="text-[12px] text-gold">{me.loyaltyPoints ?? 0} {t('punti', 'points')}</div></div></div>
            <nav className="mt-8 space-y-0.5">
              {nav.map(([to, icon, label, end]) => (
                <NavLink key={to} to={to} end={!!end} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition', isActive ? 'bg-crimson/15 text-ivory shadow-[inset_2px_0_0_#B3202A]' : 'text-mute hover:text-ivory')}>{icon}{label}</NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <div className="min-w-0">
          <div className="scroll-x -mx-4 mb-6 px-4 lg:hidden">
            {nav.map(([to, , label, end]) => <NavLink key={to} to={to} end={!!end} className={({ isActive }) => cn('whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px]', isActive ? 'border-ivory bg-ivory text-ink' : 'border-smoke text-ivory/80')}>{label}</NavLink>)}
          </div>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="prenotazioni" element={<Bookings />} />
            <Route path="ordini" element={<Orders />} />
            <Route path="ordini/:id" element={<OrderDetail />} />
            <Route path="preferiti" element={<Favourites />} />
            <Route path="recensioni" element={<MyReviews />} />
            <Route path="indirizzi" element={<Addresses />} />
            <Route path="pagamenti" element={<Payments />} />
            <Route path="notifiche" element={<Notifications />} />
            <Route path="profilo" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export const AHead = ({ title, sub, action }: { title: React.ReactNode; sub?: string; action?: React.ReactNode }) => (
  <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="text-5xl leading-none md:text-6xl">{title}</h1>{sub && <p className="mt-2 text-sm text-mute">{sub}</p>}</div>{action}</div>
);
