'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import AdminCollapse from './admin-collapse';
import TrafficChart from './traffic-chart';
import { analyticsCsv, currentAnalyticsMonth, type AnalyticsReport } from '@/lib/analytics';
interface Props { request: (month: string) => Promise<{report:AnalyticsReport}> }
const dayKey=(date:Date)=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Cuiaba',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');};
const count=(value:number)=>value.toLocaleString('pt-BR');
export default function AnalyticsPanel({request}:Props) {
  const [month,setMonth]=useState(currentAnalyticsMonth);
  const [report,setReport]=useState<AnalyticsReport|null>(null);
  const [busy,setBusy]=useState(true),[error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  const [open,setOpen]=useState(false),[updated,setUpdated]=useState('');
  const version=useRef(0);
  useEffect(()=>{
    let active=true;const id=++version.current;
    void request(month).then(data=>{if(active&&id===version.current){setReport(data.report);setError('');setUpdated(new Date().toLocaleTimeString('pt-BR',{timeZone:'America/Cuiaba'}));}}).catch(error=>{if(active&&id===version.current){setError(error instanceof Error?error.message:'Não foi possível carregar.');}}).finally(()=>{if(active&&id===version.current)setBusy(false);});
    return ()=>{active=false;};
  },[month,refresh,request]);
  useEffect(()=>{
    if(!open||month!==currentAnalyticsMonth())return;
    const update=()=>{if(document.visibilityState==='visible'&&!busy)setRefresh(value=>value+1);};
    const timer=setInterval(update,30000);document.addEventListener('visibilitychange',update);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',update);};
  },[open,month,busy]);
  function reload(){setBusy(true);setRefresh(value=>value+1);}
  function download(){if(!report)return;const url=URL.createObjectURL(new Blob([analyticsCsv(report)],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`atalhos-gratis-relatorio-${report.month}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const partners=report?.links.filter(link=>link.partner)||[],shortcuts=report?.links.filter(link=>!link.partner)||[];
  const today=dayKey(new Date()),started=report?dayKey(new Date(report.started_at)):today;
  const daily=(report?.daily||[]).filter(day=>day.day>=started&&day.day<=today).map(day=>({...day,date:day.day}));
  const monthly=(report?.monthly||[]).filter(row=>row.month>=started.slice(0,7)&&row.month<=today.slice(0,7)).map(row=>({...row,date:row.month}));
  return <AdminCollapse title="Estatísticas do portal" className="analytics-panel" onOpenChange={setOpen}><div className="admin-title"><div><p>Acompanhe o fluxo e apresente os resultados aos parceiros.</p></div><div className="analytics-actions"><button type="button" className="admin-secondary" disabled={busy} onClick={reload}><RefreshCw size={15} aria-hidden="true"/>Atualizar</button><button type="button" className="admin-primary" disabled={busy||!report} onClick={download}><Download size={15} aria-hidden="true"/>Baixar relatório CSV</button></div></div>
    <div className="analytics-period"><label htmlFor="analytics-month">Mês do relatório</label><input id="analytics-month" type="month" min="2020-01" max={currentAnalyticsMonth()} value={month} onChange={event=>{if(event.target.value){setBusy(true);setReport(null);setError('');setMonth(event.target.value);}}}/><span>Horário de Mato Grosso</span></div>
    {busy&&!report?<p role="status">Carregando estatísticas…</p>:error&&!report?<p role="alert" className="admin-message">{error}</p>:report&&<>
      {error&&<p role="alert" className="admin-message">{error} Os últimos dados carregados continuam visíveis.</p>}
      <p className="analytics-live"><i aria-hidden="true"/>{month===currentAnalyticsMonth()?'Atualização automática a cada 30 segundos':'Período histórico'} · Última atualização: {updated}</p>
      <p className="analytics-start">Monitoramento desde {new Date(report.started_at).toLocaleString('pt-BR',{timeZone:'America/Cuiaba'})}. Meses anteriores à ativação não têm histórico.</p>
      <AdminCollapse title="Resumo do mês" className="analytics-block"><div className="analytics-metrics">{[['Visitas (sessões)',report.summary.visits],['Navegadores únicos',report.summary.visitors],['Cliques nos links',report.summary.clicks],['Cliques em parceiros',report.summary.partner_clicks],['Exibições de parceiros',report.summary.impressions],['Visitas pelo celular',report.summary.mobile_visits]].map(([label,value])=><article key={label}><span>{label}</span><strong>{count(Number(value))}</strong></article>)}</div></AdminCollapse>
      {!report.summary.visits&&!report.summary.clicks&&!report.summary.impressions&&<p className="admin-message">Ainda não há registros neste mês. Os dados aparecerão conforme o portal for utilizado.</p>}
      <AdminCollapse title="Resultados dos parceiros" className="analytics-block"><div className="analytics-table-wrap"><table><thead><tr><th>Parceiro</th><th>Exibições</th><th>Cliques</th><th>Taxa de cliques</th></tr></thead><tbody>{partners.map(link=><tr key={link.link_id}><th scope="row">{link.title}</th><td>{count(link.impressions)}</td><td>{count(link.clicks)}</td><td>{link.impressions?((link.clicks/link.impressions)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—'}</td></tr>)}</tbody></table></div>{!partners.length&&<p>Nenhum parceiro com registros neste mês.</p>}</AdminCollapse>
      <TrafficChart title="Fluxo diário" points={daily} note={month===currentAnalyticsMonth()?'Dados registrados até hoje. O dia atual está em andamento.':'Evolução diária do período selecionado, a partir da ativação do monitoramento.'}/>
      <AdminCollapse title="Atalhos mais clicados" className="analytics-block"><div className="analytics-table-wrap analytics-ranking"><table><thead><tr><th>Atalho</th><th>Categoria</th><th>Cliques</th><th>WhatsApp</th></tr></thead><tbody>{shortcuts.map(link=><tr key={link.link_id}><th scope="row">{link.title}</th><td>{link.category}</td><td>{count(link.clicks)}</td><td>{count(link.whatsapp_clicks)}</td></tr>)}</tbody></table></div>{!shortcuts.length&&<p>Nenhum clique em atalhos neste mês.</p>}</AdminCollapse>
      <TrafficChart title="Evolução mensal" points={monthly} monthly note="Comparação dos últimos 12 meses com monitoramento. O mês atual mostra resultados parciais, sem projeções."/>
      <AdminCollapse title="Como os dados são contados" className="analytics-block"><p className="admin-help analytics-method">Visitas são sessões por aba, renovadas após 30 minutos sem atividade. Navegadores únicos são estimativas, não pessoas. Uma exibição exige pelo menos metade do anúncio visível por 1 segundo e conta uma vez por sessão. Mobile indica telas de até 760 pixels de largura. Repetidos cliques podem superar o número de exibições. Cliques não significam vendas. Bloqueadores ou falhas de conexão podem impedir o registro. Não guardamos nomes, e-mails ou IPs dos visitantes.</p></AdminCollapse>
    </>}
  </AdminCollapse>;
}
