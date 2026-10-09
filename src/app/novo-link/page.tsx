"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import imageCompression from "browser-image-compression";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function NovoLink() {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [categoria, setCategoria] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isPropaganda, setIsPropaganda] = useState(false); // <-- Estado para saber se é banner
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvarLink = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensagem("Processando e salvando...");
    setSalvando(true);

    let imagemUrlFinal = "";

    if (arquivo) {
      try {
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 800, // Aumentei um pouco para a qualidade do banner ficar boa
          useWebWorker: true,
          fileType: "image/webp"
        };

        const arquivoComprimido = await imageCompression(arquivo, options);
        const nomeArquivo = `${Date.now()}-foto.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from("logos-portalatalhos")
          .upload(nomeArquivo, arquivoComprimido, { contentType: "image/webp", cacheControl: "3600" });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("logos-portalatalhos")
          .getPublicUrl(nomeArquivo);

        imagemUrlFinal = publicUrlData.publicUrl;
      } catch (error: unknown) {
        setMensagem("Erro na imagem: " + (error instanceof Error ? error.message : "Não foi possível enviar o arquivo."));
        setSalvando(false);
        return;
      }
    }

    // Se a caixinha estiver marcada, ele força a categoria a ser "Propaganda"
    const categoriaFinal = isPropaganda ? "Propaganda" : categoria;

    const { error } = await supabase
      .from("atalhos_links")
      .insert([{ titulo, url, categoria: categoriaFinal, imagem_url: imagemUrlFinal }]);

    if (error) {
      setMensagem("Erro ao salvar: " + error.message);
    } else {
      setMensagem(isPropaganda ? "✅ Banner salvo com sucesso!" : "✅ Atalho salvo com sucesso!");
      setTitulo("");
      setUrl("");
      setCategoria("");
      setArquivo(null);
      setIsPropaganda(false);
      const fileInput = document.getElementById("foto") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
    
    setSalvando(false);
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 font-sans flex items-center justify-center">
      <div className="max-w-md w-full bg-[#1e293b] border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-xl">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Cadastrar atalho ou anúncio</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-400 text-sm font-medium">
            ← Voltar ao Portal
          </Link>
        </div>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">Preencha o nome, o endereço completo do site e a categoria. Para anúncios, marque a opção abaixo e envie a imagem do banner.</p><form onSubmit={salvarLink} className="flex flex-col gap-4">
          
          {/* MÁGICA: A CAIXINHA DE SELEÇÃO */}
          <div className="flex items-center gap-3 bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/30 hover:border-blue-500/60 transition-all">
            <input 
              type="checkbox" 
              id="isPropaganda"
              checked={isPropaganda}
              onChange={(e) => setIsPropaganda(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
            <label htmlFor="isPropaganda" className="text-sm font-semibold text-blue-400 cursor-pointer select-none">
              Cadastrar como anúncio de parceiro
            </label>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1 ml-1">{isPropaganda ? "Nome da Empresa/Patrocinador" : "Título do Link"}</label>
            <input required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1 ml-1">{isPropaganda ? "Link do Site da Empresa" : "URL (Endereço do Site)"}</label>
            <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-blue-500 outline-none transition-all" />
          </div>

          {/* O campo de Categoria some se for propaganda, pois o sistema já sabe que é */}
          {!isPropaganda && (
            <div>
              <label className="block text-sm text-slate-400 mb-1 ml-1">Categoria do Atalho</label>
              <input required type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-slate-200 focus:border-blue-500 outline-none transition-all" />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1 ml-1">{isPropaganda ? "Anexar Imagem do Banner (Obrigatório)" : "Anexar Foto/Logo (Opcional)"}</label>
            <input id="foto" type="file" accept="image/*" required={isPropaganda} onChange={(e) => setArquivo(e.target.files ? e.target.files[0] : null)} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-2 text-slate-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500" />
          </div>

          <button type="submit" disabled={salvando} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl mt-4 transition-all">
            {salvando ? "Processando..." : (isPropaganda ? "Publicar Banner" : "Cadastrar Atalho")}
          </button>

          {mensagem && (
            <p className={`text-center text-sm mt-2 font-medium p-2 rounded-lg ${mensagem.includes("Erro") ? "text-red-400 bg-red-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>{mensagem}</p>
          )}
        </form>
      </div>
    </main>
  );
}
