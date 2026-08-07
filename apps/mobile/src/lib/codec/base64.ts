/**
 * Dekode Base64 menjadi byte mentah.
 *
 * Sengaja tidak memakai `atob` global. `atob` memang tersedia di Hermes maupun
 * di JSC pada React Native 0.74, tetapi ketersediaannya bergantung pada polyfill
 * runtime dan bukan bagian dari kontrak Expo SDK 51. Satu-satunya pemakai fungsi
 * ini adalah TrashScan, yang harus berjalan sama persis di ponsel dan di Jest;
 * dua puluh baris di sini menghilangkan seluruh ketergantungan itu.
 *
 * Mengembalikan `null` bila masukan bukan Base64 yang sah — pemanggil wajib
 * memperlakukannya sebagai kegagalan, bukan sebagai byte kosong.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Peta karakter → nilai 6-bit; -1 berarti karakter tidak sah. */
const LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) {
    table[ALPHABET.charCodeAt(i)] = i;
  }
  // Varian URL-safe ikut diterima; beberapa pustaka gambar mengeluarkannya.
  table['-'.charCodeAt(0)] = 62;
  table['_'.charCodeAt(0)] = 63;
  return table;
})();

export function base64ToBytes(input: string): Uint8Array | null {
  if (typeof input !== 'string' || input.length === 0) return null;

  // Buang spasi/baris baru yang kadang disisipkan saat string dipindahkan.
  let clean = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') continue;
    if (ch === '=') break;
    clean += ch;
  }
  if (clean.length === 0) return null;

  const outLength = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(outLength);

  let buffer = 0;
  let bits = 0;
  let written = 0;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const value = code < 128 ? LOOKUP[code]! : -1;
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = (buffer >> bits) & 0xff;
    }
  }

  return written === outLength ? out : out.subarray(0, written);
}
