import { ShieldCheck, HeartHandshake, HeartPulse, GraduationCap, Leaf, Search, Scale, BriefcaseBusiness, Monitor, Siren, Building2, Megaphone, MapPin, Fence } from 'lucide-react';
export default function DepartmentIcon({ title }: { title: string }) {
  const text = title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const Icon = /PENHA|REDE FRENTE|SERVICO SOCIAL|PSICOLOG/.test(text) ? HeartHandshake
    : /DSAU|SAUDE/.test(text) ? HeartPulse
    : /ESFAP|DEIP|PROERD|ESCOLAR/.test(text) ? GraduationCap
    : /BPMPA|PMPA|PM PA|RURAL/.test(text) ? Leaf
    : /RPMON/.test(text) ? Fence
    : /CORREGEDORIA|JURID|DJD/.test(text) ? Scale
    : /INTELIG|\bARI\b|\bALI\b|DACI/.test(text) ? Search
    : /CTI|SISTEM/.test(text) ? Monitor
    : /MARKETING|CCSMI/.test(text) ? Megaphone
    : /BOPE|ROTAM|TATICA|\bFT\b|PLANTAO|OF DIA|OFICIAL DE DIA|CPU|COPOM/.test(text) ? Siren
    : /ADM|SPOF|SALP|CEF|DGP|\bP[134]\b/.test(text) ? BriefcaseBusiness
    : /VTR/.test(text) ? MapPin
    : /CMT|COMAND|GAB|CR/.test(text) ? Building2 : ShieldCheck;
  return <div className="shortcut-image department-icon"><Icon size={23} aria-hidden="true" /></div>;
}
