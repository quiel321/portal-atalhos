import fs from 'node:fs/promises';
import sharp from 'sharp';
const shield = '<path d="M32 52s18-9 18-23V16L32 9 14 16v13c0 14 18 23 18 23Z" fill="none" stroke="#65aaff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="m24 30 6 6 12-13" fill="none" stroke="#65aaff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1e3857"/>${shield}</svg>`;
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0c1424"/><stop offset="1" stop-color="#193756"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="1100" cy="50" r="310" fill="#65aaff" opacity=".05"/><rect x="72" y="68" width="1056" height="494" rx="30" fill="#141f32" stroke="#334b68" stroke-width="2"/><g transform="translate(118 108) scale(1.4)"><rect width="64" height="64" rx="16" fill="#1e3857"/>${shield}</g><text x="236" y="171" font-family="Arial,sans-serif" font-size="49" font-weight="700" fill="#edf4ff">Atalhos<tspan fill="#79b5ff">Grátis</tspan></text><text x="118" y="285" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#edf4ff">Seus acessos em um só lugar.</text><text x="118" y="354" font-family="Arial,sans-serif" font-size="29" fill="#acc0da">Sistemas, consultas e serviços de Mato Grosso.</text><rect x="118" y="408" width="530" height="58" rx="15" fill="#21436b"/><text x="143" y="447" font-family="Arial,sans-serif" font-size="24" fill="#d9eaff">Atalhos organizados • Acesso rápido</text><text x="118" y="522" font-family="Arial,sans-serif" font-size="24" fill="#79b5ff">www.atalhogratis.com.br</text></svg>`;
(async () => {
  await fs.writeFile('src/app/icon.svg', icon);
  await sharp(Buffer.from(icon)).resize(192,192).png().toFile('public/app-192.png');
  await sharp(Buffer.from(icon)).resize(512,512).png().toFile('public/app-512.png');
  const maskable = await sharp(Buffer.from(icon)).resize(320,320).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1e3857' } }).composite([{input:maskable,left:96,top:96}]).png().toFile('public/app-maskable.png');
  await sharp(Buffer.from(icon)).resize(180,180).png().toFile('src/app/apple-icon.png');
  const png = await sharp(Buffer.from(icon)).resize(32,32).png().toBuffer();
  const header = Buffer.alloc(22); header.writeUInt16LE(1,2); header.writeUInt16LE(1,4); header[6]=32; header[7]=32; header.writeUInt16LE(1,10); header.writeUInt16LE(32,12); header.writeUInt32LE(png.length,14); header.writeUInt32LE(22,18);
  await fs.writeFile('src/app/favicon.ico', Buffer.concat([header,png]));
  await sharp(Buffer.from(social)).png().toFile('public/compartilhar.png');
  console.log('Favicon, Apple icon e prévia 1200x630 gerados.');
})();
