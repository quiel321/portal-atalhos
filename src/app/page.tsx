import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function Home() {
  const { data: links, error } = await supabase
    .from('atalhos_links')
    .select('*')
    .order('titulo', { ascending: true });

  if (error) return <div className="text-red-500 text-center mt-10">Erro: {error.message}</div>;

  // SEPARANDO OS ATALHOS NORMAIS DAS PROPAGANDAS
  const atalhos = links?.filter((l: any) => l.categoria !== 'Propaganda') || [];
  const propagandas = links?.filter((l: any) => l.categoria === 'Propaganda') || [];
  const categoriasUnicas = Array.from(new Set(atalhos.map((l: any) => l.categoria)));

  // Mensagem pré-programada para o WhatsApp
  const mensagemWhatsapp = "Olá, tenho interesse em anunciar minha marca no portal Atalhos Grátis!";
  const linkWhatsapp = `https://wa.me/5565993059729?text=${encodeURIComponent(mensagemWhatsapp)}`;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-3 md:p-5 pt-2 md:pt-4 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* NAVBAR ATUALIZADA */}
        <nav className="flex items-center justify-between bg-[#1e293b]/50 border border-slate-700/50 rounded-2xl p-3 px-5 mb-8 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span className="text-xl font-bold text-white tracking-tight">Atalhos<span className="text-blue-500">Grátis</span></span>
          </Link>
          
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="hidden md:block text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">
              Início
            </Link>
            
            {/* BOTÃO WHATSAPP */}
            <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold py-2 px-3 md:px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="hidden sm:block">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Anuncie seu Negócio
            </a>
          </div>
        </nav>

        {/* CABEÇALHO COMPACTO */}
        <header className="mb-6 text-center">
         <p className="text-sm text-slate-400">Sistemas e consultas operacionais rápidos.</p>
        </header>

        {/* ESTRUTURA PRINCIPAL: LINKS + PROPAGANDA */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LADO ESQUERDO: ATALHOS */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoriasUnicas.map((categoria) => (
              <section key={categoria as string} className="bg-[#1e293b] border border-slate-700/50 p-5 rounded-3xl shadow-lg h-fit">
                <h2 className="text-xl font-bold text-slate-100 mb-5 border-b border-slate-700/80 pb-3">
                  {categoria as string}
                </h2>
                
                <div className="flex flex-col gap-3">
                  {atalhos.filter((l: any) => l.categoria === categoria).map((link: any) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="group relative flex items-center gap-4 p-3 rounded-2xl bg-[#0f172a] border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 z-10 overflow-hidden relative">
                        {link.imagem_url ? (
                          <Image src={link.imagem_url} alt={link.titulo} fill className="object-cover" sizes="48px" />
                        ) : (
                          <span className="text-xs text-slate-400">Img</span>
                        )}
                      </div>

                      <span className="font-semibold text-slate-300 group-hover:text-blue-400 transition-colors duration-300 z-10 line-clamp-2">
                        {link.titulo}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* LADO DIREITO: BANNERS DE PROPAGANDA */}
          <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            {/* Título da Seção de Parceiros */}
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-2">Parceiros</h3>

            {/* Mapeamento dos Banners Ativos (Tamanho padronizado e horizontal) */}
            {propagandas.map((banner: any) => (
              <a key={banner.id} href={banner.url} target="_blank" rel="noopener noreferrer" className="block relative w-full h-32 rounded-3xl overflow-hidden border border-slate-700/50 hover:border-blue-500 transition-all shadow-lg group bg-[#0f172a]">
                {banner.imagem_url ? (
                  <Image src={banner.imagem_url} alt={banner.titulo} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 320px" unoptimized />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">{banner.titulo}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-transparent to-transparent opacity-90 flex items-end p-4">
                  <span className="text-white font-bold text-xs tracking-wide truncate">{banner.titulo}</span>
                </div>
              </a>
            ))}

            {/* Espaço Disponível (Tamanho padronizado igual aos banners acima) */}
            <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="block w-full h-32 rounded-3xl overflow-hidden border-2 border-slate-700/50 border-dashed hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group flex flex-col items-center justify-center text-slate-500 cursor-pointer mt-2">
              <span className="font-semibold text-sm group-hover:text-emerald-400 transition-colors mb-1">Seu Banner Aqui!</span>
              <p className="text-xs text-center opacity-60 group-hover:opacity-100 transition-opacity">Clique e anuncie sua marca.</p>
            </a>

          </aside>

        </div>

        {/* RODAPÉ ATUALIZADO */}
        <footer className="mt-20 border-t border-slate-800 pt-8 pb-10 flex flex-col items-center gap-2 text-sm text-slate-500">
          <Link href="/novo-link" className="text-slate-600 hover:text-blue-500 transition-colors font-medium mb-2">
            Área Restrita: Gerenciar Atalhos
          </Link>
          <div className="text-center">
            <p>&copy; {new Date().getFullYear()} Atalhos Grátis. Todos os direitos reservados.</p>
            <p className="text-xs mt-1 opacity-50">Desenvolvido por Ezequiel Castro - Anal. e Desenvolvedor de Sistemas</p>
          </div>
        </footer>

      </div>
    </main>
  );
}