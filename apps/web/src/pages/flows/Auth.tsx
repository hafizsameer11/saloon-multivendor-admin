import { ArrowRight, Scissors, User } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABELS, CITIES, PHOTOS, u, type SalonCategory } from '@shared/index';
import { apiMode, useStore, useT } from '@/lib/store';
import { DEMO_PASSWORD } from '@shared/api/sync';
import { ApiError, errorText } from '@shared/api/client';
import { Button, Checkbox, cn, Field, Img, Input, Select, toast } from '@/components/ui';

const Split = ({ img, children, quote }: { img: string; children: ReactNode; quote: string }) => (
  <div className="wrap grid min-h-[calc(100vh-72px)] gap-10 py-10 lg:grid-cols-2 lg:py-14">
    <div className="relative hidden overflow-hidden rounded-[32px] lg:block on-dark">
      <Img src={u(img, 1400)} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-x-10 bottom-10"><p className="font-serif text-4xl italic leading-tight">“{quote}”</p></div>
    </div>
    <div className="flex items-center justify-center"><div className="w-full max-w-md">{children}</div></div>
  </div>
);

export function Login() {
  const t = useT();
  const login = useStore((s) => s.login);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const apiLogin = useStore((s) => s.apiLogin);
  const go = async (e: string, password = pw) => {
    let u = null;
    if (apiMode) {
      setBusy(true);
      try { u = await apiLogin!(e, password); } catch (x) { setErr(errorText(x)); return; } finally { setBusy(false); }
    } else u = login(e);
    if (!u) { setErr(t('Email o password non corretti (prova un account demo qui sotto).', 'Wrong email or password (try a demo account below).')); return; }
    toast(t(`Bentornato/a, ${u.name.split(' ')[0]}`, `Welcome back, ${u.name.split(' ')[0]}`), 'ok');
    const next = params.get('next');
    nav(next ?? (u.role === 'admin' ? '/admin' : u.role === 'seller' ? '/seller' : '/account'));
  };
  const demos = [['giulia@demo.it', t('Cliente', 'Customer')], ['marco@barberiaelite.it', t('Salone approvato', 'Approved salon')], ['sofia@lunanails.it', t('Salone in revisione', 'Salon under review')], ['admin@mybeauty.it', 'Admin']];
  return (
    <Split img={PHOTOS.hairStyling[3]} quote={t('Il mio salone preferito, a un tocco di distanza.', 'My favourite salon, one tap away.')}>
      <div className="eyebrow">{t('Accedi', 'Sign in')}</div>
      <h1 className="mt-3 text-6xl">{t('Bentornato.', 'Welcome back.')}</h1>
      <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); go(email); }}>
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} placeholder="nome@email.it" /></Field>
        <Field label="Password" error={err}><Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" /></Field>
        <div className="flex justify-end"><Link to="/password-dimenticata" className="text-[12.5px] text-gold hover:underline">{t('Password dimenticata?', 'Forgot password?')}</Link></div>
        <Button full size="lg" type="submit" disabled={busy}>{busy ? t('Accesso…', 'Signing in…') : t('Accedi', 'Sign in')} <ArrowRight size={15} /></Button>
      </form>
      
      <div className="mt-8 rounded-2xl border border-gold/25 bg-gold/5 p-4">
        <div className="eyebrow mb-3 text-[10px]">{apiMode ? t(`Account demo · password ${DEMO_PASSWORD}`, `Demo accounts · password ${DEMO_PASSWORD}`) : t('Account demo · qualsiasi password', 'Demo accounts · any password')}</div>
        <div className="grid gap-2">{demos.map(([e, l]) => <button key={e} disabled={busy} onClick={() => go(e, DEMO_PASSWORD)} className="flex items-center justify-between rounded-xl border border-smoke px-3 py-2 text-left text-[13px] hover:border-gold/50"><span>{l}</span><span className="text-[11.5px] text-mute">{e}</span></button>)}</div>
      </div>
      <p className="mt-8 text-center text-sm text-mute">{t('Non hai un account?', 'No account?')} <Link to="/registrati" className="text-gold hover:underline">{t('Registrati', 'Sign up')}</Link></p>
    </Split>
  );
}

export function Register() {
  const t = useT();
  const [params] = useSearchParams();
  const [type, setType] = useState<'customer' | 'pro'>(params.get('tipo') === 'pro' ? 'pro' : 'customer');
  const s = useStore();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '', salonName: '', category: 'parrucchiere' as SalonCategory, city: 'Catanzaro' });
  const [terms, setTerms] = useState(false);
  const [mkt, setMkt] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const up = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setErr({ ...err, [k]: '' }); };
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().split(' ').length < 2) er.name = t('Inserisci nome e cognome', 'Enter first and last name');
    if (s.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) er.email = t('Email già registrata', 'Email already registered');
    if (f.pw.length < 8) er.pw = t('Almeno 8 caratteri', 'At least 8 characters');
    if (type === 'pro' && f.salonName.trim().length < 3) er.salonName = t('Nome salone obbligatorio', 'Salon name required');
    if (!terms) er.terms = t('Devi accettare i termini', 'You must accept the terms');
    setErr(er);
    if (Object.keys(er).length) return;
    if (apiMode) {
      setBusy(true);
      try {
        await s.apiRegister!({ role: type === 'pro' ? 'seller' : 'customer', name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.pw, city: f.city, ...(type === 'pro' ? { salonName: f.salonName.trim(), salonCategory: f.category } : {}) });
        toast(type === 'pro' ? t('Account creato. Completa ora la richiesta.', 'Account created. Now complete your application.') : t('Account creato!', 'Account created!'), 'ok');
        nav(type === 'pro' ? '/seller/richiesta' : params.get('next') ?? '/account');
      } catch (x) {
        if (x instanceof ApiError && x.code === 'email_taken') setErr({ email: t('Email già registrata', 'Email already registered') });
        else if (x instanceof ApiError && x.fields) setErr(Object.fromEntries(Object.entries(x.fields).map(([k, v]) => [k === 'password' ? 'pw' : k, v[0]])));
        else toast(errorText(x), 'red');
      } finally { setBusy(false); }
      return;
    }
    if (type === 'customer') { s.registerCustomer(f); toast(t('Account creato! +50 punti di benvenuto', 'Account created! +50 welcome points'), 'ok'); nav('/account'); }
    else { s.registerSeller(f); toast(t('Account creato. Completa ora la richiesta.', 'Account created. Now complete your application.'), 'ok'); nav('/seller/richiesta'); }
  };
  return (
    <Split img={type === 'pro' ? PHOTOS.salonInterior[3] : PHOTOS.face[1]} quote={type === 'pro' ? t('In tre mesi abbiamo raddoppiato le prenotazioni online.', 'We doubled online bookings in three months.') : t('Prenoto in un minuto, senza telefonate.', 'I book in a minute, without phone calls.')}>
      <div className="eyebrow">{t('Crea account', 'Create account')}</div>
      <h1 className="mt-3 text-6xl">{type === 'pro' ? t('Apri il tuo salone.', 'Open your salon.') : t('Benvenuta.', 'Welcome.')}</h1>
      <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-smoke p-1.5">
        {([['customer', <User key="u" size={16} />, t('Sono un cliente', 'I’m a client')], ['pro', <Scissors key="s" size={16} />, t('Sono un salone', 'I’m a salon')]] as const).map(([k, i, l]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={cn('flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition', type === k ? 'bg-ivory text-ink' : 'text-mute hover:text-ivory')}>{i}{l}</button>
        ))}
      </div>
      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label={type === 'pro' ? t('Nome e cognome del titolare', 'Owner full name') : t('Nome e cognome', 'Full name')} error={err.name}><Input value={f.name} onChange={(e) => up('name', e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={err.email}><Input type="email" required value={f.email} onChange={(e) => up('email', e.target.value)} /></Field>
          <Field label={t('Telefono', 'Phone')}><Input value={f.phone} onChange={(e) => up('phone', e.target.value)} placeholder="+39" /></Field>
        </div>
        <Field label="Password" error={err.pw} hint={t('Minimo 8 caratteri', 'Minimum 8 characters')}><Input type="password" value={f.pw} onChange={(e) => up('pw', e.target.value)} /></Field>
        {type === 'pro' && (
          <div className="space-y-4 rounded-2xl border border-gold/25 bg-gold/5 p-4">
            <Field label={t('Nome del salone', 'Salon name')} error={err.salonName}><Input value={f.salonName} onChange={(e) => up('salonName', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Categoria', 'Category')}><Select value={f.category} onChange={(e) => up('category', e.target.value)}>{(Object.keys(CATEGORY_LABELS) as SalonCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c][s.lang]}</option>)}</Select></Field>
              <Field label={t('Città', 'City')}><Select value={f.city} onChange={(e) => up('city', e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            </div>
            <p className="text-[12px] text-mute">{t('Dopo la registrazione compilerai la richiesta con documenti e IBAN. Potrai preparare servizi e prodotti, ma saranno visibili solo dopo l’approvazione.', 'After sign-up you’ll complete the application with documents and IBAN. You can prepare services and products, but they go live only after approval.')}</p>
          </div>
        )}
        <div className="space-y-3 pt-1">
          <Checkbox checked={terms} onChange={(v) => { setTerms(v); setErr({ ...err, terms: '' }); }}>{t('Accetto i', 'I accept the')} <Link to="/legale/termini" className="text-gold">{t('Termini', 'Terms')}</Link> {t('e la', 'and the')} <Link to="/legale/privacy" className="text-gold">Privacy Policy</Link></Checkbox>
          {err.terms && <p className="text-[11.5px] text-err">{err.terms}</p>}
          <Checkbox checked={mkt} onChange={setMkt}>{t('Voglio ricevere offerte e novità (facoltativo)', 'Send me offers and news (optional)')}</Checkbox>
        </div>
        <Button full size="lg" type="submit" disabled={busy}>{type === 'pro' ? t('Crea account e continua', 'Create account & continue') : t('Crea account', 'Create account')} <ArrowRight size={15} /></Button>
      </form>
      <p className="mt-8 text-center text-sm text-mute">{t('Hai già un account?', 'Already have an account?')} <Link to="/accedi" className="text-gold hover:underline">{t('Accedi', 'Sign in')}</Link></p>
    </Split>
  );
}

export function ForgotPassword() {
  const t = useT();
  const apiForgot = useStore((s) => s.apiForgot);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  return (
    <Split img={PHOTOS.spa[5]} quote={t('Respira. Ci pensiamo noi.', 'Breathe. We’ve got this.')}>
      <div className="eyebrow">{t('Recupero password', 'Password reset')}</div>
      {sent ? (
        <>
          <h1 className="mt-3 text-6xl">{t('Controlla la posta.', 'Check your inbox.')}</h1>
          <p className="mt-4 text-mute">{t('Se esiste un account per', 'If an account exists for')} <b className="text-ivory">{email}</b>, {t('riceverai un link valido 60 minuti.', 'you’ll receive a link valid for 60 minutes.')}</p>
          <Button to="/accedi" variant="line" className="mt-8">{t('Torna all’accesso', 'Back to sign in')}</Button>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-6xl">{t('Nessun problema.', 'No problem.')}</h1>
          <p className="mt-3 text-mute">{t('Inserisci la tua email e ti invieremo un link per reimpostare la password.', 'Enter your email and we’ll send you a reset link.')}</p>
          <form className="mt-8 space-y-4" onSubmit={async (e) => { e.preventDefault(); if (apiMode) { try { await apiForgot!(email); } catch (x) { toast(errorText(x), 'red'); return; } } setSent(true); }}>
            <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button full size="lg" type="submit">{t('Invia link', 'Send link')}</Button>
          </form>
        </>
      )}
    </Split>
  );
}

/** Opened from the email link: #/reimposta-password?token=… */
export function ResetPassword() {
  const t = useT();
  const [params] = useSearchParams();
  const apiReset = useStore((s) => s.apiReset);
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const token = params.get('token') ?? '';
  return (
    <Split img={PHOTOS.spa[5]} quote={t('Respira. Ci pensiamo noi.', 'Breathe. We’ve got this.')}>
      <div className="eyebrow">{t('Nuova password', 'New password')}</div>
      <h1 className="mt-3 text-6xl">{t('Scegli una password.', 'Choose a password.')}</h1>
      {!token && <p className="mt-4 text-err">{t('Link non valido: richiedine uno nuovo.', 'Invalid link: request a new one.')}</p>}
      <form className="mt-8 space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setErr(t('Almeno 8 caratteri', 'At least 8 characters'));
        if (pw !== pw2) return setErr(t('Le password non coincidono', 'Passwords do not match'));
        try { await apiReset!(token, pw); toast(t('Password aggiornata: accedi', 'Password updated: sign in'), 'ok'); nav('/accedi'); } catch (x) { setErr(errorText(x)); }
      }}>
        <Field label="Password" hint={t('Minimo 8 caratteri', 'Minimum 8 characters')}><Input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }} /></Field>
        <Field label={t('Ripeti password', 'Repeat password')} error={err}><Input type="password" value={pw2} onChange={(e) => { setPw2(e.target.value); setErr(''); }} /></Field>
        <Button full size="lg" type="submit" disabled={!token}>{t('Salva password', 'Save password')}</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link to="/password-dimenticata" className="text-gold hover:underline">{t('Richiedi un nuovo link', 'Request a new link')}</Link></p>
    </Split>
  );
}
