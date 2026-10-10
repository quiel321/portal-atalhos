'use client';
import { useEffect, useId, useRef, useState } from 'react';
import AdminCollapse from './admin-collapse';
import { X } from 'lucide-react';
interface Point {date:string;visits:number;clicks:number;partner_clicks?:number}
interface Props {title:string;points:Point[];monthly?:boolean;note:string;onPeriodSelect?:(month:string)=>void}
const series=[{key:'visits' as const,label:'Visitas',color:'#70b5ff'},{key:'clicks' as const,label:'Cliques',color:'#67dfb1'},{key:'partner_clicks' as const,label:'Cliques em parceiros',color:'#c5a4ff'}];
const value=(n:number)=>n.toLocaleString('pt-BR');
const label=(date:string,monthly:boolean)=>monthly?date.slice(5,7)+'/'+date.slice(2,4):date.slice(8,10)+'/'+date.slice(5,7);
export default function TrafficChart({title,points,monthly=false,note,onPeriodSelect}:Props){
  const container=useRef<HTMLDivElement>(null),targets=useRef<(SVGRectElement|null)[]>([]);
  const [width,setWidth]=useState(800),[selected,setSelected]=useState(''),[hidden,setHidden]=useState<string[]>([]);
  const dialog=useRef<HTMLDialogElement>(null);
  const [detail,setDetail]=useState<Point|null>(null),[metric,setMetric]=useState('visits');
  const previous=detail?points[points.findIndex(point=>point.date===detail.date)-1]:undefined;
  const descriptions:Record<string,string>={visits:'Sessões de navegação registradas. Uma sessão é renovada após 30 minutos sem atividade.',clicks:'Toques ou cliques nos atalhos, incluindo ligações, WhatsApp e anúncios. Não representam vendas.',partner_clicks:'Cliques nos anúncios dos parceiros. Esta contagem já faz parte do total de cliques.'};
  function inspect(index:number){choose(index);setDetail(points[index]);setMetric('visits');targets.current[index]?.focus();dialog.current?.showModal();}
  const id=useId().replace(/:/g,'');
  useEffect(()=>{const element=container.current;if(!element)return;const resize=()=>setWidth(Math.max(260,element.clientWidth));resize();if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);}const observer=new ResizeObserver(resize);observer.observe(element);return()=>observer.disconnect();},[]);
  const activeSeries=(monthly?series:series.slice(0,2)).filter(item=>!hidden.includes(item.key));
  const active=points.find(point=>point.date===selected)||points.at(-1);
  const maximum=Math.max(1,...points.flatMap(point=>activeSeries.map(item=>point[item.key]||0)));
  const raw=maximum/4,unit=10**Math.floor(Math.log10(raw)),factor=[1,2,5,10].find(n=>n>=raw/unit)||10;
  const step=Math.max(1,factor*unit),top=step*4,height=260,left=44,right=16,bottom=38,upper=20;
  const plotWidth=width-left-right,plotHeight=height-bottom-upper;
  const x=(index:number)=>monthly?left+plotWidth*(index+0.5)/Math.max(1,points.length):points.length===1?left+plotWidth/2:left+plotWidth*index/Math.max(1,points.length-1);
  const y=(n:number)=>upper+plotHeight*(1-n/top);
  const tick=Math.max(1,Math.ceil((points.length-1)/(width<500?3:6)));
  const cellWidth=plotWidth/Math.max(1,points.length),groupWidth=Math.min(72,cellWidth*0.7),barWidth=Math.max(2,(groupWidth-6)/activeSeries.length);
  function choose(index:number,focus=false){setSelected(points[index].date);if(focus)targets.current[index]?.focus();}
  return <AdminCollapse title={title} className="traffic-chart"><p className="traffic-note">{note}</p><div className="traffic-legend">{(monthly?series:series.slice(0,2)).map(item=><button key={item.key} type="button" aria-pressed={!hidden.includes(item.key)} disabled={!hidden.includes(item.key)&&activeSeries.length===1} onClick={()=>setHidden(current=>current.includes(item.key)?current.filter(key=>key!==item.key):[...current,item.key])}><i style={{background:item.color}} aria-hidden="true"/>{item.label}</button>)}</div>
    {active&&<div className="traffic-selection"><strong>{label(active.date,monthly)}</strong>{activeSeries.map(item=><span key={item.key}><i style={{background:item.color}} aria-hidden="true"/>{item.label}: <b>{value(active[item.key]||0)}</b></span>)}</div>}
    <div className="traffic-canvas" ref={container}>{points.length?<svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${title}: ${monthly?'colunas mensais':'linhas diárias'} de visitas e cliques`}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#70b5ff" stopOpacity="0.23"/><stop offset="100%" stopColor="#70b5ff" stopOpacity="0.01"/></linearGradient></defs>
      {[0,1,2,3,4].map(index=><g key={index}><line x1={left} x2={width-right} y1={y(index*step)} y2={y(index*step)} className="traffic-grid"/><text x={left-10} y={y(index*step)+4} textAnchor="end">{new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(index*step)}</text></g>)}
      {points.map((point,index)=>(index%tick===0||index===points.length-1)&&<text key={point.date} x={x(index)} y={height-12} textAnchor="middle">{label(point.date,monthly)}</text>)}
      {!monthly&&activeSeries.map(item=>{const coordinates=points.map((point,index)=>`${x(index)},${y(point[item.key]||0)}`);return <g key={item.key}>{item.key==='visits'&&points.length>1&&<path d={`M${coordinates.join(' L')} L${x(points.length-1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${id})`}/>}<polyline points={coordinates.join(' ')} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{points.map((point,index)=>point.date===active?.date&&<circle key={point.date} cx={x(index)} cy={y(point[item.key]||0)} r="4" fill={item.color} stroke="#101c2e" strokeWidth="2"/>)}</g>;})}
      {monthly&&points.map((point,index)=><g key={point.date}>{activeSeries.map((item,si)=><rect key={item.key} x={x(index)-groupWidth/2+si*(barWidth+3)} y={y(point[item.key]||0)} width={barWidth} height={y(0)-y(point[item.key]||0)} rx="3" fill={item.color} opacity={active?.date===point.date?1:0.7}/>)}</g>)}
      {active&&<line x1={x(points.indexOf(active))} x2={x(points.indexOf(active))} y1={upper} y2={y(0)} className="traffic-cursor"/>}
      {points.map((point,index)=>{const half=monthly?cellWidth/2:points.length===1?plotWidth/2:plotWidth/(points.length-1)/2;const start=Math.max(left,x(index)-half),end=Math.min(width-right,x(index)+half);return <rect key={point.date} ref={element=>{targets.current[index]=element;}} x={start} y={upper} width={end-start} height={plotHeight} fill="transparent" role="button" tabIndex={active?.date===point.date?0:-1} aria-label={`${label(point.date,monthly)}: ${activeSeries.map(item=>`${value(point[item.key]||0)} ${item.label.toLowerCase()}`).join(', ')}`} onPointerEnter={()=>choose(index)} onFocus={()=>choose(index)} onClick={()=>inspect(index)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();inspect(index);return;}const next=event.key==='ArrowLeft'?Math.max(0,index-1):event.key==='ArrowRight'?Math.min(points.length-1,index+1):event.key==='Home'?0:event.key==='End'?points.length-1:null;if(next!==null){event.preventDefault();choose(next,true);}}}/>;})}
    </svg>:<p className="traffic-empty">Sem monitoramento neste período. O histórico começa na data de ativação.</p>}</div>
    {points.length>0&&<><p className="traffic-hint">Clique ou toque para detalhar. Setas do teclado navegam pelos períodos.</p><details className="traffic-data"><summary>Ver dados em tabela</summary><div className="analytics-table-wrap"><table><thead><tr><th>{monthly?'Mês':'Dia'}</th>{activeSeries.map(item=><th key={item.key}>{item.label}</th>)}</tr></thead><tbody>{points.map(point=><tr key={point.date}><th scope="row">{label(point.date,monthly)}</th>{activeSeries.map(item=><td key={item.key}>{value(point[item.key]||0)}</td>)}</tr>)}</tbody></table></div></details></>}
    <dialog ref={dialog} className="chart-dialog" aria-labelledby={id+'-detail'} onClose={()=>setDetail(null)} onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}>
      <button type="button" className="chart-dialog-close" aria-label="Fechar detalhes" onClick={()=>dialog.current?.close()}><X size={18}/></button>
      {detail&&<><h3 id={id+'-detail'}>Detalhes de {monthly?detail.date.slice(5)+'/'+detail.date.slice(0,4):detail.date.split('-').reverse().join('/')}</h3><p>Selecione um índice para entender a contagem.</p><div className="chart-detail-metrics">{(monthly?series:series.slice(0,2)).map(item=>{const current=detail[item.key]||0,before=previous?.[item.key]||0;return <button key={item.key} type="button" aria-pressed={metric===item.key} onClick={()=>setMetric(item.key)}><span style={{color:item.color}}>{item.label}</span><strong>{value(current)}</strong><small>{!previous?'Primeiro período disponível':before===0?current===0?'Sem variação':'Sem base percentual':((current-before)/before*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% vs. '+label(previous.date,monthly)}</small></button>;})}</div><p className="chart-metric-description">{descriptions[metric]}</p><p className="chart-partial-note">O dia e o mês atuais podem estar incompletos. Compare períodos parciais com cautela.</p>{monthly&&onPeriodSelect&&<button type="button" className="admin-primary" onClick={()=>{dialog.current?.close();onPeriodSelect(detail.date);}}>Abrir relatório deste mês</button>}</>}
    </dialog>
  </AdminCollapse>;
}
