import { createClient } from '@supabase/supabase-js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (/bot|crawler|spider|headless|preview|lighthouse/i.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204 });
  const raw = await request.text();
  if (raw.length > 1024) return new Response(null, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  if (!body || !['visit','click','impression'].includes(body.kind) || !['site','whatsapp'].includes(body.action) || !['mobile','desktop'].includes(body.device) || ![body.event_id,body.visitor_id,body.session_id].every(value=>typeof value==='string' && uuid.test(value)) || (body.kind==='visit' ? body.link_id!==null || body.action!=='site' : !Number.isSafeInteger(body.link_id) || body.link_id<=0)) return new Response(null, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response(null, { status: 503 });
  const db = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try {
    const { error } = await db.rpc('portal_record_event', { p_event_id:body.event_id,p_visitor_id:body.visitor_id,p_session_id:body.session_id,p_kind:body.kind,p_link_id:body.link_id,p_action:body.action,p_device:body.device }).abortSignal(AbortSignal.timeout(5000));
    return new Response(null,{status:error ? 503 : 204});
  } catch { return new Response(null,{status:503}); }
}
