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
