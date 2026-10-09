'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { ShieldCheck, LogOut, Plus, Pencil, Trash2, X, ImagePlus } from 'lucide-react';
import CategoryManager from './category-manager';
import UserManager from './user-manager';
import OrderManager from './order-manager';
import AnalyticsPanel from './analytics-panel';
import AdminCollapse from './admin-collapse';
import type { AnalyticsReport } from '@/lib/analytics';
import { compareLinks, normalizeEntryUrl, type Atalho } from '@/lib/atalhos';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const initialForm = { titulo: '', url: '', categoria: 'Sistemas e Consultas', imagem_url: '', grupo: '', telefone_pendente: false };

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [userSetupRequired, setUserSetupRequired] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [categories, setCategories] = useState<string[]>([]);
  const [orderAvailable, setOrderAvailable] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<Atalho[]>([]);
  const [tab, setTab] = useState<'links' | 'partners' | 'users' | 'order' | 'analytics'>('links');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<Atalho['id'] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Atalho | null>(null);
  const previewRef = useRef('');
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, current) => { setSession(current); });
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) return;
    void fetch('/api/admin/links', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }).then(async (response) => {
      const data = await response.json();
      if (!active) return;
      setAuthorized(response.ok);
      if (response.ok) {
        setLinks(data.links); setMessage('');
        void fetch('/api/admin/access', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }).then(async response => {
          const role = await response.json();
          if (active) { setSuperAdmin(response.ok && role.superAdmin === true); setUserSetupRequired(response.ok && role.setupRequired === true); }
        }).catch(() => { if (active) setSuperAdmin(false); });
        void fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' }).then(async response => {
          const result = await response.json();
          if (active && response.ok) {setCategories(result.categories);setOrderAvailable(result.orderAvailable === true);}
          else if (active) setMessage(result.error || 'Não foi possível carregar as categorias.');
        }).catch(() => { if (active) setMessage('Não foi possível carregar as categorias.'); });
      } else setMessage(data.error || 'Não foi possível acessar o painel.');
    }).catch(() => { if (active) { setAuthorized(false); setMessage('Falha de conexão. Atualize a página para tentar novamente.'); } });
    return () => { active = false; };
  }, [session]);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  function chooseFile(selected: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = selected ? URL.createObjectURL(selected) : '';
    setFile(selected); setPreview(previewRef.current);
  }

  function resetForm() {
    setForm({ ...initialForm, categoria: categories[0] || initialForm.categoria }); setEditingId(null); chooseFile(null);
    setEditorOpen(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function api(method: string, body?: unknown, id?: Atalho['id'], resource: 'links' | 'categories' | 'order' = 'links') {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch(`/api/admin/${resource}${id ? `?${resource === 'categories' ? 'name' : 'id'}=${encodeURIComponent(id)}` : ''}`, { method, headers: { Authorization: `Bearer ${current.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir.');
    return data;
  }

  const usersRequest = useCallback(async (method: string, body?: unknown, search?: string) => {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) throw new Error('Sua sessão expirou.');
    const response = await fetch('/api/admin/users' + (search ? '?search=' + encodeURIComponent(search) : ''), { method, headers: { Authorization: `Bearer ${current.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível gerenciar usuários.');
    return data;
  }, []);

  const analyticsRequest = useCallback(async (month: string): Promise<{report:AnalyticsReport}> => {
    const { data: { session: current } } = await supabase.auth.getSession();
    if (!current) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch('/api/admin/analytics?month='+encodeURIComponent(month), {headers:{Authorization: `Bearer ${current.access_token}`},cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as estatísticas.');
    return data;
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) throw new Error('As senhas não coincidem.');
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: 'https://www.atalhogratis.com.br/admin' } });
        if (error) throw new Error(error.message);
        setMessage(data.session ? 'Conta criada. Seu acesso administrativo depende de autorização.' : 'Confira seu e-mail para confirmar a conta. Depois entre no painel. O acesso administrativo depende de autorização.');
        setAuthMode('login'); setConfirmPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error('E-mail ou senha incorretos, ou conta ainda não confirmada.');
      }
      setPassword('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) { setMessage('Não foi possível sair. Tente novamente.'); return; }
    setSession(null); setAuthorized(false); setSuperAdmin(false); setUserSetupRequired(false); setTab('links'); setLinks([]); setCategories([]); setMessage(''); resetForm();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    let uploadedPath: string | undefined;
    try {
      const url = normalizeEntryUrl(form.url, tab !== 'partners');
      if (!url) throw new Error('Informe um endereço válido, como www.exemplo.com ou https://exemplo.com.');
      let image = form.imagem_url;
      if (file) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Envie uma imagem JPG, PNG ou WebP de até 10 MB.');
        const compressed = await imageCompression(file, { maxSizeMB: tab === 'partners' ? 0.3 : 0.1, maxWidthOrHeight: tab === 'partners' ? 1200 : 400, useWebWorker: true, fileType: 'image/webp' });
        uploadedPath = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage.from('logos-portalatalhos').upload(uploadedPath, compressed, { contentType: 'image/webp', cacheControl: '3600' });
        if (error) throw new Error('Não foi possível enviar a imagem. Confira suas permissões no Supabase.');
        image = supabase.storage.from('logos-portalatalhos').getPublicUrl(uploadedPath).data.publicUrl;
      }
      const data = await api(editingId ? 'PUT' : 'POST', { titulo: form.titulo, url, ...(orderAvailable ? {grupo:form.grupo,telefone_pendente:form.telefone_pendente} : {}), id: editingId, categoria: tab === 'partners' ? 'Propaganda' : form.categoria, imagem_url: image });
      setLinks((current) => editingId ? current.map((link) => link.id === editingId ? data.link : link) : [...current, data.link]);
      resetForm(); setMessage(tab === 'partners' ? 'Anúncio salvo! Ele já aparece na lateral do portal.' : 'Atalho salvo! Ele já aparece no portal.');
    } catch (error) {
      if (uploadedPath) await supabase.storage.from('logos-portalatalhos').remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusy(true); setMessage('');
    try { await api('DELETE', undefined, deleteTarget.id); setLinks((current) => current.filter((link) => link.id !== deleteTarget.id)); if (editingId === deleteTarget.id) resetForm(); setDeleteTarget(null); setMessage('Cadastro excluído do portal.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível excluir.'); }
    finally { setBusy(false); }
  }

  async function reloadManagement() {
    const [list, catalog] = await Promise.all([api('GET'), api('GET', undefined, undefined, 'categories')]);
    setLinks(list.links); setCategories(catalog.categories); setOrderAvailable(catalog.orderAvailable === true);
  }
  const categoryOptions = [...new Set([...categories, ...links.filter(link => link.categoria !== 'Propaganda').map(link => link.categoria)])];

  const displayed = links.filter((link) => (link.categoria === 'Propaganda') === (tab === 'partners')).sort(compareLinks);
  function openEditor(category: string, link?: Atalho) {
    resetForm(); setMessage(''); setEditorOpen(true); setEditingId(link?.id ?? null);
    setForm(link ? { titulo: link.titulo, url: link.url, categoria: category, imagem_url: link.imagem_url || '', grupo: link.grupo || '', telefone_pendente: Boolean(link.telefone_pendente) } : { ...initialForm, categoria: category });
    setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); formRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true }); }, 0);
  }
  const entryEditor = <AdminCollapse key={editingId ?? 'new'} title={`${editingId ? 'Editar' : 'Novo'} ${tab === 'partners' ? 'anúncio parceiro' : 'atalho'}`} defaultOpen={tab !== 'partners' || editingId !== null}><p>{tab === 'partners' ? 'O anúncio aparece na lateral do site e abaixo dos atalhos no celular.' : `Cadastre o endereço do serviço em ${form.categoria}.`}</p>
          <form ref={formRef} onSubmit={save} className="admin-form"><label htmlFor="entry-title">{tab === 'partners' ? 'Nome do parceiro' : 'Nome do atalho'}</label><input id="entry-title" required maxLength={150} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder={tab === 'partners' ? 'Nome da empresa' : 'Ex.: Portal do Servidor'} /><label htmlFor="entry-url">Endereço do site{tab === 'links' ? ' ou telefone' : ''}</label><input id="entry-url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value, telefone_pendente: false })} onBlur={()=>{const url=normalizeEntryUrl(form.url,tab === 'links');if(url)setForm(current=>({...current,url}));}} placeholder={tab === 'links' ? 'https://… ou tel:190' : 'www.exemplo.com'} /><p className="admin-help">Pode digitar com ou sem https://.</p>
          {tab === 'links' && <><label htmlFor="entry-category">Categoria</label><input id="entry-category" readOnly value={form.categoria} /></>}
          {tab === 'links' && orderAvailable && <><label htmlFor="entry-group">Unidade ou região (opcional)</label><input id="entry-group" maxLength={150} value={form.grupo} onChange={e=>setForm({...form,grupo:e.target.value})} />{form.telefone_pendente && <p className="admin-message">Este número precisa de conferência. Ao corrigir o telefone, a marcação será removida.</p>}</>}<label htmlFor="entry-image"><ImagePlus size={16} aria-hidden="true" /> {tab === 'partners' ? 'Imagem do anúncio' : 'Logo (opcional)'}</label><input ref={fileRef} id="entry-image" type="file" accept="image/jpeg,image/png,image/webp" required={tab === 'partners' && !form.imagem_url} onChange={(e) => chooseFile(e.target.files?.[0] || null)} /><p className="admin-help">JPG, PNG ou WebP · até 10 MB.{tab === 'partners' ? ' Prefira uma imagem horizontal.' : ''}</p>
          {(preview || form.imagem_url) && <div className={tab === 'partners' ? 'admin-preview admin-partner-preview' : 'admin-preview'}><Image src={preview || form.imagem_url} alt="Prévia da imagem do cadastro" onLoad={event=>{if(tab === 'partners'){const img=event.currentTarget;if(img.naturalHeight&&img.parentElement)img.parentElement.style.aspectRatio=String(img.naturalWidth/img.naturalHeight);}}} fill unoptimized className="object-contain" /></div>}
          <div className="admin-form-actions"><button className="admin-primary" disabled={busy}><Plus size={16} aria-hidden="true" />{busy ? 'Salvando…' : editingId ? 'Salvar alterações' : tab === 'partners' ? 'Publicar anúncio' : 'Cadastrar atalho'}</button>{(editingId || editorOpen) && <button type="button" className="admin-secondary" disabled={busy} onClick={resetForm}>Cancelar</button>}</div></form></AdminCollapse>;
  return <main className="admin-shell"><div className="admin-container">
    <header className="admin-header"><Link href="/" className="brand"><span className="brand-icon"><ShieldCheck size={25} aria-hidden="true" /></span><span>Atalhos<span className="brand-highlight">Grátis</span></span></Link><Link href="/">Voltar ao portal</Link></header>
    {checking ? <p role="status">Verificando sessão…</p> : !session ? <section className="admin-login"><ShieldCheck size={32} aria-hidden="true" /><h1>Painel administrador</h1><p>{authMode === 'signup' ? 'Crie sua conta. O acesso ao painel precisa ser autorizado pelo administrador.' : 'Entre para gerenciar atalhos e anúncios de parceiros.'}</p><form onSubmit={login}><label htmlFor="admin-email">E-mail</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /><label htmlFor="admin-password">Senha</label><input id="admin-password" type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={authMode === 'signup' ? 8 : undefined} required value={password} onChange={(e) => setPassword(e.target.value)} /><>{authMode === 'signup' && <><label htmlFor="confirm-password">Confirmar senha</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /><p className="admin-help">Use pelo menos 8 caracteres.</p></>}<button className="admin-primary" disabled={busy}>{busy ? 'Aguarde…' : authMode === 'signup' ? 'Criar conta' : 'Entrar'}</button></></form><button className="admin-auth-switch" type="button" disabled={busy} onClick={()=>{setAuthMode(authMode === 'signup' ? 'login' : 'signup');setMessage('');setPassword('');setConfirmPassword('');}}>{authMode === 'signup' ? 'Já tenho conta — entrar' : 'Criar usuário'}</button>{message && <p role="alert" className="admin-message">{message}</p>}</section> : <>
      <div className="admin-title"><div><h1>Painel administrador</h1><p>{session.user.email}{superAdmin ? ' · Super-admin' : ''}</p></div><button type="button" className="admin-secondary" onClick={logout}><LogOut size={16} aria-hidden="true" /> Sair</button></div>
      {!authorized ? <section className="admin-card"><p role="status">{message || 'Verificando permissão de administrador…'}</p></section> : <>
        <div className="admin-tabs" aria-label="Tipo de cadastro"><button type="button" aria-pressed={tab === 'links'} disabled={busy} onClick={() => { setTab('links'); resetForm(); setMessage(''); }}>Categorias e atalhos ({links.filter(l => l.categoria !== 'Propaganda').length})</button><button type="button" aria-pressed={tab === 'partners'} disabled={busy} onClick={() => { setTab('partners'); resetForm(); setMessage(''); }}>Anúncios parceiros ({links.filter(l => l.categoria === 'Propaganda').length})</button><button type="button" aria-pressed={tab === 'order'} disabled={busy} onClick={()=>{setTab('order');resetForm();setMessage('');}}>Ordenação</button><button type="button" disabled={busy} aria-pressed={tab === 'analytics'} onClick={()=>{setTab('analytics');resetForm();setMessage('');}}>Estatísticas</button>{superAdmin && <button type="button" aria-pressed={tab === 'users'} onClick={()=>{setTab('users');resetForm();setMessage('');}}>Usuários</button>}</div>{userSetupRequired && <p className="admin-message">Execute o script super-admin-setup.sql no Supabase para ativar o gerenciamento de usuários.</p>}
        {message && <p role="status" className="admin-message">{message}</p>}
        <>{tab === 'analytics' ? <AnalyticsPanel request={analyticsRequest} /> : tab === 'order' ? <OrderManager categories={categoryOptions} links={links} available={orderAvailable} save={async body=>{await api('PUT',body,undefined,'order');}} reload={reloadManagement} /> : tab === 'users' ? (superAdmin ? <UserManager request={usersRequest} /> : <p>Acesso exclusivo do super-admin.</p>) : tab === 'links' ? <CategoryManager categories={categoryOptions} links={links} request={(method, body, name)=>api(method,body,name,'categories')} reload={reloadManagement} busy={busy} onSelect={resetForm} onCreate={category=>openEditor(category)} onEdit={link=>openEditor(link.categoria,link)} onDelete={setDeleteTarget} editor={category=>editorOpen && form.categoria===category ? entryEditor : null} move={async (link, categoria)=>{await api('PATCH',{id:link.id,categoria});}} /> : <div className="admin-columns">{entryEditor}
          <AdminCollapse title={`Anúncios cadastrados (${displayed.length})`}><p>{displayed.length} {displayed.length === 1 ? 'cadastro' : 'cadastros'}</p><div className="admin-list">{displayed.map(link => <article key={link.id} className="admin-entry"><div><strong>{link.titulo}</strong><span>{tab === 'partners' ? 'Parceiro · lateral do portal' : link.categoria}</span></div><button type="button" disabled={busy} aria-label={`Editar ${link.titulo}`} onClick={() => { resetForm(); setEditingId(link.id); setForm({ titulo: link.titulo, url: link.url, categoria: link.categoria, imagem_url: link.imagem_url || '', grupo: link.grupo || '', telefone_pendente: Boolean(link.telefone_pendente) }); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><Pencil size={17} /></button><button type="button" disabled={busy} aria-label={`Excluir ${link.titulo}`} onClick={() => setDeleteTarget(link)}><Trash2 size={17} /></button></article>)}{!displayed.length && <p>Nenhum cadastro ainda. Use o formulário ao lado para começar.</p>}</div></AdminCollapse></div>}</>
        {deleteTarget && <div className="admin-modal-backdrop" onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) setDeleteTarget(null);
          if (event.key === 'Tab') {
            const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="admin-card admin-dialog"><button type="button" className="admin-close" aria-label="Cancelar exclusão" disabled={busy} onClick={() => setDeleteTarget(null)}><X size={20} /></button><h2 id="delete-title">Excluir cadastro?</h2><p>“{deleteTarget.titulo}” será removido do portal.</p><div className="admin-form-actions"><button type="button" className="admin-secondary" disabled={busy} autoFocus onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="button" className="admin-danger" disabled={busy} onClick={remove}>{busy ? 'Excluindo…' : 'Excluir'}</button></div></section></div>}
      </>}
    </>}
  </div></main>;
}
