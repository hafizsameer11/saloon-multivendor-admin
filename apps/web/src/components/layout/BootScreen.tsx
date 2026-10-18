import { RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui';

/** API mode: first load of the catalog (and the session) before the site renders. */
export function BootScreen() {
  const sync = useStore((s) => s.sync);
  const lang = useStore((s) => s.lang);
  const it = lang === 'it';
  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center gap-6 bg-onyx px-6 text-center">
      <div className="font-serif text-5xl">MyBeauty<span className="text-crimson">+</span></div>
      {sync.error ? (
        <>
          <p className="max-w-md text-mute">{it ? 'Non riusciamo a raggiungere il server.' : 'We can’t reach the server.'} <span className="block pt-2 text-[12px] opacity-70">{sync.error}</span></p>
          <Button onClick={() => useStore.getState().bootstrap?.()}><RefreshCw size={15} /> {it ? 'Riprova' : 'Retry'}</Button>
        </>
      ) : (
        <div className="h-px w-40 overflow-hidden bg-smoke"><div className="h-full w-1/3 animate-[mbload_1.1s_ease-in-out_infinite] bg-gold" /></div>
      )}
      <style>{'@keyframes mbload{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}'}</style>
    </div>
  );
}
