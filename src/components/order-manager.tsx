'use client';
import AdminCollapse from './admin-collapse';
import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { compareLinks, type Atalho } from '@/lib/atalhos';
interface Props { categories: string[]; links: Atalho[]; available: boolean; save: (body: unknown) => Promise<void>; reload: () => Promise<void> }
export default function OrderManager({ categories, links, available, save, reload }: Props) {
  const [kind, setKind] = useState<'categories'|'links'>('categories');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const options = [...categories, ...(links.some(l=>l.categoria === 'Propaganda') ? ['Propaganda'] : [])];
  const current = options.includes(category) ? category : options[0] || '';
  const entries = kind === 'categories' ? categories.map(name=>({id:name,title:name,detail:''})) : links.filter(link=>link.categoria === current).sort(compareLinks).map(link=>({id:String(link.id),title:link.titulo,detail:link.grupo || ''}));
  async function move(from: number, to: number) {
    if (from === to || to < 0 || to >= entries.length) return;
    setBusy(true); setMessage('');
    const reordered = [...entries]; const [entry] = reordered.splice(from,1); reordered.splice(to,0,entry);
    try { await save({ kind, category: current, ids: reordered.map(row=>row.id) }); await reload(); setMessage('Ordem salva. O portal já usa as novas posições.'); }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a ordem.'); }
    finally { setBusy(false); }
  }
  return <AdminCollapse title="Ordem no portal" className="order-manager"><div className="admin-title"><div><p>Suba, desça ou digite uma posição. A posição 1 aparece primeiro.</p></div><button className="admin-secondary" disabled={busy} onClick={()=>{setBusy(true);void reload().then(()=>setMessage('Lista atualizada.')).catch(error=>setMessage(error.message)).finally(()=>setBusy(false));}}>Atualizar</button></div>
    {!available && <p className="admin-message">Execute o SQL de ordenação e telefones no Supabase para ativar estas opções.</p>}
    <div className="admin-tabs"><button aria-pressed={kind === 'categories'} disabled={busy} onClick={()=>{setKind('categories');setSearch('');setMessage('');}}>Categorias</button><button aria-pressed={kind === 'links'} disabled={busy} onClick={()=>{setKind('links');setSearch('');setMessage('');}}>Links de uma categoria</button></div>
    {kind === 'links' && <div className="admin-form"><label htmlFor="order-category">Categoria para ordenar</label><select id="order-category" value={current} disabled={busy} onChange={e=>{setCategory(e.target.value);setSearch('');}}>{options.map(name=><option key={name} value={name}>{name === 'Propaganda' ? 'Anúncios parceiros' : name}</option>)}</select></div>}
    <div className="category-create"><label htmlFor="order-search">Localizar na lista</label><input id="order-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} /></div>
    {message && <p role="status" className="admin-message">{message}</p>}
    <div className="admin-list order-list">{entries.map((entry,index)=>({entry,index})).filter(({entry})=>(entry.title+' '+entry.detail).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))).map(({entry,index})=><article key={entry.id} className="admin-entry order-entry"><div><strong>{entry.title}</strong>{entry.detail&&<span>{entry.detail}</span>}</div><div className="position-controls"><label htmlFor={'position-'+encodeURIComponent(entry.id)} className="sr-only">Posição de {entry.title}</label><input key={entry.id+'-'+index} id={'position-'+encodeURIComponent(entry.id)} aria-label={'Posição de '+entry.title} type="number" min={1} max={entries.length} defaultValue={index+1} disabled={busy||!available} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}} onBlur={e=>{const value=Number(e.currentTarget.value);e.currentTarget.value=String(index+1);if(Number.isInteger(value)&&value>=1&&value<=entries.length)void move(index,value-1);}} /><button type="button" aria-label={'Subir '+entry.title} disabled={busy||!available||index === 0} onClick={()=>void move(index,index-1)}><ArrowUp size={17} /></button><button type="button" aria-label={'Descer '+entry.title} disabled={busy||!available||index === entries.length-1} onClick={()=>void move(index,index+1)}><ArrowDown size={17} /></button></div></article>)}</div>
    {!entries.length && <p>Nenhum cadastro nesta categoria.</p>}
  </AdminCollapse>;
}
