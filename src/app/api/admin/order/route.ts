import { authorizeAdmin } from '@/lib/admin-auth';
export async function PUT(request: Request) {
  const auth = await authorizeAdmin(request); if (auth.response) return auth.response;
  let body; try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  if (!body || !['categories','links'].includes(body.kind) || !Array.isArray(body.ids) || body.ids.length > 5000 || body.ids.some((id: unknown) => typeof id !== 'string' && typeof id !== 'number') || (body.kind === 'links' && (typeof body.category !== 'string' || !body.category.trim()))) return Response.json({ error: 'Ordem inválida.' }, { status: 400 });
  const ids = body.ids.map(String);
  if (new Set(ids).size !== ids.length) return Response.json({ error: 'A lista contém itens repetidos.' }, { status: 400 });
  const { error } = await auth.supabase.rpc('portal_reorder', { p_kind: body.kind, p_category: body.kind === 'links' ? body.category : null, p_ids: ids }).abortSignal(AbortSignal.timeout(10000));
  if (error) return Response.json({ error: ['PGRST202','42883'].includes(error.code) ? 'Execute o SQL de ordenação e telefones no Supabase para ativar este recurso.' : error.code === 'P0001' ? error.message : 'Não foi possível salvar a ordem.' }, { status: 400 });
  return Response.json({ ok: true });
}
