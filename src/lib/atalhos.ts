export interface Atalho {
  id: string | number;
  titulo: string;
  url: string;
  categoria: string;
  imagem_url: string | null;
}

export function safeUrl(value: string | null | undefined, allowPhone = false) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:' || (allowPhone && url.protocol === 'tel:')) return value;
  } catch { /* Endereços inválidos não são renderizados. */ }
  return undefined;
}
