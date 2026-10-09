import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const field = (id, value) => id + String(value.length).padStart(2, '0') + value;
function checksum(text) {
  let crc = 0xffff;
  for (const byte of Buffer.from(text, 'utf8')) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
// Known static Pix example from Banco Central's initiation standards manual.
assert.equal(checksum('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304'), '1D3D');
const key = '27145274000125';
const recipient = '27.145.274 GEICIANE MARTINS DE ASSIS CASTRO';
const city = 'Campos de Júlio - MT';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const body = field('00', '01') + field('26', field('00', 'br.gov.bcb.pix') + field('01', key)) + field('52', '0000') + field('53', '986') + field('58', 'BR') + field('59', normalize('GEICIANE MARTINS DE ASSIS').slice(0, 25)) + field('60', normalize('Campos de Júlio').slice(0, 15)) + field('62', field('05', '***')) + '6304';
const payload = body + checksum(body);
writeFileSync('src/data/pix-support.json', JSON.stringify({key, recipient, city, payload}, null, 2) + '\n');
await QRCode.toFile('public/pix-apoio.png', payload, {width: 480, margin: 4, errorCorrectionLevel: 'M', color:{dark:'#000000', light:'#ffffff'}});
console.log('QR Code Pix gerado; CRC validado com exemplo oficial.');
