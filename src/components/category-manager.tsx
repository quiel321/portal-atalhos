'use client';
import { useState, type FormEvent } from 'react';
import type { Atalho } from '@/lib/atalhos';

interface Props {
  categories: string[]; links: Atalho[];
  request: (method: string, body?: unknown, name?: string) => Promise<unknown>;
  move: (link: Atalho, category: string) => Promise<void>;
  reload: () => Promise<void>;
}
export default function CategoryManager({ categories, links, request, move, reload }: Props) {
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [rename, setRename] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const current = categories.includes(selected) ? selected : categories[0] || '';
  const items = links.filter(link => link.categoria === current);
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setMessage('');
    try { await action(); await reload(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); void run(async () => { await request('POST', { nome: name.trim() }); setSelected(name.trim()); setName(''); }, 'Categoria criada. Ela já pode receber links.');
  }
  return <section className="admin-card category-manager"><div className="admin-title"><div><h2>Categorias dos atalhos</h2><p>Crie categorias, renomeie e mova os links entre elas.</p></div><button className="admin-secondary" disabled={busy} onClick={() => void run(async () => {}, 'Categorias atualizadas.')}>Atualizar</button></div>
    {message && <p role="status" className="admin-message">{message}</p>}
    <form className="category-create" onSubmit={create}><label htmlFor="new-category">Nova categoria</label><div><input id="new-category" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da categoria" /><button className="admin-primary" disabled={busy}>Criar categoria</button></div></form>
    <div className="category-management-grid"><nav className="category-management-list" aria-label="Categorias cadastradas">{categories.map(category=><button key={category} disabled={busy} aria-pressed={current===category} onClick={()=>{setSelected(category);setRename('');}}><span>{category}</span><b>{links.filter(link=>link.categoria===category).length}</b></button>)}</nav><div>
      {current ? <><h3>{current}</h3><form className="category-create" onSubmit={event=>{event.preventDefault();void run(async()=>{await request('PUT',{original:current,nome:rename.trim()});setSelected(rename.trim());setRename('');},'Categoria renomeada. Os links foram atualizados juntos.');}}><label htmlFor="rename-category">Renomear categoria</label><div><input id="rename-category" required maxLength={80} value={rename} onChange={e=>setRename(e.target.value)} placeholder="Novo nome" /><button className="admin-secondary" disabled={busy}>Renomear</button></div></form>
      <div className="admin-list">{items.map(link=><article key={link.id} className="admin-entry category-link"><strong>{link.titulo}</strong><label htmlFor={`move-link-${link.id}`}>Mover para</label><select id={`move-link-${link.id}`} aria-label={`Categoria de ${link.titulo}`} disabled={busy} value={link.categoria} onChange={event=>void run(()=>move(link,event.target.value),'Link movido para a nova categoria.')}>{categories.map(category=><option key={category} value={category}>{category}</option>)}</select></article>)}{!items.length&&<p>Esta categoria ainda não tem links.</p>}</div>
      <button type="button" className="admin-danger" disabled={busy||items.length>0} onClick={()=>void run(async()=>{await request('DELETE',undefined,current);setSelected('');},'Categoria vazia excluída.')}>Excluir categoria vazia</button>{items.length>0&&<p className="admin-help">Mova os links antes de excluir esta categoria.</p>}</> : <p>Crie a primeira categoria para começar.</p>}
    </div></div>
  </section>;
}
