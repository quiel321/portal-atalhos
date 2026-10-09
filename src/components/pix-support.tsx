'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Heart, X } from 'lucide-react';
import pix from '@/data/pix-support.json';

export default function PixSupport() {
  const dialog = useRef<HTMLDialogElement>(null);
  const keyInput = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(''), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(label + ' copiada!');
    } catch {
      keyInput.current?.focus();
      keyInput.current?.select();
      setFeedback('Selecione e copie a chave Pix abaixo.');
    }
  }
  return <>
    <section className="pix-support" aria-labelledby="pix-support-title">
      <div className="pix-support-copy">
        <h2 id="pix-support-title"><Heart size={15} aria-hidden="true" />Apoie o Atalhos Grátis</h2>
        <p><span className="pix-description-long">Seu Pix ajuda a manter o portal no ar, </span>sem anúncios que atrapalham.</p>
        <div className="pix-key-row"><label htmlFor="pix-key">Pix</label><input id="pix-key" ref={keyInput} value={pix.key} readOnly aria-label="Chave Pix CNPJ" /><button type="button" aria-label="Copiar chave Pix" onClick={() => copy(pix.key, 'Chave Pix')}>{feedback === 'Chave Pix copiada!' ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}<span className="pix-copy-label">Copiar chave</span></button></div>
        <span className="pix-feedback" role="status">{feedback}</span>
      </div>
      <button type="button" className="pix-qr-button" onClick={() => dialog.current?.showModal()} aria-label="Ampliar QR Code Pix"><Image src="/pix-apoio.png" alt="QR Code para apoiar o Atalhos Grátis" width={480} height={480} unoptimized /><span>Ampliar QR</span></button>
    </section>
    <dialog ref={dialog} className="pix-dialog" aria-labelledby="pix-dialog-title" onClick={event => { if(event.target === event.currentTarget) dialog.current?.close(); }}>
      <button type="button" className="pix-dialog-close" onClick={() => dialog.current?.close()} aria-label="Fechar QR Code"><X size={20}/></button>
      <h2 id="pix-dialog-title">Apoie o Atalhos Grátis</h2><p>Escolha o valor que quiser no seu banco.</p>
      <Image src="/pix-apoio.png" alt="QR Code Pix ampliado" width={480} height={480} unoptimized />
      <strong>{pix.key}</strong><p className="pix-recipient">{pix.recipient}<br/>{pix.city}</p>
      <button type="button" className="pix-payload-button" onClick={() => copy(pix.payload, 'Código Pix')}>Copiar Pix Copia e Cola</button>
      <span role="status" className="pix-feedback">{feedback}</span>
    </dialog>
  </>;
}
