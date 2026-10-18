/**
 * Pays a PaymentIntent created by the API (booking deposit / full booking / shop order).
 *  - mock mode (no Stripe keys on the server): a clearly-labelled test button, no card data at all
 *  - stripe mode: Stripe's own PaymentElement — card data goes straight to Stripe, never to our server (PCI)
 */
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { eur } from '@shared/index';
import { errorText } from '@shared/api/client';
import type { PaymentStart } from '@shared/api/remote';
import { useStore, useT } from '@/lib/store';
import { Button } from './ui';

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (key: string) => (stripePromise ??= loadStripe(key));

export function PaymentPanel({ payment, onPaid, onCancel, title }: { payment: PaymentStart; onPaid: () => void; onCancel?: () => void; title?: string }) {
  const t = useT();
  const mode = useStore((s) => s.paymentMode);
  const key = useStore((s) => s.publishableKey);
  const light = useStore((s) => s.theme) === 'light';
  const lang = useStore((s) => s.lang);
  const appearance = light
    ? { theme: 'stripe' as const, variables: { colorPrimary: '#967332', colorBackground: '#FFFFFF', colorText: '#1B1716', borderRadius: '12px', fontFamily: 'Manrope, system-ui, sans-serif' } }
    : { theme: 'night' as const, variables: { colorPrimary: '#CFAE6E', colorBackground: '#1A1819', borderRadius: '12px', fontFamily: 'Manrope, system-ui, sans-serif' } };
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gold/10 text-gold"><CreditCard size={18} /></span>
        <div><div className="eyebrow text-[10px]">{title ?? t('Pagamento sicuro', 'Secure payment')}</div><div className="font-serif text-3xl">{eur(payment.amount)}</div></div>
      </div>
      <div className="hairline my-5" />
      {mode === 'stripe' && key ? (
        <Elements stripe={getStripe(key)} key={light ? 'l' : 'd'} options={{ clientSecret: payment.clientSecret, appearance, locale: lang }}>
          <StripeForm payment={payment} onPaid={onPaid} />
        </Elements>
      ) : (
        <MockForm payment={payment} onPaid={onPaid} />
      )}
      {onCancel && <button onClick={onCancel} className="mt-4 w-full text-center text-[12.5px] text-mute hover:text-ivory">{t('Annulla', 'Cancel')}</button>}
      <p className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-mute"><ShieldCheck size={13} />{t('Pagamenti gestiti da Stripe. Non salviamo i dati della carta.', 'Payments handled by Stripe. We never store card data.')}</p>
    </div>
  );
}

function MockForm({ payment, onPaid }: { payment: PaymentStart; onPaid: () => void }) {
  const t = useT();
  const confirm = useStore((s) => s.apiConfirmPayment);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4 text-[13px]">
        <b>{t('Modalità di prova', 'Test mode')}</b> — {t('il server non ha ancora le chiavi Stripe: nessuna carta, nessun addebito reale.', 'the server has no Stripe keys yet: no card, no real charge.')}
      </div>
      {err && <p className="mt-3 text-[12.5px] text-err">{err}</p>}
      <Button full size="lg" className="mt-4" disabled={busy} onClick={async () => {
        setBusy(true); setErr('');
        try { await confirm!(payment.paymentId); onPaid(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
      }}><Lock size={15} /> {busy ? t('Pagamento…', 'Paying…') : t(`Paga ${eur(payment.amount)} (test)`, `Pay ${eur(payment.amount)} (test)`)}</Button>
    </div>
  );
}

function StripeForm({ payment, onPaid }: { payment: PaymentStart; onPaid: () => void }) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const confirm = useStore((s) => s.apiConfirmPayment);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const returnUrl = useMemo(() => window.location.href, []);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setBusy(true); setErr('');
      const r = await stripe.confirmPayment({ elements, redirect: 'if_required', confirmParams: { return_url: returnUrl } });
      if (r.error) { setErr(r.error.message ?? t('Pagamento non riuscito', 'Payment failed')); setBusy(false); return; }
      try { await confirm!(payment.paymentId); onPaid(); } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
    }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {err && <p className="mt-3 text-[12.5px] text-err">{err}</p>}
      <Button full size="lg" type="submit" className="mt-5" disabled={!stripe || busy}><Lock size={15} /> {busy ? t('Pagamento…', 'Paying…') : `${t('Paga', 'Pay')} ${eur(payment.amount)}`}</Button>
    </form>
  );
}
