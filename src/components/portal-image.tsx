'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, ShieldCheck } from 'lucide-react';
import { safeUrl } from '@/lib/atalhos';
import imageBackups from '@/data/image-backups.json';

export default function PortalImage({ src, title, banner = false }: { src: string | null; title: string; banner?: boolean }) {
  const [failures, setFailures] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);
  const original = safeUrl(src);
  const backup = src ? (imageBackups as Record<string, string>)[src] : undefined;
  const image = failures === 0 ? original || backup : failures === 1 ? backup : undefined;
  return (
    <div className={banner ? 'partner-image' : 'shortcut-image'} style={banner && image && ratio ? { aspectRatio: ratio, height: 'auto' } : undefined}>
      {image ? (
        <Image key={image} src={image} alt={title} fill unoptimized sizes={banner ? '(max-width: 900px) 100vw, 280px' : '52px'} className="object-contain" onLoad={event => { if (banner) { const img = event.currentTarget; if (img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight); } }} onError={() => setFailures((count) => count + 1)} />
      ) : banner ? (
        <div className="partner-fallback"><Building2 size={30} aria-hidden="true" /><span>{title.split(' - ')[0]}</span></div>
      ) : <ShieldCheck size={25} aria-hidden="true" />}
    </div>
  );
}
