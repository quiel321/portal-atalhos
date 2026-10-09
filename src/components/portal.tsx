'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, ShieldCheck, MessageCircle, Phone, ArrowRight, X, ChevronDown, Siren } from 'lucide-react';
import PortalImage from './portal-image';
import CategoryContent from './category-content';
import AppInstallPopup from './app-install-popup';
import DepartmentIcon from './department-icon';
import WhatsAppIcon from './whatsapp-icon';
import PixSupport from './pix-support';
import { compareLinks, defaultCategoryOrder, formatPhone, safeUrl, whatsappPhoneUrl, type Atalho } from '@/lib/atalhos';

const whatsapp = `https://wa.me/5565993059729?text=${encodeURIComponent('Olá, tenho interesse em anunciar minha marca no portal Atalhos Grátis!')}`;
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export default function Portal({ links, usingBackup, categoryOrder = defaultCategoryOrder }: { links: Atalho[]; usingBackup: boolean; categoryOrder?: string[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const shortcuts = links.filter((link) => link.categoria !== 'Propaganda');
  const emergencyCategories = new Set(shortcuts.filter(link=>link.url === 'tel:190' || link.origem_key?.startsWith('pm-pdf-')).map(link=>link.categoria));
  const partners = links.filter((link) => link.categoria === 'Propaganda').sort(compareLinks);
  const categories = [...new Set(shortcuts.map((link) => link.categoria))].sort((a, b) => {
    const ai = categoryOrder.indexOf(a), bi = categoryOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b, 'pt-BR');
  });
  const filtered = shortcuts.filter((link) => (category === 'Todas' || category === link.categoria) && (normalize(`${link.titulo} ${link.categoria} ${link.grupo || ''} ${formatPhone(link.url)}`).includes(normalize(search.trim())) || (/^[\d\s()+-]+$/.test(search.trim()) && search.replace(/\D/g,'').length >= 3 && link.url.replace(/\D/g,'').includes(search.replace(/\D/g,'')))));
  const clear = () => { setSearch(''); setCategory('Todas'); setExpandedCategories({}); };
  const isExpanded = (item: string) => expandedCategories[item] ?? (Boolean(search.trim()) || category !== 'Todas');

  return (
    <div className="portal-shell">
      <AppInstallPopup />
      <a className="contact-whatsapp" href={`https://wa.me/5565993059729?text=${encodeURIComponent('Olá! Gostaria de falar sobre o portal Atalhos Grátis.') }`} target="_blank" rel="noopener noreferrer" aria-label="Fale conosco pelo WhatsApp" title="Fale conosco"><WhatsAppIcon /><span>Fale conosco</span></a>
      <a href="#atalhos" className="skip-link">Ir para os atalhos</a>
      <div className="portal-container">
        <nav className="portal-nav" aria-label="Navegação principal">
          <Link href="/" className="brand"><span className="brand-icon"><ShieldCheck size={25} aria-hidden="true" /></span><span>Atalhos<span className="brand-highlight">Grátis</span></span></Link>
          <div className="nav-links"><a href={whatsapp} target="_blank" rel="noopener noreferrer" className="advertise-button"><MessageCircle size={17} aria-hidden="true" /><span>Anuncie seu negócio</span></a></div>
        </nav>
        <main>
          {usingBackup && <p className="service-notice" role="status">Não foi possível atualizar a lista agora. Você pode continuar usando os atalhos salvos.</p>}
          <div className="portal-columns">
            <section id="atalhos" className="directory" aria-labelledby="directory-title">
              <div className="section-heading"><div><h1 id="directory-title">Seus atalhos</h1></div><span className="total-count">{shortcuts.length} disponíveis</span></div>
              <div className="search-box"><Search size={21} aria-hidden="true" /><label htmlFor="shortcut-search" className="sr-only">Buscar atalho por nome ou categoria</label><input id="shortcut-search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setExpandedCategories({}); }} placeholder="Buscar um sistema ou serviço…" />{search && <button onClick={() => { setSearch(''); setExpandedCategories({}); }} aria-label="Limpar busca"><X size={18} /></button>}</div>
              <div className="category-selector"><label htmlFor="category-filter">Categoria</label><select id="category-filter" value={category} onChange={event=>{setCategory(event.target.value);setExpandedCategories({});}}>{['Todas', ...categories].map(item=><option key={item} value={item}>{item === 'Todas' ? 'Todas as categorias' : item}</option>)}</select></div>
              <PixSupport />
              <div className="directory-toolbar"><p className="result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'atalho encontrado' : 'atalhos encontrados'}</p><div className="accordion-actions"><button type="button" onClick={() => setExpandedCategories(Object.fromEntries(categories.map((item) => [item, true])))}>Expandir tudo</button><span aria-hidden="true">·</span><button type="button" onClick={() => setExpandedCategories(Object.fromEntries(categories.map((item) => [item, false])))}>Recolher tudo</button></div></div>
              <div className="category-grid">
                {categories.map((item) => {
                  const items = filtered.filter((link) => link.categoria === item).sort(compareLinks);
                  const emergency = item === 'Emergência' || emergencyCategories.has(item);
                  if (!items.length) return null;
                  return <section key={item} className={`category-card ${emergency ? 'emergency-card' : ''}`}><h2 className="category-heading"><button type="button" className="category-toggle" aria-expanded={isExpanded(item)} aria-controls={`category-links-${categories.indexOf(item)}`} onClick={() => setExpandedCategories((current) => ({ ...current, [item]: !isExpanded(item) }))}><span>{emergency && <Siren size={18} aria-hidden="true" />}{item}</span><span className="category-count">{items.length}</span><ChevronDown size={18} className="category-chevron" aria-hidden="true" /></button></h2><CategoryContent id={`category-links-${categories.indexOf(item)}`} expanded={isExpanded(item)}>{items.map((link) => {
                    const href = safeUrl(link.url, true);
                    const phone = href?.startsWith('tel:');
                    const chat = whatsappPhoneUrl(link.url, link.telefone_pendente);
                    return <div key={link.id} className={`shortcut-row ${chat ? 'has-whatsapp' : ''}`}><a href={href} target={phone ? undefined : '_blank'} rel={phone ? undefined : 'noopener noreferrer'} className="shortcut" aria-label={`${link.titulo} — ${phone ? 'ligar para ' + formatPhone(link.url) + (link.grupo ? ' · ' + link.grupo : '') : 'abrir em nova aba'}`}>{phone && !link.imagem_url ? <DepartmentIcon title={link.titulo} /> : <PortalImage key={link.imagem_url} src={link.imagem_url} title={link.titulo} />}<span className="shortcut-text"><strong>{link.titulo}</strong><span>{phone ? formatPhone(link.url) + ' · Toque para ligar' : 'Abrir serviço'}</span>{link.grupo && <span className="phone-unit">{link.grupo}</span>}{link.telefone_pendente && <span className="phone-pending">Conferir número</span>}</span>{phone ? <Phone size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</a>{chat && <a href={chat} target="_blank" rel="noopener noreferrer" className="phone-whatsapp" aria-label={`WhatsApp de ${link.titulo} · ${formatPhone(link.url)}${link.grupo ? ' · ' + link.grupo : ''}`} title="Conversar no WhatsApp, se o número estiver cadastrado"><WhatsAppIcon /></a>}</div>;
                  })}</CategoryContent></section>;
                })}
              </div>
              {!filtered.length && <div className="empty-state"><Search size={30} aria-hidden="true" /><h3>Nenhum atalho encontrado</h3><p>Tente outro nome ou selecione uma categoria diferente.</p><button onClick={clear}>Mostrar todos os atalhos</button></div>}
              <p className="directory-note">Os atalhos levam aos sites dos serviços. Alguns sistemas podem solicitar login ou acesso autorizado.</p>
            </section>
            <aside className="partners" aria-labelledby="partners-title"><h2 id="partners-title">Parceiros</h2>{partners.map((partner) => <a key={partner.id} href={safeUrl(partner.url)} target="_blank" rel="noopener noreferrer sponsored" className="partner-card"><PortalImage key={partner.imagem_url} src={partner.imagem_url} title={partner.titulo} banner /><div className="partner-caption"><strong>{partner.titulo}</strong><span>Conhecer <ArrowUpRight size={15} aria-hidden="true" /></span></div></a>)}<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="advertise-card"><MessageCircle size={27} aria-hidden="true" /><strong>Sua marca por aqui</strong><p>Divulgue seu negócio para quem usa o portal todos os dias.</p><span>Fale pelo WhatsApp <ArrowRight size={16} aria-hidden="true" /></span></a></aside>
          </div>
        </main>
        <footer className="portal-footer"><div><strong>Atalhos<span className="brand-highlight">Grátis</span></strong><p>© {new Date().getFullYear()} · Facilidade para a sua rotina.</p><p>Desenvolvido por Ezequiel Castro — Anal. e Desenvolvedor de Sistemas</p></div><Link href="/admin">Painel administrador <ArrowUpRight size={14} aria-hidden="true" /></Link></footer>
      </div>
    </div>
  );
}
