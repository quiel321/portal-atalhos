import { authorizeAdmin } from '@/lib/admin-auth';
export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const role = await auth.supabase.rpc('is_portal_super_admin').abortSignal(AbortSignal.timeout(8000));
  return Response.json({ email: auth.user.email, superAdmin: role.data === true, setupRequired: Boolean(role.error) }, { headers: { 'Cache-Control': 'no-store' } });
}
