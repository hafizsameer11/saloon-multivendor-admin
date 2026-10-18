import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiMode, useStore } from '@/lib/store';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@shared/api/sync';
import { errorText } from '@shared/api/client';
import { cn, toast } from '@/components/ui';

/** Dev-only role switcher so the client can demo every panel without real logins. Remove in production. */
export function DemoBar({ dash }: { dash?: boolean }) {
  const [open, setOpen] = useState(false);
  const loginAs = useStore((s) => s.loginAs);
  const logout = useStore((s) => s.logout);
  const resetDemo = useStore((s) => s.resetDemo);
  const userId = useStore((s) => s.userId);
  const nav = useNavigate();
  const it = useStore((s) => s.lang) === 'it';
  const roles = [
    { id: 'u-giulia', label: it ? 'Cliente' : 'Customer', sub: 'Giulia Ferraro', to: '/account' },
    { id: 'u-marco', label: it ? 'Venditore approvato' : 'Approved seller', sub: 'Barberia Elite', to: '/seller' },
    { id: 'u-sofia', label: it ? 'Venditore in revisione' : 'Seller under review', sub: 'Luna Nails Studio', to: '/seller' },
    { id: 'u-admin', label: 'Admin', sub: it ? 'Pannello piattaforma' : 'Platform panel', to: '/admin' },
  ];
  return (
    <div className={cn('fixed left-4 z-[70]', dash ? 'bottom-6 lg:left-[276px]' : 'bottom-24 md:bottom-6')}>
      {open ? (
        <div className="w-72 rounded-2xl border border-gold/30 bg-graphite/95 p-3 shadow-deep backdrop-blur">
          <div className="mb-2 flex items-center justify-between px-1"><span className="eyebrow">{it ? 'Demo · cambia ruolo' : 'Demo · switch role'}</span><button onClick={() => setOpen(false)} aria-label={it ? 'Chiudi' : 'Close'}><X size={15} /></button></div>
          {roles.map((r) => (
            <button key={r.id} onClick={async () => { if (apiMode) { try { await useStore.getState().apiLogin!(DEMO_ACCOUNTS[r.id], DEMO_PASSWORD); } catch (e) { toast(errorText(e), 'red'); return; } } else loginAs(r.id); nav(r.to); setOpen(false); toast(`${it ? 'Ora sei' : 'You are now'}: ${r.label}`); }}
              className={cn('mb-1 flex w-full flex-col rounded-xl border px-3 py-2 text-left transition', userId === r.id ? 'border-gold/60 bg-gold/10' : 'border-transparent hover:border-smoke')}>
              <span className="text-[13px] font-semibold">{r.label}</span><span className="text-[11.5px] text-mute">{r.sub}</span>
            </button>
          ))}
          <div className="mt-2 flex gap-2 border-t border-smoke pt-2">
            <button onClick={() => { logout(); nav('/'); setOpen(false); }} className="flex-1 rounded-xl px-3 py-2 text-[12px] text-mute hover:text-ivory">{it ? 'Ospite' : 'Guest'}</button>
            <button onClick={() => { resetDemo(); nav('/'); setOpen(false); toast(it ? 'Dati demo ripristinati' : 'Demo data restored'); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] text-mute hover:text-ivory"><RotateCcw size={13} />{it ? 'Reset dati' : 'Reset data'}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full border border-gold/40 bg-graphite/90 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[.14em] text-gold shadow-deep backdrop-blur hover:border-gold">
          <FlaskConical size={14} /> Demo
        </button>
      )}
    </div>
  );
}
