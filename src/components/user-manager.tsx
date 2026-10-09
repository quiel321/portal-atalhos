'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
interface PortalUser { user_id: string; email: string; confirmed: boolean; authorized: boolean; super_admin: boolean }
interface Props { request: (method: string, body?: unknown, search?: string) => Promise<{ users?: PortalUser[] }> }
export default function UserManager({ request }: Props) {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [revoke, setRevoke] = useState<PortalUser | null>(null);
  const load = useCallback(async (query = '') => {
    setBusy(true); setMessage('');
    try { const result = await request('GET', undefined, query); setUsers(result.users || []); }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar.'); }
    finally { setBusy(false); }
  }, [request]);
  useEffect(() => {
    let active = true;
    void request('GET').then(result => { if (active) setUsers(result.users || []); }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar.'); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [request]);
  async function change(user: PortalUser, authorized: boolean) {
    setBusy(true); setMessage('');
    try {
      await request('PUT', { user_id: user.user_id, authorized });
      const result = await request('GET', undefined, search); setUsers(result.users || []);
      setRevoke(null); setMessage(authorized ? 'Acesso de administrador autorizado.' : 'Acesso de administrador revogado.');
    } catch(error) { setMessage(error instanceof Error ? error.message : 'Não foi possível alterar.'); }
    finally { setBusy(false); }
  }
  function find(event: FormEvent) { event.preventDefault(); void load(search); }
  return <section className="admin-card"><div className="admin-title"><div><h2>Usuários</h2><p>Você é o super-admin. Autorize contas confirmadas para gerenciar o portal.</p></div><button type="button" className="admin-secondary" disabled={busy} onClick={()=>void load(search)}>Atualizar</button></div>
    <form className="category-create" onSubmit={find}><label htmlFor="user-search">Buscar por e-mail</label><div><input id="user-search" type="search" maxLength={254} value={search} onChange={event=>setSearch(event.target.value)} /><button className="admin-primary" disabled={busy}>Buscar</button></div></form>
    {message && <p role="status" className="admin-message">{message}</p>}
    <div className="admin-list">{users.map(user=><article key={user.user_id} className="admin-entry user-entry"><div><strong>{user.email}</strong><span>{user.super_admin ? 'Super-admin' : user.authorized ? 'Administrador autorizado' : user.confirmed ? 'Aguardando autorização' : 'Aguardando confirmação do e-mail'}</span></div>{!user.super_admin && (revoke?.user_id === user.user_id ? <div className="user-actions"><button className="admin-danger" disabled={busy} onClick={()=>void change(user,false)}>Confirmar revogação</button><button className="admin-secondary" disabled={busy} onClick={()=>setRevoke(null)}>Cancelar</button></div> : <button className={user.authorized ? 'admin-secondary' : 'admin-primary'} disabled={busy||!user.confirmed} onClick={()=>user.authorized ? setRevoke(user) : void change(user,true)}>{user.authorized ? 'Revogar acesso' : 'Autorizar'}</button>)}</article>)}</div>
    {!users.length && <p>{busy ? 'Carregando usuários…' : 'Nenhuma conta encontrada.'}</p>}<p className="admin-help">Até 100 contas por busca. As contas autorizadas podem gerenciar links, categorias e anúncios. Somente você gerencia os usuários.</p>
  </section>;
}
