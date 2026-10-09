import 'server-only';
import { createClient } from '@supabase/supabase-js';

export async function authorizeAdmin(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return { response: Response.json({ error: 'Entre na sua conta para continuar.' }, { status: 401 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { response: Response.json({ error: 'Autenticação indisponível.' }, { status: 503 }) };
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { response: Response.json({ error: 'Sua sessão expirou. Entre novamente.' }, { status: 401 }) };
    const access = await supabase.from('portal_admins').select('user_id').eq('user_id', user.id).abortSignal(AbortSignal.timeout(8000)).maybeSingle();
    if (access.error) return { response: Response.json({ error: 'As permissões do painel ainda não foram configuradas no Supabase.' }, { status: 503 }) };
    if (!access.data) return { response: Response.json({ error: 'Esta conta não possui acesso de administrador.' }, { status: 403 }) };
    return { supabase, user };
  } catch {
    return { response: Response.json({ error: 'Não foi possível verificar sua sessão. Tente novamente.' }, { status: 503 }) };
  }
}
