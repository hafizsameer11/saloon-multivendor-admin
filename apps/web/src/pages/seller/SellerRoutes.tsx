import { BadgePercent, Calendar, CalendarClock, FileCheck2, LayoutGrid, Package, Scissors, Settings, ShoppingBag, Star, UserRound, Users, Wallet } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { SALON_STATUS, toISO } from '@shared/index';
import { useMySalon, useStore, useT } from '@/lib/store';
import DashboardLayout, { type NavItem } from '@/components/layout/DashboardLayout';
import { Badge, Button, Img } from '@/components/ui';
import Application from './Application';
import SellerHome from './SellerHome';
import Agenda from './Agenda';
import Services from './Services';
import { ProductEditor, Products } from './Products';
import { SellerOrderDetail, SellerOrders } from './Orders';
import { Clients, Payouts, Promotions, SellerReviews, Staff } from './Misc';
import StoreSettings from './StoreSettings';
import Windows from './Windows';

export default function SellerRoutes() {
  const t = useT();
  const salon = useMySalon()!;
  const s = useStore();
  const approved = salon.status === 'approved';
  const toShip = s.subOrders.filter((x) => x.salonId === salon.id && ['received', 'preparing'].includes(x.status)).length;
  const today = s.bookings.filter((b) => b.salonId === salon.id && b.date === toISO(new Date()) && !['cancelled'].includes(b.status)).length;
  const nav: NavItem[] = [
    { to: '/seller', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
    ...(!approved ? [{ to: '/seller/richiesta', label: t('Richiesta approvazione', 'Approval request'), icon: <FileCheck2 size={16} /> }] : []),
    { to: '/seller/agenda', label: 'Agenda', icon: <Calendar size={16} />, badge: today, disabled: !approved },
    { to: '/seller/fasce', label: t('Fasce orarie', 'Time windows'), icon: <CalendarClock size={16} /> },
    { to: '/seller/servizi', label: t('Servizi', 'Services'), icon: <Scissors size={16} /> },
    { to: '/seller/prodotti', label: t('Prodotti', 'Products'), icon: <ShoppingBag size={16} /> },
    { to: '/seller/ordini', label: t('Ordini', 'Orders'), icon: <Package size={16} />, badge: toShip, disabled: !approved },
    { to: '/seller/staff', label: 'Staff', icon: <UserRound size={16} /> },
    { to: '/seller/clienti', label: t('Clienti', 'Clients'), icon: <Users size={16} />, disabled: !approved },
    { to: '/seller/recensioni', label: t('Recensioni', 'Reviews'), icon: <Star size={16} />, disabled: !approved },
    { to: '/seller/promozioni', label: t('Promozioni', 'Promotions'), icon: <BadgePercent size={16} />, disabled: !approved },
    { to: '/seller/pagamenti', label: t('Pagamenti', 'Payouts'), icon: <Wallet size={16} />, disabled: !approved },
    { to: '/seller/impostazioni', label: t('Impostazioni', 'Settings'), icon: <Settings size={16} /> },
  ];
  const L = (el: JSX.Element) => (approved ? el : (
    <div className="card max-w-xl p-10 text-center"><div className="text-4xl">🔒</div><h2 className="mt-3 text-4xl">{t('Disponibile dopo l’approvazione', 'Available after approval')}</h2><p className="mt-2 text-sm text-mute">{t('Questa sezione si sblocca quando l’admin approva il tuo salone.', 'This section unlocks once admin approves your salon.')}</p><Button to="/seller" className="mt-6">Dashboard</Button></div>
  ));
  const top = (
    <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-smoke p-3">
      <Img src={salon.cover} className="h-10 w-10 rounded-xl" />
      <div className="min-w-0 flex-1"><div className="truncate font-serif text-lg leading-tight">{salon.name}</div><Badge tone={SALON_STATUS[salon.status].tone} className="mt-1 !px-2 !py-0.5 !text-[9px]">{SALON_STATUS[salon.status][s.lang]}</Badge></div>
    </div>
  );
  return (
    <Routes>
      <Route element={<DashboardLayout nav={nav} title={salon.name} area={t('Pannello salone', 'Salon dashboard')} top={top} />}>
        <Route index element={<SellerHome />} />
        <Route path="richiesta" element={<Application />} />
        <Route path="agenda" element={L(<Agenda />)} />
        <Route path="fasce" element={<Windows />} />
        <Route path="servizi" element={<Services />} />
        <Route path="prodotti" element={<Products />} />
        <Route path="prodotti/:id" element={<ProductEditor />} />
        <Route path="ordini" element={L(<SellerOrders />)} />
        <Route path="ordini/:id" element={L(<SellerOrderDetail />)} />
        <Route path="staff" element={<Staff />} />
        <Route path="clienti" element={L(<Clients />)} />
        <Route path="recensioni" element={L(<SellerReviews />)} />
        <Route path="promozioni" element={L(<Promotions />)} />
        <Route path="pagamenti" element={L(<Payouts />)} />
        <Route path="impostazioni" element={<StoreSettings />} />
        <Route path="*" element={<SellerHome />} />
      </Route>
    </Routes>
  );
}
