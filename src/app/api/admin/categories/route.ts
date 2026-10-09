import { authorizeAdmin } from '@/lib/admin-auth';
const validName = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 80 && value.trim().toLocaleLowerCase('pt-BR') !== 'propaganda';
export async function GET(request: Request) {
  const auth = await authorizeAdmin(request); if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from('portal_categories').select('nome').neq('nome', 'Propaganda').order('nome').abortSignal(AbortSignal.timeout(8000));
  if (error) return Response.json({ error: 'Execute o script de categorias no Supabase para ativar este recurso.' }, { status: 503 });
  return Response.json({ categories: data.map(row => row.nome) }, { headers: { 'Cache-Control': 'no-store' } });
}
async function save(request: Request, rename: boolean) {
  const auth = await authorizeAdmin(request); if (auth.response) return auth.response;
  let body; try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  if (!body || !validName(body.nome) || (rename && !validName(body.original))) return Response.json({ error: 'Use um nome de categoria de até 80 caracteres. Propaganda é reservada aos anúncios.' }, { status: 400 });
  const query = rename ? auth.supabase.from('portal_categories').update({ nome: body.nome.trim() }).eq('nome', body.original.trim()) : auth.supabase.from('portal_categories').insert({ nome: body.nome.trim() });
  const { data, error } = await query.select('nome').abortSignal(AbortSignal.timeout(8000)).single();
  if (error) return Response.json({ error: error.code === '23505' ? 'Já existe uma categoria com esse nome.' : 'Não foi possível salvar a categoria.' }, { status: 400 });
  return Response.json({ category: data.nome }, { status: rename ? 200 : 201 });
}
export async function POST(request: Request) { return save(request, false); }
export async function PUT(request: Request) { return save(request, true); }
export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(request); if (auth.response) return auth.response;
  const name = new URL(request.url).searchParams.get('name');
  if (!validName(name)) return Response.json({ error: 'Categoria inválida.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('portal_categories').delete().eq('nome', name).select('nome').abortSignal(AbortSignal.timeout(8000));
  if (error) return Response.json({ error: error.code === '23503' ? 'Mova os links antes de excluir esta categoria.' : 'Não foi possível excluir.' }, { status: 400 });
  if (!data?.length) return Response.json({ error: 'Categoria não encontrada.' }, { status: 404 });
  return Response.json({ ok: true });
}
