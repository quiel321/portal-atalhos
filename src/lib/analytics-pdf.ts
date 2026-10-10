import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { AnalyticsReport } from './analytics';
const clean=(text:string)=>text.normalize('NFC').replace(/[\u2010-\u2015]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\x20-\xff\n]/g,'');
const count=(n:number)=>n.toLocaleString('pt-BR');
const dateKey=(date:Date)=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Cuiaba',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(key=>parts.find(part=>part.type===key)!.value).join('-');};
const colors=['#2876c7','#168564','#8357bc'];
export function createAnalyticsPdf(report:AnalyticsReport) {
  const doc=new jsPDF({unit:'mm',format:'a4'});
  doc.setProperties({title:`Atalhos Grátis - relatório ${report.month}`,author:'Atalhos Grátis',subject:'Visitas e cliques do portal'});
  const today=dateKey(new Date()),started=dateKey(new Date(report.started_at));
  const daily=report.daily.filter(row=>row.day>=started&&row.day<=today);
  const monthly=report.monthly.filter(row=>row.month>=started.slice(0,7)&&row.month<=today.slice(0,7));
  const period=new Date(report.month+'-15T12:00:00Z').toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'America/Cuiaba'});
  const text=(value:string,x:number,y:number,size=10,color='#1b2b40',bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);doc.text(clean(value),x,y);};
  text('Relatório de desempenho',16,44,18,'#172d48',true);
  text(period.charAt(0).toUpperCase()+period.slice(1),16,51,11);
  text('Monitoramento desde '+new Date(report.started_at).toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'}),16,57,8,'#58697b');
  const metrics:[string,number][]=[['Visitas (sessões)',report.summary.visits],['Navegadores únicos',report.summary.visitors],['Cliques nos links',report.summary.clicks],['Cliques em parceiros',report.summary.partner_clicks],['Exibições de parceiros',report.summary.impressions],['Visitas pelo celular',report.summary.mobile_visits]];
  metrics.forEach(([name,total],index)=>{const x=16+(index%3)*60,y=63+Math.floor(index/3)*27;doc.setFillColor('#f0f5fa');doc.roundedRect(x,y,58,24,2,2,'F');text(name,x+4,y+7,8,'#58697b');text(count(total),x+4,y+18,18,'#172d48',true);});
  function chart(title:string,rows:{label:string;values:number[]}[],y:number,bars=false){
    text(title,16,y,12,'#172d48',true);
    const names=bars?['Visitas','Cliques','Parceiros']:['Visitas','Cliques'];
    names.forEach((name,index)=>{doc.setFillColor(colors[index]);doc.circle(18+index*38,y+6,1,'F');text(name,21+index*38,y+7,8,'#58697b');});
    if(!rows.length){text('Sem monitoramento neste período.',16,y+28,10,'#58697b');return;}
    const left=28,top=y+14,width=164,height=39,max=Math.max(1,...rows.flatMap(row=>row.values));
    const raw=max/4,unit=10**Math.floor(Math.log10(raw)),step=Math.max(1,([1,2,5,10].find(n=>n>=raw/unit)||10)*unit),ceiling=step*4;
    const py=(value:number)=>top+height*(1-value/ceiling);
    for(let index=0;index<=4;index++){doc.setDrawColor('#dce5ee');doc.setLineWidth(.2);doc.line(left,py(index*step),left+width,py(index*step));text(new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(index*step),16,py(index*step)+1,7,'#58697b');}
    const px=(i:number)=>bars?left+width*(i+.5)/rows.length:rows.length===1?left+width/2:left+width*i/(rows.length-1);
    rows.forEach((row,index)=>{
      if(index%Math.max(1,Math.ceil((rows.length-1)/6))===0||index===rows.length-1){doc.setFontSize(7);doc.setTextColor('#58697b');doc.text(row.label,px(index),top+height+5,{align:'center'});}
      row.values.forEach((value,series)=>{doc.setDrawColor(colors[series]);doc.setFillColor(colors[series]);doc.setLineWidth(.6);if(bars){const group=Math.min(12,width/rows.length*.7),bar=group/3;doc.rect(px(index)-group/2+series*bar,py(value),bar*.85,top+height-py(value),'F');}else{if(index>0)doc.line(px(index-1),py(rows[index-1].values[series]),px(index),py(value));if(rows.length<=10)doc.circle(px(index),py(value),.8,'F');}});
    });
  }
  chart('Fluxo diário',daily.map(row=>({label:row.day.slice(8)+'/'+row.day.slice(5,7),values:[row.visits,row.clicks]})),125);
  chart('Evolução mensal',monthly.map(row=>({label:row.month.slice(5)+'/'+row.month.slice(2,4),values:[row.visits,row.clicks,row.partner_clicks]})),198,true);
  text('O dia e o mês atuais são parciais. Valores registrados, sem projeções.',16,267,8,'#58697b');
  doc.addPage();let cursor=44;
  function table(title:string,head:string[],body:(string|number)[][]){
    if(cursor>245){doc.addPage();cursor=44;}
    text(title,16,cursor,12,'#172d48',true);
    if(!body.length){text('Sem registros no período.',16,cursor+8,9,'#58697b');cursor+=22;return;}
    autoTable(doc,{startY:cursor+5,head:[head],body:body.map(row=>row.map(cell=>typeof cell==='string'?clean(cell):count(cell))),margin:{left:16,right:16,top:40,bottom:21},rowPageBreak:'avoid',styles:{font:'helvetica',fontSize:8,cellPadding:2.5,textColor:'#23364c',lineColor:'#e2e9f0',overflow:'linebreak'},headStyles:{fillColor:'#203d5c',textColor:'#ffffff',fontStyle:'bold'},alternateRowStyles:{fillColor:'#f2f6fa'}});
    cursor=(doc as jsPDF&{lastAutoTable:{finalY:number}}).lastAutoTable.finalY+14;
  }
  table('Resultados dos parceiros',['Parceiro','Exibições','Cliques','Taxa de cliques'],report.links.filter(link=>link.partner).map(link=>[link.title,link.impressions,link.clicks,link.impressions?(link.clicks/link.impressions*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%':'-']));
  table('Atalhos mais clicados',['Atalho','Categoria','Cliques','WhatsApp'],report.links.filter(link=>!link.partner).map(link=>[link.title,link.category,link.clicks,link.whatsapp_clicks]));
  table('Dados diários',['Dia','Visitas','Cliques'],daily.map(row=>[row.day.split('-').reverse().join('/'),row.visits,row.clicks]));
  table('Dados mensais',['Mês','Visitas','Cliques','Cliques em parceiros'],monthly.map(row=>[row.month.slice(5)+'/'+row.month.slice(0,4),row.visits,row.clicks,row.partner_clicks]));
  if(cursor>230){doc.addPage();cursor=44;}
  text('Como os dados são contados',16,cursor,12,'#172d48',true);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor('#58697b');
  doc.text(doc.splitTextToSize('Visitas são sessões por aba, renovadas após 30 minutos sem atividade. Navegadores únicos são estimativas, não pessoas. Exibições exigem metade do anúncio visível por 1 segundo e contam uma vez por sessão. Mobile indica telas de até 760 pixels. Cliques em parceiros fazem parte do total de cliques; cliques não significam vendas. Bloqueadores e falhas de conexão podem impedir registros. Não guardamos nomes, e-mails ou IPs dos visitantes. Fuso: America/Cuiaba. Meses anteriores à ativação não têm histórico.',178),16,cursor+8);
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFillColor('#172d48');doc.roundedRect(12,10,186,22,2,2,'F');text('Atalhos Grátis',18,20,15,'#ffffff',true);text('ESTATÍSTICAS DO PORTAL',18,27,8,'#b8d3ed');text(report.month,170,23,10,'#ffffff');doc.setDrawColor('#dce5ee');doc.line(16,280,194,280);text('www.atalhogratis.com.br | Gerado em '+new Date().toLocaleString('pt-BR',{timeZone:'America/Cuiaba'}),16,286,7,'#58697b');text(`${page} / ${pages}`,184,286,7,'#58697b');}
  return doc;
}
