import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster, toast } from '@/components/ui';
import { ScrollTop } from '@/components/layout/PublicLayout';
import PublicLayout from '@/components/layout/PublicLayout';
import { RequireRole } from '@/components/layout/DashboardLayout';
import { apiMode, useStore } from '@/lib/store';
import { BootScreen } from '@/components/layout/BootScreen';

// public
import Home from '@/pages/public/Home';
import Explore from '@/pages/public/Explore';
import SalonPage from '@/pages/public/SalonPage';
import Shop from '@/pages/public/Shop';
import ProductPage from '@/pages/public/ProductPage';
import CategoryPage from '@/pages/public/CategoryPage';
import { About, Contact, Faq, HowItWorks, Legal, NotFound, SitemapDev } from '@/pages/public/StaticPages';
import ForPros from '@/pages/public/ForPros';
// flows
import BookingWizard from '@/pages/flows/BookingWizard';
import BookingConfirmed from '@/pages/flows/BookingConfirmed';
import Cart from '@/pages/flows/Cart';
import Checkout from '@/pages/flows/Checkout';
import OrderSuccess from '@/pages/flows/OrderSuccess';
import { ForgotPassword, Login, Register, ResetPassword } from '@/pages/flows/Auth';
// panels
import AccountRoutes from '@/pages/account/AccountRoutes';
import SellerRoutes from '@/pages/seller/SellerRoutes';
import AdminRoutes from '@/pages/admin/AdminRoutes';

export default function App() {
  const lang = useStore((s) => s.lang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F7F2EB' : '#0E0D0F');
  }, [theme]);
  useEffect(() => {
    const full = () => toast(lang === 'it' ? 'Memoria demo del browser piena: alcune foto caricate non verranno salvate. Usa “Reset dati” o foto più leggere.' : 'Browser demo storage is full: some uploaded photos won’t be saved. Use “Reset data” or lighter photos.', 'red');
    window.addEventListener('mb-storage-full', full);
    return () => window.removeEventListener('mb-storage-full', full);
  }, [lang]);
  const ready = useStore((s) => s.sync.ready);
  useEffect(() => {
    if (!apiMode) return;
    useStore.getState().bootstrap?.();
    const err = (e: Event) => toast((e as CustomEvent<string>).detail, 'red');
    const info = (e: Event) => toast((e as CustomEvent<string>).detail);
    const expired = () => { useStore.setState({ userId: null }); toast(lang === 'it' ? 'Sessione scaduta: accedi di nuovo' : 'Session expired: please sign in again', 'red'); };
    window.addEventListener('mb-api-error', err);
    window.addEventListener('mb-api-info', info);
    window.addEventListener('mb-session-expired', expired);
    return () => { window.removeEventListener('mb-api-error', err); window.removeEventListener('mb-api-info', info); window.removeEventListener('mb-session-expired', expired); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (apiMode && !ready) return <><BootScreen /><Toaster /></>;
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="esplora" element={<Explore />} />
          <Route path="salone/:slug" element={<SalonPage />} />
          <Route path="shop" element={<Shop />} />
          <Route path="prodotto/:id" element={<ProductPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="prenota/:slug" element={<BookingWizard />} />
          <Route path="prenotazione/:id" element={<BookingConfirmed />} />
          <Route path="carrello" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="ordine/:id" element={<OrderSuccess />} />
          <Route path="accedi" element={<Login />} />
          <Route path="registrati" element={<Register />} />
          <Route path="password-dimenticata" element={<ForgotPassword />} />
          <Route path="reimposta-password" element={<ResetPassword />} />
          <Route path="come-funziona" element={<HowItWorks />} />
          <Route path="professionisti" element={<ForPros />} />
          <Route path="chi-siamo" element={<About />} />
          <Route path="faq" element={<Faq />} />
          <Route path="contatti" element={<Contact />} />
          <Route path="legale/:page" element={<Legal />} />
          <Route path="sitemap-dev" element={<SitemapDev />} />
          <Route path="account/*" element={<RequireRole role="customer"><AccountRoutes /></RequireRole>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="seller/*" element={<RequireRole role="seller"><SellerRoutes /></RequireRole>} />
        <Route path="admin/*" element={<RequireRole role="admin"><AdminRoutes /></RequireRole>} />
      </Routes>
      <Toaster />
    </>
  );
}
