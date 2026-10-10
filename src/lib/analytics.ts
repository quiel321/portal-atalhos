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
