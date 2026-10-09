import { createClient } from '@supabase/supabase-js';
import { connection } from 'next/server';
import Portal from '@/components/portal';
import backup from '@/data/links-backup.json';
import type { Atalho } from '@/lib/atalhos';

export default async function Home() {
  await connection();
  let links: Atalho[] = backup;
  let usingBackup = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('atalhos_links')
        .select('id,titulo,url,categoria,imagem_url')
        .order('titulo', { ascending: true })
        .abortSignal(AbortSignal.timeout(6000));
      if (!error && data) {
        links = data.map((link) => ({ ...link, categoria: link.categoria?.trim() || 'Outros atalhos' }));
        usingBackup = false;
      } else {
        console.error('Não foi possível atualizar os atalhos:', error?.code || 'resposta indisponível');
      }
    } catch {
      console.error('Serviço de atalhos temporariamente indisponível.');
    }
  }
  return <Portal links={links} usingBackup={usingBackup} />;
}
