'use client';
import AdminCollapse from './admin-collapse';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { compareLinks, type Atalho } from '@/lib/atalhos';

interface Props {
  categories: string[]; links: Atalho[];
  request: (method: string, body?: unknown, name?: string) => Promise<unknown>;
  move: (link: Atalho, category: string) => Promise<void>;
  reload: () => Promise<void>;
  busy: boolean;
  onSelect: () => void;
  onCreate: (category: string) => void;
  onEdit: (link: Atalho) => void;
  onDelete: (link: Atalho) => void;
  editor: (category: string) => ReactNode;
}
export default function CategoryManager({ categories, links, request, move, reload, busy: saving, onSelect, onCreate, onEdit, onDelete, editor }: Props) {
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [rename, setRename] = useState('');
  const [working, setBusy] = useState(false);
  const busy = saving || working;
  const [message, setMessage] = useState('');
  const current = categories.includes(selected) ? selected : categories[0] || '';
  const items = links.filter(link => link.categoria === current).sort(compareLinks);
  async function run(action: () => Promise<void>, success: string, after?: () => void) {
    setBusy(true); setMessage('');
    try { await action(); await reload(); after?.(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const category = name.trim(); void run(async () => { await request('POST', { nome: category }); setSelected(category); setName(''); }, 'Categoria criada. Cadastre o primeiro atalho abaixo.', () => onCreate(category));
  }
  return <AdminCollapse title="Categorias dos atalhos" className="category-manager"><div className="admin-title"><div><p>Crie categorias, renomeie e mova os links entre elas.</p></div><button className="admin-secondary" disabled={busy} onClick={() => void run(async () => {}, 'Categorias atualizadas.')}>Atualizar</button></div>
    {message && <p role="status" className="admin-message">{message}</p>}
    <form className="category-create" onSubmit={create}><label htmlFor="new-category">Nova categoria</label><div><input id="new-category" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da categoria" /><button className="admin-primary" disabled={busy}>Criar categoria</button></div></form>
    <div className="category-management-grid"><nav className="category-management-list" aria-label="Categorias cadastradas">{categories.map(category=><button key={category} disabled={busy} aria-pressed={current===category} onClick={()=>{setSelected(category);setRename('');onSelect();}}><span>{category}</span><b>{links.filter(link=>link.categoria===category).length}</b></button>)}</nav><div>
      {current ? <><div className="category-editor-heading"><h3>{current}</h3><button type="button" className="admin-primary" disabled={busy} onClick={()=>onCreate(current)}><Plus size={16} aria-hidden="true" />Criar atalho</button></div><div className="category-inline-editor">{editor(current)}</div><form className="category-create" onSubmit={event=>{event.preventDefault();void run(async()=>{await request('PUT',{original:current,nome:rename.trim()});setSelected(rename.trim());setRename('');},'Categoria renomeada. Os links foram atualizados juntos.');}}><label htmlFor="rename-category">Renomear categoria</label><div><input id="rename-category" required maxLength={80} value={rename} onChange={e=>setRename(e.target.value)} placeholder="Novo nome" /><button className="admin-secondary" disabled={busy}>Renomear</button></div></form>
      <AdminCollapse key={current} title={`Atalhos desta categoria (${items.length})`} className="category-items"><div className="admin-list">{items.map(link=><article key={link.id} className="admin-entry category-link"><strong>{link.titulo}</strong><button type="button" disabled={busy} aria-label={`Editar ${link.titulo}`} onClick={()=>onEdit(link)}><Pencil size={17} aria-hidden="true" /></button><button type="button" disabled={busy} aria-label={`Excluir ${link.titulo}`} onClick={()=>onDelete(link)}><Trash2 size={17} aria-hidden="true" /></button><label htmlFor={`move-link-${link.id}`}>Mover para</label><select id={`move-link-${link.id}`} aria-label={`Categoria de ${link.titulo}`} disabled={busy} value={link.categoria} onChange={event=>void run(()=>move(link,event.target.value),'Link movido para a nova categoria.')}>{categories.map(category=><option key={category} value={category}>{category}</option>)}</select></article>)}{!items.length&&<p>Esta categoria ainda não tem links.</p>}</div></AdminCollapse>
      <button type="button" className="admin-danger" disabled={busy||items.length>0} onClick={()=>void run(async()=>{await request('DELETE',undefined,current);setSelected('');},'Categoria vazia excluída.')}>Excluir categoria vazia</button>{items.length>0&&<p className="admin-help">Mova os links antes de excluir esta categoria.</p>}</> : <p>Crie a primeira categoria para começar.</p>}
    </div></div>
  </AdminCollapse>;
}
