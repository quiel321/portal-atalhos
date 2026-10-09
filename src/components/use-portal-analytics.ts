'use client';
import { useEffect, type MouseEvent } from 'react';
type Session = { id: string; last: number };
let memoryVisitor = '';
let memorySession: Session | null = null;
const sessionKey = 'atalhos-analytics-session';
const visitorKey = 'atalhos-analytics-visitor';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function identifiers() {
  if (!memoryVisitor) memoryVisitor = crypto.randomUUID();
  let visitor = memoryVisitor, session = memorySession;
  try {
    const saved = localStorage.getItem(visitorKey);
    if (saved && uuid.test(saved)) visitor = saved;
    else localStorage.setItem(visitorKey,visitor);
    const savedSession = sessionStorage.getItem(sessionKey);
    if (savedSession) session = JSON.parse(savedSession);
  } catch { /* Tracking remains optional when storage is unavailable. */ }
  const fresh = !session || typeof session.id!=='string' || !uuid.test(session.id) || !Number.isFinite(session.last) || Date.now()-session.last>=30*60*1000;
  session = {id:fresh ? crypto.randomUUID() : session!.id,last:Date.now()};
  memoryVisitor = visitor; memorySession = session;
  try {sessionStorage.setItem(sessionKey,JSON.stringify(session));} catch {}
  return {visitor,session:session.id,fresh};
}
function send(kind: string, visitor: string, session: string, linkId: number | null, action: string) {
  const body = JSON.stringify({event_id:crypto.randomUUID(),visitor_id:visitor,session_id:session,kind,link_id:linkId,action,device:matchMedia('(max-width:760px)').matches ? 'mobile' : 'desktop'});
  void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
}
function record(kind: 'visit' | 'click' | 'impression', linkId: number | null = null, action = 'site') {
  try {
    if (document.visibilityState!=='visible') return;
    const ids = identifiers();
    if (ids.fresh || kind==='visit') send('visit',ids.visitor,ids.session,null,'site');
    if (kind!=='visit') send(kind,ids.visitor,ids.session,linkId,action);
    return ids.session;
  } catch { /* A statistics failure must never interrupt navigation. */ }
}
export default function usePortalAnalytics() {
  useEffect(()=>{
    const seen = new Set<Element>();
    const timers = new Map<Element,ReturnType<typeof setTimeout>>();
    let activeSession = record('visit');
    if(typeof IntersectionObserver==='undefined')return;
    const observer = new IntersectionObserver(entries=>{
      for(const entry of entries){
        const pending = timers.get(entry.target);
        if(!entry.isIntersecting || entry.intersectionRatio<0.5){if(pending)clearTimeout(pending);timers.delete(entry.target);continue;}
        if(seen.has(entry.target)||pending)continue;
        const timer=setTimeout(()=>{timers.delete(entry.target);if(document.visibilityState!=='visible')return;const id=Number((entry.target as HTMLElement).dataset.linkId);if(Number.isSafeInteger(id)&&id>0){record('impression',id);seen.add(entry.target);observer.unobserve(entry.target);}},1000);
        timers.set(entry.target,timer);
      }
    },{threshold:0.5});
    const partners = document.querySelectorAll('.partner-card[data-link-id]');
    partners.forEach(el=>observer.observe(el));
    const onVisible = ()=>{
      if(document.visibilityState!=='visible')return;
      const session=record('visit');
      if(session!==activeSession){seen.clear();activeSession=session;}
      partners.forEach(el=>{if(!seen.has(el)){observer.unobserve(el);observer.observe(el);}});
    };
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{document.removeEventListener('visibilitychange',onVisible);observer.disconnect();timers.forEach(clearTimeout);};
  },[]);
  function click(event: MouseEvent<HTMLDivElement>) {
    if(event.button!==0 && event.button!==1)return;
    const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[data-link-id]');
    if(!anchor?.getAttribute('href'))return;
    const id=Number(anchor.dataset.linkId);
    if(Number.isSafeInteger(id)&&id>0)record('click',id,anchor.dataset.analyticsAction || 'site');
  }
  return {onClickCapture:click,onAuxClickCapture:click};
}
