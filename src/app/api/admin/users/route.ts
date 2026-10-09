import { authorizeAdmin } from '@/lib/admin-auth';
async function authorizeSuperAdmin(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth;
  const { data, error } = await auth.supabase.rpc('is_portal_super_admin').abortSignal(AbortSignal.timeout(8000));
  if (error) return { response: Response.json({ error: 'Execute o script super-admin-setup.sql no Supabase para ativar os usuários.' }, { status: 503 }) };
  if (data !== true) return { response: Response.json({ error: 'Somente o super-admin pode gerenciar usuários.' }, { status: 403 }) };
  return auth;
}
export async function GET(request: Request) {
  const auth = await authorizeSuperAdmin(request); if (auth.response) return auth.response;
  const search = (new URL(request.url).searchParams.get('search') || '').slice(0,254);
  const { data, error } = await auth.supabase!.rpc('portal_list_users', { p_search: search }).abortSignal(AbortSignal.timeout(8000));
  if (error) return Response.json({ error: 'Não foi possível carregar os usuários. Confira a configuração no Supabase.' }, { status: 503 });
  return Response.json({ users: data }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function PUT(request: Request) {
  const auth = await authorizeSuperAdmin(request); if (auth.response) return auth.response;
  let body; try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  if (!body || typeof body.user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id) || typeof body.authorized !== 'boolean') return Response.json({ error: 'Usuário ou permissão inválida.' }, { status: 400 });
  const { error } = await auth.supabase!.rpc('portal_set_user_access', { p_user_id: body.user_id, p_authorized: body.authorized }).abortSignal(AbortSignal.timeout(8000));
  if (error) return Response.json({ error: error.code === 'P0001' ? error.message : 'Não foi possível alterar o acesso.' }, { status: 400 });
  return Response.json({ ok: true });
}
