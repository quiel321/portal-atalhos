import { authorizeAdmin } from '@/lib/admin-auth';
import { normalizeEntryUrl } from '@/lib/atalhos';

export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from('atalhos_links').select('*').order('titulo').abortSignal(AbortSignal.timeout(10000));
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
  const url = typeof body.url === 'string' ? normalizeEntryUrl(body.url, true) : undefined;
  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  const imagem_url = typeof body.imagem_url === 'string' ? body.imagem_url.trim() : '';
  const imageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos-portalatalhos/`;
  let validationError = '';
  if (!titulo || titulo.length > 150) validationError = 'Informe o nome com até 150 caracteres.';
  else if (!url) validationError = 'Informe um endereço válido, como www.exemplo.com ou https://exemplo.com.';
  else if (!categoria || categoria.length > 80) validationError = 'Escolha uma categoria válida.';
  else if (imagem_url && !imagem_url.startsWith(imageBase)) validationError = 'Envie a imagem pelo campo de upload do formulário.';
  else if (categoria === 'Propaganda' && !imagem_url) validationError = 'Escolha uma imagem para o anúncio parceiro.';
  else if (categoria === 'Propaganda' && url.startsWith('tel:')) validationError = 'O anúncio precisa do endereço de um site.';
  if (validationError) return Response.json({ error: validationError }, { status: 400 });
  if (editing && !/^[0-9]+$/.test(String(body.id))) return Response.json({ error: 'Cadastro inválido.' }, { status: 400 });
  if (body.grupo !== undefined && (typeof body.grupo !== 'string' || body.grupo.length > 150)) return Response.json({ error: 'Use uma unidade ou região de até 150 caracteres.' }, { status: 400 });
  if (body.telefone_pendente !== undefined && typeof body.telefone_pendente !== 'boolean') return Response.json({ error: 'Estado do telefone inválido.' }, { status: 400 });
  const values = { titulo, url, categoria, imagem_url, ...(body.grupo !== undefined ? { grupo: body.grupo.trim() } : {}), ...(body.telefone_pendente !== undefined ? { telefone_pendente: body.telefone_pendente } : {}) };
  const query = editing ? auth.supabase.from('atalhos_links').update(values).eq('id', body.id) : auth.supabase.from('atalhos_links').insert(values);
  const { data, error } = await query.select('*').abortSignal(AbortSignal.timeout(10000)).single();
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
