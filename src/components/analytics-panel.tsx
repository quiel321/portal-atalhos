'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { analyticsCsv, currentAnalyticsMonth, type AnalyticsReport } from '@/lib/analytics';
interface Props { request: (month: string) => Promise<{report:AnalyticsReport}> }
const count=(value:number)=>value.toLocaleString('pt-BR');
export default function AnalyticsPanel({request}:Props) {
  const [month,setMonth]=useState(currentAnalyticsMonth);
  const [report,setReport]=useState<AnalyticsReport|null>(null);
  const [busy,setBusy]=useState(true),[error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  const version=useRef(0);
  useEffect(()=>{
    let active=true;const id=++version.current;
    void request(month).then(data=>{if(active&&id===version.current){setReport(data.report);setError('');}}).catch(error=>{if(active&&id===version.current){setReport(null);setError(error instanceof Error?error.message:'Não foi possível carregar.');}}).finally(()=>{if(active&&id===version.current)setBusy(false);});
    return ()=>{active=false;};
  },[month,refresh,request]);
  function reload(){setBusy(true);setRefresh(value=>value+1);}
  function download(){if(!report)return;const url=URL.createObjectURL(new Blob([analyticsCsv(report)],{type:'text/csv;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`atalhos-gratis-relatorio-${report.month}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const partners=report?.links.filter(link=>link.partner)||[],shortcuts=report?.links.filter(link=>!link.partner)||[];
  const maximum=Math.max(1,...(report?.daily.map(day=>Math.max(day.visits,day.clicks))||[]));
  return <section className="admin-card analytics-panel"><div className="admin-title"><div><h2><BarChart3 size={20} aria-hidden="true" />Estatísticas do portal</h2><p>Acompanhe o fluxo e apresente os resultados aos parceiros.</p></div><div className="analytics-actions"><button type="button" className="admin-secondary" disabled={busy} onClick={reload}><RefreshCw size={15} aria-hidden="true"/>Atualizar</button><button type="button" className="admin-primary" disabled={busy||!report} onClick={download}><Download size={15} aria-hidden="true"/>Baixar relatório CSV</button></div></div>
    <div className="analytics-period"><label htmlFor="analytics-month">Mês do relatório</label><input id="analytics-month" type="month" min="2020-01" max={currentAnalyticsMonth()} value={month} onChange={event=>{if(event.target.value){setBusy(true);setReport(null);setError('');setMonth(event.target.value);}}}/><span>Horário de Mato Grosso</span></div>
    {busy?<p role="status">Carregando estatísticas…</p>:error?<p role="alert" className="admin-message">{error}</p>:report&&<>
      <p className="analytics-start">Monitoramento desde {new Date(report.started_at).toLocaleString('pt-BR',{timeZone:'America/Cuiaba'})}. Meses anteriores à ativação não têm histórico.</p>
      <div className="analytics-metrics">{[['Visitas (sessões)',report.summary.visits],['Navegadores únicos',report.summary.visitors],['Cliques nos links',report.summary.clicks],['Cliques em parceiros',report.summary.partner_clicks],['Exibições de parceiros',report.summary.impressions],['Visitas pelo celular',report.summary.mobile_visits]].map(([label,value])=><article key={label}><span>{label}</span><strong>{count(Number(value))}</strong></article>)}</div>
      {!report.summary.visits&&!report.summary.clicks&&!report.summary.impressions&&<p className="admin-message">Ainda não há registros neste mês. Os dados aparecerão conforme o portal for utilizado.</p>}
      <h3>Resultados dos parceiros</h3><div className="analytics-table-wrap"><table><thead><tr><th>Parceiro</th><th>Exibições</th><th>Cliques</th><th>Taxa de cliques</th></tr></thead><tbody>{partners.map(link=><tr key={link.link_id}><th scope="row">{link.title}</th><td>{count(link.impressions)}</td><td>{count(link.clicks)}</td><td>{link.impressions?((link.clicks/link.impressions)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'—'}</td></tr>)}</tbody></table></div>{!partners.length&&<p>Nenhum parceiro com registros neste mês.</p>}
      <h3>Fluxo diário</h3><p className="analytics-legend"><span>Azul: visitas</span><span>Verde: cliques</span></p><div className="analytics-table-wrap analytics-daily"><table><thead><tr><th>Dia</th><th>Visitas</th><th>Cliques</th><th>Volume</th></tr></thead><tbody>{report.daily.map(day=><tr key={day.day}><th scope="row">{day.day.slice(8)}/{day.day.slice(5,7)}</th><td>{count(day.visits)}</td><td>{count(day.clicks)}</td><td><div className="analytics-bars" aria-hidden="true"><span style={{width:`${day.visits/maximum*100}%`}}/><span style={{width:`${day.clicks/maximum*100}%`}}/></div></td></tr>)}</tbody></table></div>
      <h3>Atalhos mais clicados</h3><div className="analytics-table-wrap analytics-ranking"><table><thead><tr><th>Atalho</th><th>Categoria</th><th>Cliques</th><th>WhatsApp</th></tr></thead><tbody>{shortcuts.map(link=><tr key={link.link_id}><th scope="row">{link.title}</th><td>{link.category}</td><td>{count(link.clicks)}</td><td>{count(link.whatsapp_clicks)}</td></tr>)}</tbody></table></div>{!shortcuts.length&&<p>Nenhum clique em atalhos neste mês.</p>}
      <h3>Evolução mensal</h3><div className="analytics-table-wrap"><table><thead><tr><th>Mês</th><th>Visitas</th><th>Cliques</th><th>Cliques em parceiros</th></tr></thead><tbody>{report.monthly.map(row=><tr key={row.month}><th scope="row">{row.month.slice(5)}/{row.month.slice(0,4)}</th><td>{count(row.visits)}</td><td>{count(row.clicks)}</td><td>{count(row.partner_clicks)}</td></tr>)}</tbody></table></div>
      <p className="admin-help analytics-method">Visitas são sessões por aba, renovadas após 30 minutos sem atividade. Navegadores únicos são estimativas, não pessoas. Uma exibição exige pelo menos metade do anúncio visível por 1 segundo e conta uma vez por sessão. Mobile indica telas de até 760 pixels de largura. Repetidos cliques podem superar o número de exibições. Cliques não significam vendas. Bloqueadores ou falhas de conexão podem impedir o registro. Não guardamos nomes, e-mails ou IPs dos visitantes.</p>
    </>}
  </section>;
}
