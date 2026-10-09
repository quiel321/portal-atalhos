export interface AnalyticsReport {
  month: string; started_at: string;
  summary: {visits:number;visitors:number;clicks:number;partner_clicks:number;impressions:number;mobile_visits:number};
  daily: {day:string;visits:number;clicks:number}[];
  monthly: {month:string;visits:number;clicks:number;partner_clicks:number}[];
  links: {link_id:number;title:string;category:string;clicks:number;whatsapp_clicks:number;impressions:number;partner:boolean}[];
}
export function currentAnalyticsMonth() {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Cuiaba',year:'numeric',month:'2-digit'}).formatToParts(new Date());
  return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value;
}
export function analyticsCsv(report: AnalyticsReport) {
  // Neutralizes spreadsheet formulas in titles and category names.
  const cell=(value:unknown)=>'"'+String(value ?? '').replace(/^[\s]*[=+@-]/,match=>"'"+match).replace(/"/g,'""')+'"';
  const rows:unknown[][]=[['Atalhos Grátis — relatório mensal',report.month],['Início do monitoramento',report.started_at],['Métrica','Total'],['Visitas (sessões)',report.summary.visits],['Navegadores únicos',report.summary.visitors],['Cliques',report.summary.clicks],['Cliques em parceiros',report.summary.partner_clicks],['Exibições de parceiros',report.summary.impressions],[],['Atalho ou parceiro','Categoria','Cliques','Cliques no WhatsApp','Exibições de parceiros','Taxa de cliques (%)']];
  for(const link of report.links) rows.push([link.title,link.category,link.clicks,link.whatsapp_clicks,link.partner?link.impressions:'',link.partner&&link.impressions?((link.clicks/link.impressions)*100).toFixed(2):'']);
  rows.push([],['Dia','Visitas','Cliques']);for(const day of report.daily)rows.push([day.day,day.visits,day.clicks]);
  rows.push([],['Mês','Visitas','Cliques','Cliques em parceiros']);for(const month of report.monthly)rows.push([month.month,month.visits,month.clicks,month.partner_clicks]);
  rows.push([],['Metodologia','Visitas: sessões por aba, renovadas após 30 minutos sem atividade. Navegadores únicos são estimativas, não pessoas. Exibições: pelo menos metade do anúncio visível por 1 segundo, uma vez por sessão. Mobile: telas de até 760 pixels de largura. Cliques não significam vendas. Fuso: America/Cuiaba.']);
  return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
