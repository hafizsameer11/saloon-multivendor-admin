/**
 * Seller wallet (API mode): balances, Stripe Express onboarding, withdraw button, ledger and withdrawal history.
 * Commission is cut when withdrawing: net = gross − commission (rate frozen at each sale).
 */
import { ArrowDownToLine, CheckCircle2, Clock, ExternalLink, Info, ShieldAlert, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eur, fmtDateShort } from '@shared/index';
import { errorText } from '@shared/api/client';
import type { LedgerLine, Withdrawal } from '@shared/api/remote';
import { useStore, useT } from '@/lib/store';
import { Badge, Button, Modal, Stat, Table, Tabs, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';

const W_TONE: Record<Withdrawal['status'], 'gold' | 'ok' | 'red' | 'mute' | 'warn'> = { requested: 'warn', approved: 'gold', paid: 'ok', rejected: 'red', failed: 'red' };
export const W_LABEL: Record<Withdrawal['status'], [string, string]> = { requested: ['In attesa', 'Requested'], approved: ['Approvato', 'Approved'], paid: ['Inviato', 'Sent'], rejected: ['Rifiutato', 'Rejected'], failed: ['Fallito', 'Failed'] };
const L_LABEL: Record<LedgerLine['type'], [string, string]> = { sale: ['Incasso online', 'Online sale'], cash_commission: ['Commissione su contanti', 'Commission on cash'], refund: ['Rimborso', 'Refund'], adjustment: ['Rettifica', 'Adjustment'] };

export default function Wallet() {
  const t = useT();
  const s = useStore();
  const w = s.wallet;
  const [tab, setTab] = useState<'ledger' | 'withdrawals'>('ledger');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { s.refreshWallet?.().catch(() => undefined); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!w) return <div><PageHead title={t('Portafoglio', 'Wallet')} /><p className="text-mute">{t('Caricamento…', 'Loading…')}</p></div>;

  const onboarding = async () => {
    setBusy(true);
    try {
      const r = await s.apiStripeOnboarding!(window.location.href);
      window.location.assign(r.url);
    } catch (e) { toast(errorText(e), 'red'); setBusy(false); }
  };
  const withdraw = async () => {
    setBusy(true);
    try {
      const r = await s.apiWithdraw!();
      toast(r.status === 'paid' ? t('Prelievo inviato al tuo conto Stripe', 'Withdrawal sent to your Stripe account') : t('Richiesta inviata: l’admin la approverà a breve', 'Request sent: the admin will approve it shortly'), 'ok');
      setConfirm(false);
    } catch (e) { toast(errorText(e), 'red'); } finally { setBusy(false); }
  };

  const negative = w.available.net < 0;
  return (
    <div>
      <PageHead title={t('Portafoglio', 'Wallet')} sub={t(`Commissione attuale ${Math.round(w.commissionRate * 100)}% · trattenuta al momento del prelievo`, `Current commission ${Math.round(w.commissionRate * 100)}% · deducted when you withdraw`)}
        actions={<Button disabled={!w.canWithdraw || busy} onClick={() => setConfirm(true)}><ArrowDownToLine size={15} />{t('Preleva', 'Withdraw')}</Button>} />

      {!w.stripe.payoutsReady && (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-warn/40 bg-warn/10 p-5 md:flex-row md:items-center">
          <ShieldAlert className="shrink-0 text-warn" />
          <div className="flex-1 text-sm"><b>{t('Collega il tuo conto per ricevere i prelievi', 'Connect your account to receive withdrawals')}</b><p className="mt-1 text-mute">{t('La verifica (documento e IBAN) è fatta da Stripe, il nostro partner di pagamento. Richiede circa 5 minuti.', 'Verification (ID and IBAN) is done by Stripe, our payment partner. It takes about 5 minutes.')}{w.stripe.mode === 'mock' && ` ${t('(Modalità di prova: verrà simulata.)', '(Test mode: it will be simulated.)')}`}</p></div>
          <Button disabled={busy} onClick={onboarding}><ExternalLink size={15} />{w.stripe.accountId ? t('Continua la verifica', 'Continue verification') : t('Collega con Stripe', 'Connect with Stripe')}</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label={t('Disponibile (netto)', 'Available (net)')} value={eur(w.available.net)} delta={`${eur(w.available.gross)} ${t('lordo', 'gross')} − ${eur(w.available.commission)} ${t('commissione', 'commission')}`} tone={negative ? 'red' : 'gold'} icon={<WalletIcon size={16} />} />
        <Stat label={t('In maturazione', 'Pending')} value={eur(w.pending.net)} delta={w.nextReleaseAt ? `${t('Prossimo sblocco', 'Next release')} ${fmtDateShort(w.nextReleaseAt.slice(0, 10), s.lang)}` : t('Dopo il servizio o il periodo di reso', 'After the service or the return window')} tone="mute" icon={<Clock size={16} />} />
        <Stat label={t('Già prelevato', 'Withdrawn')} value={eur(w.withdrawn.net)} delta={w.openWithdrawal ? `${t('In corso', 'In progress')}: ${eur(w.openWithdrawal.net)}` : undefined} tone="ok" icon={<CheckCircle2 size={16} />} />
      </div>

      {negative && <p className="mt-4 flex items-start gap-2 rounded-2xl border border-crimson/40 bg-crimson/10 p-4 text-[13px]"><Info size={15} className="mt-0.5 shrink-0" />{t('Il saldo è negativo: le commissioni sugli appuntamenti pagati in salone superano gli incassi online. Verrà compensato con i prossimi incassi online.', 'Your balance is negative: commission on appointments paid at the salon exceeds online income. It will be offset by future online income.')}</p>}
      {!w.canWithdraw && !negative && w.stripe.payoutsReady && !w.openWithdrawal && <p className="mt-4 text-[12.5px] text-mute">{t(`Prelievo minimo ${eur(w.minWithdrawal)}.`, `Minimum withdrawal ${eur(w.minWithdrawal)}.`)} {t('I fondi non prelevati vengono inviati automaticamente dopo 75 giorni.', 'Funds not withdrawn are sent automatically after 75 days.')}</p>}

      <div className="mt-8 mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'ledger', label: t('Movimenti', 'Activity'), count: w.ledger.length }, { id: 'withdrawals', label: t('Prelievi', 'Withdrawals'), count: w.withdrawals.length }]} /></div>
      {tab === 'ledger' ? (
        <Table rows={w.ledger} empty={t('Nessun movimento', 'No activity')} cols={[
          { key: 'd', head: t('Data', 'Date'), cell: (l) => fmtDateShort(l.createdAt.slice(0, 10), s.lang) },
          { key: 't', head: t('Descrizione', 'Description'), cell: (l) => <div><div className="font-semibold">{L_LABEL[l.type][s.lang === 'it' ? 0 : 1]}</div><div className="text-[11.5px] text-mute">{l.description}</div></div> },
          { key: 'g', head: t('Lordo', 'Gross'), cell: (l) => eur(l.amount) },
          { key: 'c', head: t('Commissione', 'Commission'), cell: (l) => `−${eur(l.commission)} (${Math.round(l.commissionRate * 100)}%)` },
          { key: 'n', head: t('Netto', 'Net'), cell: (l) => <b className={l.net < 0 ? 'text-err' : ''}>{eur(l.net)}</b> },
          { key: 's', head: t('Stato', 'Status'), cell: (l) => <Badge tone={l.status === 'available' ? 'gold' : l.status === 'withdrawn' ? 'ok' : 'mute'}>{l.withdrawalId && l.status === 'available' ? t('In prelievo', 'Withdrawing') : l.status === 'pending' ? t('In maturazione', 'Pending') : l.status === 'available' ? t('Disponibile', 'Available') : t('Prelevato', 'Withdrawn')}</Badge> },
        ]} />
      ) : (
        <Table rows={w.withdrawals} empty={t('Nessun prelievo', 'No withdrawals')} cols={[
          { key: 'd', head: t('Richiesto', 'Requested'), cell: (x) => fmtDateShort(x.requestedAt.slice(0, 10), s.lang) },
          { key: 'g', head: t('Lordo', 'Gross'), cell: (x) => eur(x.gross) },
          { key: 'c', head: t('Commissione', 'Commission'), cell: (x) => `−${eur(x.commission)}` },
          { key: 'n', head: t('Netto inviato', 'Net sent'), cell: (x) => <b>{eur(x.net)}</b> },
          { key: 's', head: t('Stato', 'Status'), cell: (x) => <div><Badge tone={W_TONE[x.status]}>{W_LABEL[x.status][s.lang === 'it' ? 0 : 1]}{x.auto ? ' · auto' : ''}</Badge>{x.failureReason && <div className="mt-1 text-[11px] text-mute">{x.failureReason}</div>}</div> },
        ]} />
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t('Conferma prelievo', 'Confirm withdrawal')} footer={<><Button variant="ghost" onClick={() => setConfirm(false)}>{t('Annulla', 'Cancel')}</Button><Button disabled={busy} onClick={withdraw}>{busy ? '…' : t(`Preleva ${eur(w.available.net)}`, `Withdraw ${eur(w.available.net)}`)}</Button></>}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-mute">{t('Incassi disponibili (lordo)', 'Available income (gross)')}</span><span>{eur(w.available.gross)}</span></div>
          <div className="flex justify-between"><span className="text-mute">{t('Commissione MyBeauty+', 'MyBeauty+ commission')}</span><span>−{eur(w.available.commission)}</span></div>
          <div className="hairline my-3" />
          <div className="flex justify-between font-semibold"><span>{t('Riceverai', 'You receive')}</span><span className="font-serif text-2xl">{eur(w.available.net)}</span></div>
          <p className="pt-2 text-[12px] text-mute">{t('Il denaro va sul tuo conto Stripe e da lì sul tuo IBAN, di solito in 2–7 giorni lavorativi.', 'Money goes to your Stripe account and then to your IBAN, usually in 2–7 business days.')}</p>
        </div>
      </Modal>
    </div>
  );
}
