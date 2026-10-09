import { authorizeAdmin } from '@/lib/admin-auth';
import { safeUrl } from '@/lib/atalhos';

export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from('atalhos_links').select('id,titulo,url,categoria,imagem_url').order('titulo').abortSignal(AbortSignal.timeout(10000));
  if (error) return Response.json({ error: 'Não foi possível carregar os cadastros.' }, { status: 503 });
  return Response.json({ links: data }, { headers: { 'Cache-Control': 'no-store' } });
}

async function save(request: Request, editing: boolean) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const url = typeof body.url === 'string' ? safeUrl(body.url.trim(), true) : undefined;
  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  const imagem_url = typeof body.imagem_url === 'string' ? body.imagem_url.trim() : '';
  const imageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-portalatalhos/`;
  if (!titulo || titulo.length > 150 || !url || !categoria || categoria.length > 80 || (imagem_url && !imagem_url.startsWith(imageBase)) || (categoria === 'Propaganda' && (!imagem_url || url.startsWith('tel:')))) {
    return Response.json({ error: 'Confira o nome, endereço, categoria e imagem. Anúncios precisam de imagem e endereço do site.' }, { status: 400 });
  }
  if (editing && !/^[0-9]+$/.test(String(body.id))) return Response.json({ error: 'Cadastro inválido.' }, { status: 400 });
  const values = { titulo, url, categoria, imagem_url };
  const query = editing ? auth.supabase.from('atalhos_links').update(values).eq('id', body.id) : auth.supabase.from('atalhos_links').insert(values);
  const { data, error } = await query.select('id,titulo,url,categoria,imagem_url').abortSignal(AbortSignal.timeout(10000)).single();
  if (error) return Response.json({ error: 'Não foi possível salvar. Confira as permissões e tente novamente.' }, { status: 400 });
  return Response.json({ link: data }, { status: editing ? 200 : 201 });
}
export async function POST(request: Request) { return save(request, false); }
export async function PUT(request: Request) { return save(request, true); }
export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9]+$/.test(id)) return Response.json({ error: 'Cadastro inválido.' }, { status: 400 });
  const { data, error } = await auth.supabase.from('atalhos_links').delete().eq('id', id).select('id').abortSignal(AbortSignal.timeout(10000));
  if (error) return Response.json({ error: 'Não foi possível excluir este cadastro.' }, { status: 400 });
  if (!data?.length) return Response.json({ error: 'Cadastro não encontrado.' }, { status: 404 });
  return Response.json({ ok: true });
}
