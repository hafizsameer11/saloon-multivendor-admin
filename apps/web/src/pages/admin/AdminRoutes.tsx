import { BadgePercent, Calendar, FileCheck2, FolderTree, LayoutGrid, LifeBuoy, MessageSquareWarning, Newspaper, Package, Settings, ShoppingBag, Store, Users, Wallet } from 'lucide-react';
import { Route, Routes } from 'react-router-dom';
import { apiMode, useStore, useT } from '@/lib/store';
import DashboardLayout, { type NavItem } from '@/components/layout/DashboardLayout';
import AdminHome from './AdminHome';
import { ApplicationDetail, Applications } from './Applications';
import { AdminProducts, AdminSalons } from './Catalog';
import { AdminBookings, AdminCustomers, AdminOrders, AdminReviews } from './Operations';
import { AdminCategories, AdminCms, AdminCoupons, AdminPayouts, AdminSettings, AdminSupport } from './Platform';

export default function AdminRoutes() {
  const t = useT();
  const s = useStore();
  const pending = s.applications.filter((a) => a.status === 'pending').length;
  const review = s.products.filter((p) => p.status === 'review').length;
  const reported = s.reviews.filter((r) => r.reported && !r.hidden).length;
  const disputes = s.subOrders.filter((x) => x.returnRequested && x.status !== 'refunded').length;
  const tickets = s.tickets.filter((x) => x.status === 'open').length;
  const nav: NavItem[] = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
    { to: '/admin/richieste', label: t('Richieste venditori', 'Seller applications'), icon: <FileCheck2 size={16} />, badge: pending },
    { to: '/admin/saloni', label: t('Saloni', 'Salons'), icon: <Store size={16} /> },
    { to: '/admin/prodotti', label: t('Moderazione prodotti', 'Product moderation'), icon: <ShoppingBag size={16} />, badge: review },
    { to: '/admin/prenotazioni', label: t('Prenotazioni', 'Bookings'), icon: <Calendar size={16} /> },
    { to: '/admin/ordini', label: t('Ordini e contestazioni', 'Orders & disputes'), icon: <Package size={16} />, badge: disputes },
    { to: '/admin/clienti', label: t('Clienti', 'Customers'), icon: <Users size={16} /> },
    { to: '/admin/recensioni', label: t('Recensioni', 'Reviews'), icon: <MessageSquareWarning size={16} />, badge: reported },
    { to: '/admin/pagamenti', label: apiMode ? t('Prelievi saloni', 'Withdrawals') : t('Payout', 'Payouts'), icon: <Wallet size={16} /> },
    { to: '/admin/categorie', label: t('Categorie', 'Categories'), icon: <FolderTree size={16} /> },
    { to: '/admin/cms', label: 'CMS', icon: <Newspaper size={16} /> },
    { to: '/admin/coupon', label: 'Coupon', icon: <BadgePercent size={16} /> },
    { to: '/admin/supporto', label: t('Supporto', 'Support'), icon: <LifeBuoy size={16} />, badge: tickets },
    { to: '/admin/impostazioni', label: t('Impostazioni', 'Settings'), icon: <Settings size={16} /> },
  ];
  return (
    <Routes>
      <Route element={<DashboardLayout nav={nav} title="Admin" area={t('Pannello piattaforma', 'Platform admin')} />}>
        <Route index element={<AdminHome />} />
        <Route path="richieste" element={<Applications />} />
        <Route path="richieste/:salonId" element={<ApplicationDetail />} />
        <Route path="saloni" element={<AdminSalons />} />
        <Route path="prodotti" element={<AdminProducts />} />
        <Route path="prenotazioni" element={<AdminBookings />} />
        <Route path="ordini" element={<AdminOrders />} />
        <Route path="clienti" element={<AdminCustomers />} />
        <Route path="recensioni" element={<AdminReviews />} />
        <Route path="pagamenti" element={<AdminPayouts />} />
        <Route path="categorie" element={<AdminCategories />} />
        <Route path="cms" element={<AdminCms />} />
        <Route path="coupon" element={<AdminCoupons />} />
        <Route path="supporto" element={<AdminSupport />} />
        <Route path="impostazioni" element={<AdminSettings />} />
        <Route path="*" element={<AdminHome />} />
      </Route>
    </Routes>
  );
}
