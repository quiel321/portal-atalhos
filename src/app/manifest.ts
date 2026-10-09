import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return { id: '/', name: 'Atalhos Grátis', short_name: 'Atalhos Grátis', description: 'Acesso rápido a sistemas, consultas e serviços de Mato Grosso.', lang: 'pt-BR', start_url: '/?source=app', scope: '/', display: 'standalone', background_color: '#0c1424', theme_color: '#0c1424', icons: [{ src: '/app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/app-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
}
