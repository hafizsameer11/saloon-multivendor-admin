/** Admin (API mode): withdrawal queue + money/payment settings. */
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eur, fmtDateShort } from '@shared/index';
import { errorText } from '@shared/api/client';
import type { PlatformSettings, Withdrawal } from '@shared/api/remote';
import { useStore, useT } from '@/lib/store';
import { Badge, Button, Field, Input, Modal, Stat, Table, Tabs, Textarea, Toggle, toast } from '@/components/ui';
import { PageHead } from '@/components/layout/DashboardLayout';
import { W_LABEL } from '../seller/Wallet';

const TONE: Record<Withdrawal['status'], 'gold' | 'ok' | 'red' | 'mute' | 'warn'> = { requested: 'warn', approved: 'gold', paid: 'ok', rejected: 'red', failed: 'red' };

export function AdminWithdrawals() {
  const t = useT();
  const s = useStore();
  const [tab, setTab] = useState<'open' | 'paid' | 'closed'>('open');
  const [reject, setReject] = useState<Withdrawal | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const rows = s.withdrawals.filter((w) => (tab === 'open' ? ['requested', 'approved', 'failed'].includes(w.status) : tab === 'paid' ? w.status === 'paid' : w.status === 'rejected'));
  const open = s.withdrawals.filter((w) => w.status === 'requested' || w.status === 'approved');
  const paid30 = s.withdrawals.filter((w) => w.status === 'paid' && w.paidAt && Date.now() - new Date(w.paidAt).getTime() < 30 * 864e5);
  const approve = async (w: Withdrawal) => {
    setBusy(w.id);
    try { await s.apiApproveWithdrawal!(w.id); toast(t('Trasferimento inviato', 'Transfer sent'), 'ok'); } catch (e) { toast(errorText(e), 'red'); } finally { setBusy(null); }
  };
  return (
    <div>
      <PageHead title={t('Prelievi saloni', 'Salon withdrawals')} sub={t('Approvando, il netto (lordo − commissione) viene trasferito con Stripe sul conto del salone.', 'On approval the net (gross − commission) is transferred via Stripe to the salon’s account.')} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label={t('Da approvare', 'To approve')} value={eur(open.reduce((a, w) => a + w.net, 0))} delta={`${open.length} ${open.length === 1 ? t('richiesta', 'request') : t('richieste', 'requests')}`} tone="warn" />
        <Stat label={t('Inviati (30 gg)', 'Sent (30 days)')} value={eur(paid30.reduce((a, w) => a + w.net, 0))} tone="ok" />
        <Stat label={t('Commissioni trattenute (30 gg)', 'Commission kept (30 days)')} value={eur(paid30.reduce((a, w) => a + w.commission, 0))} tone="gold" />
      </div>
      <div className="mb-5"><Tabs value={tab} onChange={setTab} tabs={[{ id: 'open', label: t('Da gestire', 'To handle'), count: s.withdrawals.filter((w) => ['requested', 'approved', 'failed'].includes(w.status)).length }, { id: 'paid', label: t('Inviati', 'Sent') }, { id: 'closed', label: t('Rifiutati', 'Rejected') }]} /></div>
      <Table rows={rows} empty={t('Nessun prelievo', 'No withdrawals')} cols={[
        { key: 'sa', head: t('Salone', 'Salon'), cell: (w) => <div><div className="font-semibold">{w.salon?.name ?? s.salons.find((x) => x.id === w.salonId)?.name}</div><div className="text-[11.5px] text-mute">{w.salon?.stripePayoutsReady ? t('Stripe verificato', 'Stripe verified') : t('Stripe da completare', 'Stripe not completed')}</div></div> },
        { key: 'd', head: t('Richiesto', 'Requested'), cell: (w) => fmtDateShort(w.requestedAt.slice(0, 10), s.lang) },
        { key: 'g', head: t('Lordo', 'Gross'), cell: (w) => eur(w.gross) },
        { key: 'c', head: t('Commissione', 'Commission'), cell: (w) => eur(w.commission) },
        { key: 'n', head: t('Netto', 'Net'), cell: (w) => <b>{eur(w.net)}</b> },
        { key: 's', head: t('Stato', 'Status'), cell: (w) => <div><Badge tone={TONE[w.status]}>{W_LABEL[w.status][s.lang === 'it' ? 0 : 1]}{w.auto ? ' · auto' : ''}</Badge>{w.failureReason && <div className="mt-1 max-w-[220px] text-[11px] text-mute">{w.failureReason}</div>}</div> },
        { key: 'a', head: '', cell: (w) => ['requested', 'approved', 'failed'].includes(w.status) ? (
          <div className="flex gap-2">
            <Button size="sm" disabled={busy === w.id} onClick={(e) => { e.stopPropagation(); void approve(w); }}><Check size={14} />{w.status === 'failed' ? t('Riprova', 'Retry') : t('Approva', 'Approve')}</Button>
            {w.status !== 'failed' && <Button size="sm" variant="line" onClick={(e) => { e.stopPropagation(); setReject(w); setReason(''); }}><X size={14} /></Button>}
          </div>
        ) : null },
      ]} />
      <Modal open={!!reject} onClose={() => setReject(null)} title={t('Rifiuta prelievo', 'Reject withdrawal')} footer={<><Button variant="ghost" onClick={() => setReject(null)}>{t('Annulla', 'Cancel')}</Button><Button disabled={reason.trim().length < 3} onClick={async () => { try { await s.apiRejectWithdrawal!(reject!.id, reason.trim()); toast(t('Prelievo rifiutato: il saldo torna disponibile al salone', 'Rejected: the balance goes back to the salon'), 'ok'); setReject(null); } catch (e) { toast(errorText(e), 'red'); } }}>{t('Rifiuta', 'Reject')}</Button></>}>
        <Field label={t('Motivo (visibile al salone)', 'Reason (shown to the salon)')}><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}

export function AdminMoneySettings() {
  const t = useT();
  const s = useStore();
  const [f, setF] = useState<PlatformSettings | null>(s.settings);
  useEffect(() => setF(s.settings), [s.settings]);
  if (!f) return null;
  const num = (k: keyof PlatformSettings, label: string, hint?: string, scale = 1) => (
    <Field label={label} hint={hint}><Input type="number" value={String(Math.round((f[k] as number) * scale * 100) / 100)} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) / scale })} /></Field>
  );
  return (
    <div className="card p-6">
      <div className="eyebrow mb-4">{t('Pagamenti e prelievi', 'Payments & withdrawals')}</div>
      <div className="grid gap-4 md:grid-cols-3">
        {num('defaultCommissionRate', t('Commissione predefinita nuovi saloni (%)', 'Default commission for new salons (%)'), t('Ogni salone può avere la sua (Saloni)', 'Each salon can have its own (Salons)'), 100)}
        {num('minWithdrawal', t('Prelievo minimo (€)', 'Minimum withdrawal (€)'))}
        {num('autoWithdrawAfterDays', t('Prelievo automatico dopo (giorni)', 'Auto-withdraw after (days)'), t('Max 85: Stripe trattiene fondi al massimo 90 giorni', 'Max 85: Stripe holds funds 90 days at most'))}
        {num('bookingReleaseHours', t('Sblocco incassi dopo il servizio (ore)', 'Release after service (hours)'))}
        {num('returnWindowDays', t('Finestra di reso (giorni)', 'Return window (days)'), t('Minimo legale UE: 14', 'EU legal minimum: 14'))}
        {num('freeCancellationHours', t('Cancellazione gratuita fino a (ore prima)', 'Free cancellation up to (hours before)'))}
      </div>
      <div className="mt-5 space-y-3">
        <Toggle checked={f.withdrawalAutoApprove} onChange={(v) => setF({ ...f, withdrawalAutoApprove: v })} label={t('Approva automaticamente i prelievi', 'Auto-approve withdrawals')} />
        <Toggle checked={f.commissionOnCash} onChange={(v) => setF({ ...f, commissionOnCash: v })} label={t('Commissione anche sui pagamenti in salone (scalata dal portafoglio)', 'Commission on in-salon payments too (taken from the wallet)')} />
      </div>
      <Button className="mt-6" onClick={async () => { try { await s.apiSaveSettings!(f); toast(t('Impostazioni salvate', 'Settings saved'), 'ok'); } catch (e) { toast(errorText(e), 'red'); } }}>{t('Salva', 'Save')}</Button>
    </div>
  );
}
