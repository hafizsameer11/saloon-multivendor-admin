import { motion } from 'framer-motion';
import { Check, Store, Truck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { eur } from '@shared/index';
import { useStore, useT } from '@/lib/store';
import { Button, Img } from '@/components/ui';
import { NotFound } from '../public/StaticPages';

export default function OrderSuccess() {
  const { id } = useParams();
  const t = useT();
  const s = useStore();
  const o = s.orders.find((x) => x.id === id);
  if (!o) return <NotFound />;
  const subs = s.subOrders.filter((x) => x.orderId === o.id);
  return (
    <div className="day min-h-screen pb-24">
      <div className="wrap max-w-3xl pt-16 text-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-crimson text-white"><Check size={36} strokeWidth={2.5} /></motion.div>
        <div className="mt-6 text-[11px] uppercase tracking-eyebrow text-crimson">{t('Ordine', 'Order')} {o.code}</div>
        <h1 className="mt-3 text-6xl md:text-7xl">{t('Grazie,', 'Thank you,')} <em className="text-crimson">{o.customerName.split(' ')[0]}.</em></h1>
        <p className="mt-3 text-mute-2">{t('Il tuo ordine è stato diviso in', 'Your order was split into')} {subs.length} {subs.length === 1 ? t('spedizione', 'shipment') : t('spedizioni', 'shipments')}, {t('una per ogni salone.', 'one per salon.')}</p>
      </div>
      <div className="wrap mt-10 max-w-3xl space-y-4">
        {subs.map((so) => {
          const salon = s.salons.find((x) => x.id === so.salonId)!;
          return (
            <div key={so.id} className="rounded-[28px] border border-ivory-3 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Img src={salon.cover} className="h-10 w-10 rounded-full" /><div><div className="font-serif text-2xl">{salon.name}</div><div className="text-[12px] text-mute-2">{so.code}</div></div></div>
                <span className="flex items-center gap-2 rounded-full bg-ivory px-3 py-1.5 text-[12px]">{so.shippingMethod === 'pickup' ? <><Store size={14} />{t('Ritiro in salone', 'Salon pickup')}</> : <><Truck size={14} />{t('Spedizione', 'Shipping')}</>}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">{so.items.map((it) => <li key={it.productId} className="flex justify-between"><span>{it.qty} × {it.name}</span><span>{eur(it.price * it.qty)}</span></li>)}</ul>
            </div>
          );
        })}
        <div className="flex justify-between rounded-[28px] bg-ink px-6 py-5 text-ivory"><span>{t('Totale pagato', 'Total paid')} · {o.paymentMethod}</span><span className="font-serif text-3xl">{eur(o.total)}</span></div>
        <div className="flex flex-wrap justify-center gap-3 pt-6"><Button to={`/account/ordini/${o.id}`} variant="dark">{t('Segui l’ordine', 'Track order')}</Button><Button to="/shop" variant="inkline">{t('Continua lo shopping', 'Keep shopping')}</Button></div>
      </div>
    </div>
  );
}
