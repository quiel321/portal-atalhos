export interface Atalho {
  id: string | number;
  titulo: string;
  url: string;
  categoria: string;
  imagem_url: string | null;
  posicao?: number;
  grupo?: string | null;
  telefone_pendente?: boolean;
  origem_key?: string | null;
}

export function safeUrl(value: string | null | undefined, allowPhone = false) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:' || (allowPhone && url.protocol === 'tel:')) return value;
  } catch { /* Endereços inválidos não são renderizados. */ }
  return undefined;
}

// Aceita domínios digitados sem protocolo, mantendo apenas os esquemas permitidos.
export function normalizeEntryUrl(value: string, allowPhone = false) {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return undefined;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : trimmed.startsWith('//') ? 'https:' + trimmed : 'https://' + trimmed;
  if (!safeUrl(candidate, allowPhone)) return undefined;
  try {
    const parsed = new URL(candidate);
    if (parsed.username || parsed.password) return undefined;
    if (!hasScheme && !parsed.hostname.includes('.')) return undefined;
    return parsed.href;
  } catch { return undefined; }
}

export const defaultCategoryOrder = ['Emergência', 'Sistemas e Consultas', 'Sistemas Policiais', 'Administrativo'];
export function compareLinks(a: Atalho, b: Atalho) {
  return (a.posicao ?? 999999) - (b.posicao ?? 999999) || a.titulo.localeCompare(b.titulo, 'pt-BR') || String(a.id).localeCompare(String(b.id));
}
export function formatPhone(url: string) {
  const number = url.replace(/^tel:/, '');
  const match = number.match(/^\+55(\d{2})(\d{5})(\d{4})$/);
  return match ? '(' + match[1] + ') ' + match[2] + '-' + match[3] : number;
}
