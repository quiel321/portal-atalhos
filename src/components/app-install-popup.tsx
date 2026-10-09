'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, ShieldCheck, X } from 'lucide-react';
interface InstallPrompt extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
export default function AppInstallPopup() {
  const [visible, setVisible] = useState(false);
  const promptRef = useRef<InstallPrompt | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    if (window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone) return;
    const receivePrompt = (event: Event) => { event.preventDefault(); promptRef.current = event as InstallPrompt; };
    const installed = () => { setVisible(false); promptRef.current = null; };
    window.addEventListener('beforeinstallprompt', receivePrompt);
    window.addEventListener('appinstalled', installed);
    let seen = false;
    try { seen = sessionStorage.getItem('atalhos-install-seen') === '1'; } catch {}
    const show = window.setTimeout(() => {
      if (seen) return;
      setVisible(true);
      try { sessionStorage.setItem('atalhos-install-seen', '1'); } catch {}
    }, 350);
    const hide = window.setTimeout(() => setVisible(false), 5350);
    return () => { clearTimeout(show); clearTimeout(hide); window.removeEventListener('beforeinstallprompt', receivePrompt); window.removeEventListener('appinstalled', installed); };
  }, []);
  async function install() {
    setVisible(false);
    const prompt = promptRef.current;
    if (!prompt) { dialogRef.current?.showModal(); return; }
    try { await prompt.prompt(); await prompt.userChoice; } catch { dialogRef.current?.showModal(); }
    finally { promptRef.current = null; }
  }
  return <>
    {visible && <aside className="install-popup" aria-label="Instalar app Atalhos Grátis"><ShieldCheck size={24} aria-hidden="true" /><div><strong>Atalhos Grátis no seu celular</strong><span>Acesse direto pela tela inicial.</span></div><button type="button" className="install-action" onClick={install}><Download size={14} aria-hidden="true" /> Instalar</button><button type="button" className="install-close" aria-label="Fechar aviso de instalação" onClick={()=>setVisible(false)}><X size={15} /></button></aside>}
    <dialog ref={dialogRef} className="install-dialog"><h2>Instalar Atalhos Grátis</h2><p><strong>No Android ou computador:</strong> abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.</p><p><strong>No iPhone:</strong> abra o site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p><button type="button" className="admin-primary" onClick={()=>dialogRef.current?.close()}>Entendi</button></dialog>
  </>;
}
