import { currentAnalyticsMonth } from '@/lib/analytics';
import { authorizeAdmin } from '@/lib/admin-auth';
export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const month = new URL(request.url).searchParams.get('month');
  const current = currentAnalyticsMonth();
  if (!month || !/^(20[2-9][0-9])-(0[1-9]|1[0-2])$/.test(month) || month > current) return Response.json({error:'Selecione um mês válido, até o mês atual.'},{status:400});
  try {
    const {data,error} = await auth.supabase.rpc('portal_analytics_report',{p_month:month+'-01'}).abortSignal(AbortSignal.timeout(15000));
    if (error) return Response.json({error:['42883','PGRST202','42P01'].includes(error.code) ? 'Execute analytics-setup.sql no SQL Editor do Supabase para ativar o monitoramento.' : 'Não foi possível carregar as estatísticas. Tente novamente.',setupRequired:['42883','PGRST202','42P01'].includes(error.code)},{status:503});
    return Response.json({report:data},{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({error:'Não foi possível carregar as estatísticas. Tente novamente.'},{status:503});}
}
