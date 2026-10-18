import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  createSeed, uid, code, toISO, type DB, type Booking, type CartLine, type Product, type Review, type Salon,
  type SellerApplication, type Service, type Staff, type SubOrder, type User, type Address, type Coupon, type Order, type PaymentMode,
  type ShippingMethod, type SubOrderStatus, type BookingStatus, type Notification,
  type TimeWindow, type WindowInput, type WindowSkip, planWindows, windowText, countWindowPlaces,
} from '@shared/index';
import { emptyDB, installRemote, initialSyncState, type RemoteActions, type SyncState } from '@shared/api/sync';
import { api, apiMode, setLangGetter, tokenStore } from './api';

/**
 * Prototype store. Every action here maps 1:1 to a future API call / Express API call
 * (see src/api in Phase 6). Pages only call these actions, never mutate data directly.
 */

export type Lang = 'it' | 'en';

interface Session {
  userId: string | null;
  lang: Lang;
  theme: 'dark' | 'light';
  cart: CartLine[];
  favSalons: string[];
  favProducts: string[];
  recent: string[];
}

interface Actions {
  // session
  setLang: (l: Lang) => void;
  setTheme: (t: 'dark' | 'light') => void;
  login: (email: string) => User | null;
  loginAs: (userId: string) => void;
  logout: () => void;
  registerCustomer: (d: { name: string; email: string; phone: string }) => User;
  registerSeller: (d: { name: string; email: string; phone: string; salonName: string; category: Salon['category']; city: string }) => User;
  resetDemo: () => void;
  // customer
  toggleFavSalon: (id: string) => void;
  toggleFavProduct: (id: string) => void;
  addToCart: (productId: string, qty?: number, variantId?: string) => void;
  setCartQty: (productId: string, variantId: string | undefined, qty: number) => void;
  clearCart: () => void;
  createBooking: (d: { salonId: string; serviceIds: string[]; staffId: string | null; date: string; time: string; durationMin: number; total: number; deposit: number; paymentMode: PaymentMode; notes?: string; name: string; phone: string; pickupProductIds?: string[]; windowId?: string | null }) => Booking;
  cancelBooking: (id: string) => void;
  rescheduleBooking: (id: string, date: string, time: string) => void;
  addReview: (d: Omit<Review, 'id' | 'createdAt' | 'customerId' | 'customerName' | 'customerAvatar'>) => void;
  placeOrder: (d: { methods: Record<string, ShippingMethod>; address?: Address; payment: string; coupon?: Coupon | null }) => Order;
  requestReturn: (subOrderId: string) => void;
  saveAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  updateProfile: (p: Partial<User>) => void;
  markNotificationsRead: () => void;
  // seller
  saveApplication: (patch: Partial<SellerApplication>) => void;
  updateSalon: (id: string, patch: Partial<Salon>) => void;
  submitApplication: () => void;
  upsertService: (s: Service) => void;
  deleteService: (id: string) => void;
  /** salon time windows: one per matching day in the range; returns what was created / skipped */
  createWindows: (w: WindowInput) => Promise<{ created: TimeWindow[]; skipped: { date: string; reason: WindowSkip }[] }>;
  updateWindow: (id: string, p: Partial<Pick<TimeWindow, 'capacity' | 'serviceIds' | 'note' | 'open'>>) => void;
  deleteWindow: (id: string) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertStaff: (s: Staff) => void;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  addWalkIn: (b: Omit<Booking, 'id' | 'code' | 'createdAt'>) => void;
  setSubOrderStatus: (id: string, status: SubOrderStatus, tracking?: string) => void;
  replyReview: (id: string, reply: string) => void;
  upsertCoupon: (c: Coupon) => void;
  // admin
  approveApplication: (salonId: string) => void;
  rejectApplication: (salonId: string, reason: string) => void;
  requestInfo: (salonId: string, reason: string) => void;
  setSalonStatus: (salonId: string, status: Salon['status']) => void;
  setCommission: (salonId: string, rate: number) => void;
  toggleFeatured: (salonId: string) => void;
  moderateProduct: (id: string, ok: boolean, reason?: string) => void;
  setReviewHidden: (id: string, hidden: boolean) => void;
  markPayoutPaid: (id: string) => void;
  toggleBanner: (id: string) => void;
  setUserBlocked: (id: string, blocked: boolean) => void;
  setTicketStatus: (id: string, status: 'open' | 'closed') => void;
  setApplicationNotes: (salonId: string, notes: string, checklist?: SellerApplication['checklist']) => void;
}

export type Store = DB & Session & Actions & SyncState & Partial<RemoteActions>;

const notify = (userId: string, title: string, body: string, link?: string): Notification => ({ id: uid('n'), userId, title, body, link, at: new Date().toISOString(), read: false });

const initialSession: Session = { userId: null, lang: 'it', theme: 'dark', cart: [], favSalons: ['s2', 's4'], favProducts: [], recent: [] };

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...(apiMode ? emptyDB() : createSeed()),
      ...initialSession,
      ...initialSyncState(),

      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      login: (email) => {
        const u = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (u && !u.blocked) set({ userId: u.id });
        return u && !u.blocked ? u : null;
      },
      loginAs: (userId) => set({ userId }),
      logout: () => set({ userId: null }),
      registerCustomer: (d) => {
        const u: User = { id: uid('u'), role: 'customer', name: d.name, email: d.email, phone: d.phone, createdAt: new Date().toISOString(), addresses: [], loyaltyPoints: 50 };
        set((s) => ({ users: [...s.users, u], userId: u.id, notifications: [notify(u.id, 'Benvenuta su MyBeauty+', 'Hai ricevuto 50 punti fedeltà di benvenuto.'), ...s.notifications] }));
        return u;
      },
      registerSeller: (d) => {
        const salonId = uid('s');
        const u: User = { id: uid('u'), role: 'seller', name: d.name, email: d.email, phone: d.phone, createdAt: new Date().toISOString(), addresses: [], salonId };
        const slug = d.salonName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || salonId;
        const salon: Salon = {
          id: salonId, slug, ownerId: u.id, name: d.salonName, tagline: '', description: '', category: d.category, city: d.city, address: '', zip: '', lat: 38.9, lng: 16.6,
          phone: d.phone, email: d.email, cover: '', gallery: [], hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: day === 0 || day === 6 ? null : '09:00', close: day === 0 || day === 6 ? null : '19:00' })),
          rating: 0, reviewCount: 0, status: 'draft', commissionRate: 0.12, priceLevel: 2, amenities: [],
          policies: { cancellation: 'Cancellazione gratuita fino a 24 ore prima.', noShow: 'La caparra non è rimborsabile in caso di mancata presentazione.', shippingZones: 'Italia', shippingFee: 5.9, freeShippingOver: 49 },
          createdAt: new Date().toISOString(),
        };
        const app: SellerApplication = {
          id: uid('app'), salonId, ownerId: u.id, ragioneSociale: '', pIva: '', codiceFiscale: '', sdi: '', pec: '', legalAddress: '', iban: '', accountHolder: d.name, documents: [], status: 'draft',
          checklist: { docs: false, vat: false, iban: false, photos: false },
        };
        set((s) => ({ users: [...s.users, u], salons: [...s.salons, salon], applications: [...s.applications, app], userId: u.id }));
        return u;
      },
      resetDemo: () => set({ ...createSeed(), ...initialSession }),

      toggleFavSalon: (id) => set((s) => ({ favSalons: s.favSalons.includes(id) ? s.favSalons.filter((x) => x !== id) : [...s.favSalons, id] })),
      toggleFavProduct: (id) => set((s) => ({ favProducts: s.favProducts.includes(id) ? s.favProducts.filter((x) => x !== id) : [...s.favProducts, id] })),
      addToCart: (productId, qty = 1, variantId) => set((s) => {
        const ex = s.cart.find((l) => l.productId === productId && l.variantId === variantId);
        return { cart: ex ? s.cart.map((l) => (l === ex ? { ...l, qty: l.qty + qty } : l)) : [...s.cart, { productId, variantId, qty }] };
      }),
      setCartQty: (productId, variantId, qty) => set((s) => ({ cart: qty <= 0 ? s.cart.filter((l) => !(l.productId === productId && l.variantId === variantId)) : s.cart.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, qty } : l)) })),
      clearCart: () => set({ cart: [] }),

      createBooking: (d) => {
        const st = get();
        const user = st.users.find((u) => u.id === st.userId);
        const b: Booking = {
          id: uid('b'), code: code('MB'), customerId: user?.id ?? 'guest', customerName: d.name, customerPhone: d.phone, salonId: d.salonId, staffId: d.staffId, serviceIds: d.serviceIds,
          date: d.date, time: d.time, windowId: d.windowId ?? null, durationMin: d.durationMin, total: d.total, deposit: d.deposit, paymentMode: d.paymentMode, status: 'booked', notes: d.notes, pickupProductIds: d.pickupProductIds, createdAt: new Date().toISOString(),
        };
        const salon = st.salons.find((s) => s.id === d.salonId)!;
        set((s) => ({
          bookings: [...s.bookings, b],
          notifications: [notify(salon.ownerId, 'Nuova prenotazione', `${d.name} ha prenotato per il ${d.date} alle ${d.time}.`, '/seller/agenda'), ...(user ? [notify(user.id, 'Prenotazione confermata', `${salon.name}, ${d.date} alle ${d.time}.`, '/account/prenotazioni')] : []), ...s.notifications],
        }));
        return b;
      },
      cancelBooking: (id) => set((s) => {
        const b = s.bookings.find((x) => x.id === id)!;
        const salon = s.salons.find((x) => x.id === b.salonId)!;
        return { bookings: s.bookings.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)), notifications: [notify(salon.ownerId, 'Prenotazione annullata', `${b.customerName} ha annullato ${b.date} ${b.time}.`, '/seller/agenda'), ...s.notifications] };
      }),
      rescheduleBooking: (id, date, time) => set((s) => ({ bookings: s.bookings.map((x) => (x.id === id ? { ...x, date, time, status: 'booked' } : x)) })),
      addReview: (d) => set((s) => {
        const u = s.users.find((x) => x.id === s.userId)!;
        const r: Review = { ...d, id: uid('r'), createdAt: new Date().toISOString(), customerId: u.id, customerName: u.name, customerAvatar: u.avatar };
        const salons = d.productId ? s.salons : s.salons.map((x) => (x.id === d.salonId ? { ...x, reviewCount: x.reviewCount + 1, rating: Math.round(((x.rating * x.reviewCount + d.rating) / (x.reviewCount + 1)) * 10) / 10 } : x));
        return { reviews: [r, ...s.reviews], salons, bookings: d.bookingId ? s.bookings.map((b) => (b.id === d.bookingId ? { ...b, reviewed: true } : b)) : s.bookings };
      }),
      placeOrder: ({ methods, address, payment, coupon }) => {
        const st = get();
        const user = st.users.find((u) => u.id === st.userId)!;
        const orderId = uid('o');
        const oc = code('MB');
        const bySalon: Record<string, CartLine[]> = {};
        st.cart.forEach((l) => { const p = st.products.find((x) => x.id === l.productId)!; (bySalon[p.salonId] ||= []).push(l); });
        const subs: SubOrder[] = Object.entries(bySalon).map(([salonId, lines], i) => {
          const salon = st.salons.find((x) => x.id === salonId)!;
          const items = lines.map((l) => {
            const p = st.products.find((x) => x.id === l.productId)!;
            const v = p.variants.find((x) => x.id === l.variantId);
            return { productId: p.id, variantId: l.variantId, name: p.name + (v ? ` · ${v.label}` : ''), image: p.images[0], price: p.price + (v?.priceDelta ?? 0), qty: l.qty };
          });
          const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
          const method = methods[salonId] ?? 'standard';
          const fee = method === 'pickup' || subtotal >= salon.policies.freeShippingOver ? 0 : salon.policies.shippingFee;
          return { id: `${orderId}-${i}`, code: `${oc}-${i + 1}`, orderId, salonId, items, shippingMethod: method, shippingFee: fee, subtotal, status: 'received', timeline: [{ status: 'received', at: new Date().toISOString() }] };
        });
        const gross = subs.reduce((a, x) => a + x.subtotal + x.shippingFee, 0);
        const discount = coupon ? (coupon.type === 'percent' ? Math.round(gross * coupon.value) / 100 : coupon.value) : 0;
        const order: Order = { id: orderId, code: oc, customerId: user.id, customerName: user.name, createdAt: new Date().toISOString(), address, paymentMethod: payment, discount, total: Math.round((gross - discount) * 100) / 100, subOrderIds: subs.map((x) => x.id) };
        set((s) => ({
          orders: [order, ...s.orders], subOrders: [...subs, ...s.subOrders], cart: [],
          products: s.products.map((p) => { const l = s.cart.filter((c) => c.productId === p.id); const q = l.reduce((a, c) => a + c.qty, 0); return q ? { ...p, stock: Math.max(0, p.stock - q), sold: p.sold + q } : p; }),
          coupons: coupon ? s.coupons.map((c) => (c.id === coupon.id ? { ...c, uses: c.uses + 1 } : c)) : s.coupons,
          users: s.users.map((u) => (u.id === user.id ? { ...u, loyaltyPoints: (u.loyaltyPoints ?? 0) + Math.floor(gross) } : u)),
          notifications: [...subs.map((x) => notify(s.salons.find((y) => y.id === x.salonId)!.ownerId, 'Nuovo ordine', `Ordine ${x.code} da preparare (${x.items.length} articoli).`, '/seller/ordini')), notify(user.id, 'Ordine ricevuto', `Ordine ${oc} confermato. Ti avviseremo alla spedizione.`, '/account/ordini'), ...s.notifications],
        }));
        return order;
      },
      requestReturn: (id) => set((s) => ({ subOrders: s.subOrders.map((x) => (x.id === id ? { ...x, returnRequested: true } : x)) })),
      saveAddress: (a) => set((s) => ({ users: s.users.map((u) => (u.id === s.userId ? { ...u, addresses: u.addresses.some((x) => x.id === a.id) ? u.addresses.map((x) => (x.id === a.id ? a : a.isDefault ? { ...x, isDefault: false } : x)) : [...u.addresses.map((x) => (a.isDefault ? { ...x, isDefault: false } : x)), a] } : u)) })),
      removeAddress: (id) => set((s) => ({ users: s.users.map((u) => (u.id === s.userId ? { ...u, addresses: u.addresses.filter((x) => x.id !== id) } : u)) })),
      updateProfile: (p) => set((s) => ({ users: s.users.map((u) => (u.id === s.userId ? { ...u, ...p } : u)) })),
      markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => (n.userId === s.userId ? { ...n, read: true } : n)) })),

      saveApplication: (patch) => set((s) => {
        const u = s.users.find((x) => x.id === s.userId);
        return { applications: s.applications.map((a) => (a.salonId === u?.salonId ? { ...a, ...patch } : a)) };
      }),
      updateSalon: (id, patch) => set((s) => ({ salons: s.salons.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      submitApplication: () => set((s) => {
        const u = s.users.find((x) => x.id === s.userId)!;
        const admin = s.users.find((x) => x.role === 'admin')!;
        const salon = s.salons.find((x) => x.id === u.salonId)!;
        return {
          applications: s.applications.map((a) => (a.salonId === u.salonId ? { ...a, status: 'pending', submittedAt: new Date().toISOString(), rejectionReason: undefined } : a)),
          salons: s.salons.map((x) => (x.id === u.salonId ? { ...x, status: 'pending' } : x)),
          notifications: [notify(admin.id, 'Nuova richiesta venditore', `${salon.name} ha inviato la richiesta di approvazione.`, `/admin/richieste/${salon.id}`), notify(u.id, 'Richiesta inviata', 'Il nostro team la verificherà entro 48 ore lavorative.', '/seller'), ...s.notifications],
        };
      }),
      upsertService: (sv) => set((s) => ({ services: s.services.some((x) => x.id === sv.id) ? s.services.map((x) => (x.id === sv.id ? sv : x)) : [...s.services, sv] })),
      deleteService: (id) => set((s) => ({ services: s.services.filter((x) => x.id !== id) })),
      createWindows: async (w) => {
        const st = get();
        const me = st.users.find((u) => u.id === st.userId);
        const salonId = me?.salonId;
        if (!salonId) throw new Error('No salon');
        const plan = planWindows(w, { services: st.services.filter((x) => x.salonId === salonId), existing: st.windows.filter((x) => x.salonId === salonId), bookings: st.bookings.filter((b) => b.salonId === salonId) });
        if ('error' in plan) throw new Error(windowText(plan.error, st.lang) + (plan.detail ? `: ${plan.detail}` : ''));
        const created: TimeWindow[] = plan.dates.map((date) => ({ id: uid('w'), salonId, date, start: w.start, end: w.end, serviceIds: w.serviceIds, capacity: w.capacity, staffId: w.staffId ?? null, note: w.note || undefined, open: true, booked: 0 }));
        set((s) => ({ windows: [...s.windows, ...created] }));
        return { created, skipped: plan.skipped };
      },
      updateWindow: (id, p) => set((s) => ({ windows: s.windows.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteWindow: (id) => set((s) => ({ windows: s.windows.filter((x) => x.id !== id) })),
      upsertProduct: (p) => set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      upsertStaff: (m) => set((s) => ({ staff: s.staff.some((x) => x.id === m.id) ? s.staff.map((x) => (x.id === m.id ? m : x)) : [...s.staff, m] })),
      setBookingStatus: (id, status) => set((s) => {
        const b = s.bookings.find((x) => x.id === id)!;
        const salon = s.salons.find((x) => x.id === b.salonId)!;
        const msg = status === 'confirmed' ? `${salon.name} ha confermato il tuo appuntamento.` : status === 'cancelled' ? `${salon.name} ha annullato l’appuntamento del ${b.date}.` : null;
        return { bookings: s.bookings.map((x) => (x.id === id ? { ...x, status } : x)), notifications: msg ? [notify(b.customerId, 'Aggiornamento prenotazione', msg, '/account/prenotazioni'), ...s.notifications] : s.notifications };
      }),
      addWalkIn: (b) => set((s) => ({ bookings: [...s.bookings, { ...b, id: uid('b'), code: code('MB'), createdAt: new Date().toISOString() }] })),
      setSubOrderStatus: (id, status, tracking) => set((s) => {
        const so = s.subOrders.find((x) => x.id === id)!;
        const order = s.orders.find((o) => o.id === so.orderId)!;
        const label = { awaiting_payment: 'è in attesa di pagamento', shipped: 'è stato spedito', ready_pickup: 'è pronto al ritiro in salone', delivered: 'è stato consegnato', preparing: 'è in preparazione', refunded: 'è stato rimborsato', cancelled: 'è stato annullato', received: 'è stato ricevuto' }[status];
        return {
          subOrders: s.subOrders.map((x) => (x.id === id ? { ...x, status, trackingNo: tracking ?? x.trackingNo, carrier: tracking ? 'BRT' : x.carrier, timeline: [...x.timeline, { status, at: new Date().toISOString() }] } : x)),
          notifications: [notify(order.customerId, 'Aggiornamento ordine', `Il tuo ordine ${so.code} ${label}.`, `/account/ordini/${order.id}`), ...s.notifications],
        };
      }),
      replyReview: (id, reply) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, reply } : r)) })),
      upsertCoupon: (c) => set((s) => ({ coupons: s.coupons.some((x) => x.id === c.id) ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [c, ...s.coupons] })),

      approveApplication: (salonId) => set((s) => {
        const salon = s.salons.find((x) => x.id === salonId)!;
        return {
          applications: s.applications.map((a) => (a.salonId === salonId ? { ...a, status: 'approved', reviewedAt: new Date().toISOString(), rejectionReason: undefined, checklist: { docs: true, vat: true, iban: true, photos: true } } : a)),
          salons: s.salons.map((x) => (x.id === salonId ? { ...x, status: 'approved', verified: true } : x)),
          products: s.products.map((p) => (p.salonId === salonId && p.status === 'draft' ? { ...p, status: 'review' } : p)),
          notifications: [notify(salon.ownerId, 'Salone approvato!', 'Ora puoi pubblicare servizi e prodotti. Il tuo salone è visibile ai clienti.', '/seller'), ...s.notifications],
        };
      }),
      rejectApplication: (salonId, reason) => set((s) => {
        const salon = s.salons.find((x) => x.id === salonId)!;
        return {
          applications: s.applications.map((a) => (a.salonId === salonId ? { ...a, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: reason } : a)),
          salons: s.salons.map((x) => (x.id === salonId ? { ...x, status: 'rejected' } : x)),
          notifications: [notify(salon.ownerId, 'Richiesta non approvata', reason, '/seller/richiesta'), ...s.notifications],
        };
      }),
      requestInfo: (salonId, reason) => set((s) => {
        const salon = s.salons.find((x) => x.id === salonId)!;
        return {
          applications: s.applications.map((a) => (a.salonId === salonId ? { ...a, status: 'needs_info', rejectionReason: reason } : a)),
          salons: s.salons.map((x) => (x.id === salonId ? { ...x, status: 'needs_info' } : x)),
          notifications: [notify(salon.ownerId, 'Servono altre informazioni', reason, '/seller/richiesta'), ...s.notifications],
        };
      }),
      setSalonStatus: (salonId, status) => set((s) => ({ salons: s.salons.map((x) => (x.id === salonId ? { ...x, status } : x)), applications: s.applications.map((a) => (a.salonId === salonId ? { ...a, status } : a)) })),
      setCommission: (salonId, rate) => set((s) => ({ salons: s.salons.map((x) => (x.id === salonId ? { ...x, commissionRate: rate } : x)) })),
      toggleFeatured: (salonId) => set((s) => ({ salons: s.salons.map((x) => (x.id === salonId ? { ...x, featured: !x.featured } : x)) })),
      moderateProduct: (id, ok, reason) => set((s) => {
        const p = s.products.find((x) => x.id === id)!;
        const salon = s.salons.find((x) => x.id === p.salonId)!;
        return {
          products: s.products.map((x) => (x.id === id ? { ...x, status: ok ? 'published' : 'rejected', rejectionReason: ok ? undefined : reason } : x)),
          notifications: [notify(salon.ownerId, ok ? 'Prodotto pubblicato' : 'Prodotto rifiutato', ok ? `“${p.name}” è ora visibile nello shop.` : `“${p.name}”: ${reason}`, '/seller/prodotti'), ...s.notifications],
        };
      }),
      setReviewHidden: (id, hidden) => set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, hidden, reported: false } : r)) })),
      markPayoutPaid: (id) => set((s) => ({ payouts: s.payouts.map((p) => (p.id === id ? { ...p, status: 'paid', paidAt: toISO(new Date()) } : p)) })),
      toggleBanner: (id) => set((s) => ({ banners: s.banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b)) })),
      setUserBlocked: (id, blocked) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, blocked } : u)) })),
      setTicketStatus: (id, status) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) })),
      setApplicationNotes: (salonId, notes, checklist) => set((s) => ({ applications: s.applications.map((a) => (a.salonId === salonId ? { ...a, adminNotes: notes, checklist: checklist ?? a.checklist } : a)) })),
    }),
    {
      name: apiMode ? 'mybeauty-api-v1' : 'mybeauty-demo-v1',
      version: 3,
      // API mode: the server is the source of truth → only keep session preferences in the browser
      ...(apiMode ? { partialize: (st: Store) => ({ lang: st.lang, theme: st.theme, cart: st.cart, recent: st.recent, favSalons: st.favSalons, favProducts: st.favProducts }) as unknown as Store } : {}),
      // Uploaded photos are stored as compressed data URLs in the prototype; browsers cap localStorage (~5 MB).
      storage: createJSONStorage(() => ({
        getItem: (k) => localStorage.getItem(k),
        removeItem: (k) => localStorage.removeItem(k),
        setItem: (k, v) => {
          try { localStorage.setItem(k, v); } catch {
            window.dispatchEvent(new CustomEvent('mb-storage-full'));
          }
        },
      })),
      // v1 → v2: services gained an `images` gallery
      migrate: (persisted, version) => {
        const st = persisted as Store;
        if (version < 2 && st?.services) st.services = st.services.map((x) => ({ ...x, images: x.images?.length ? x.images : [x.image] }));
        if (version < 3 && st && !apiMode && !st.windows) st.windows = createSeed().windows;
        return st;
      },
    },
  ),
);

setLangGetter(() => useStore.getState().lang);
if (apiMode) {
  installRemote(useStore, api, {
    getTokens: () => tokenStore.get(),
    onError: (message) => window.dispatchEvent(new CustomEvent('mb-api-error', { detail: message })),
    onInfo: (message) => window.dispatchEvent(new CustomEvent('mb-api-info', { detail: message })),
  });
}
export { apiMode };

// ---------- selectors / hooks ----------
/** Bookings used for availability: in API mode the anonymous busy blocks of every salon (server data). */
export const slotBookings = (s: Store) => (apiMode ? (s.busy as unknown as Booking[]) : s.bookings);
/** Windows for the slot engine: demo mode only (in API mode the server folds staffed windows into `busy`). */
const NO_WINDOWS: TimeWindow[] = [];
export const slotWindows = (s: Store) => (apiMode ? NO_WINDOWS : s.windows);
/** Time windows with places taken filled in (server-computed in API mode). Memoised: safe in render. */
export function useWindows(): TimeWindow[] {
  const w = useStore((s) => s.windows);
  const b = useStore((s) => s.bookings);
  return useMemo(() => (apiMode ? w : countWindowPlaces(w, b)), [w, b]);
}
export const useMe = () => useStore((s) => s.users.find((u) => u.id === s.userId) ?? null);
export const useLang = () => useStore((s) => s.lang);
export const useT = () => {
  const lang = useStore((s) => s.lang);
  return (it: string, en: string) => (lang === 'it' ? it : en);
};
export const useMySalon = () => useStore((s) => { const u = s.users.find((x) => x.id === s.userId); return u?.salonId ? s.salons.find((x) => x.id === u.salonId) ?? null : null; });
export const publicSalons = (s: Store) => s.salons.filter((x) => x.status === 'approved');
export const publicProducts = (s: Store) => { const ok = new Set(publicSalons(s).map((x) => x.id)); return s.products.filter((p) => p.status === 'published' && ok.has(p.salonId)); };
