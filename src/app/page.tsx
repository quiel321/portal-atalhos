import { createClient } from '@supabase/supabase-js';
import { connection } from 'next/server';
import Portal from '@/components/portal';
import backup from '@/data/links-backup.json';
import { defaultCategoryOrder, type Atalho } from '@/lib/atalhos';
import phones from '@/data/pm-phones.json';

export default async function Home() {
  await connection();
  let links: Atalho[] = [...backup.map((link,index)=>({...link,posicao:link.url === 'tel:190' ? 0 : index})), ...phones.map((phone,index)=>({...phone,id:phone.origem_key,imagem_url:null,posicao:index+1}))];
  let categoryOrder: string[] = defaultCategoryOrder;
  let usingBackup = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const [list, catalog] = await Promise.all([
        supabase.from('atalhos_links').select('*').abortSignal(AbortSignal.timeout(6000)),
        supabase.from('portal_categories').select('nome,posicao').order('posicao').order('nome').abortSignal(AbortSignal.timeout(6000)),
      ]);
      const { data, error } = list;
      if (!catalog.error && catalog.data) categoryOrder = catalog.data.map(row=>row.nome);
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
  return <Portal links={links} usingBackup={usingBackup} categoryOrder={categoryOrder} />;
}
