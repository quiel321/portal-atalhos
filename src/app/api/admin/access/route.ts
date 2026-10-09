import { authorizeAdmin } from '@/lib/admin-auth';
export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  return Response.json({ email: auth.user.email }, { headers: { 'Cache-Control': 'no-store' } });
}
