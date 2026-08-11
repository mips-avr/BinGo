/**
 * Dekoder PNG murni JavaScript untuk TrashScan.
 *
 * MENGAPA BERKAS INI ADA
 * ----------------------
 * Versi sebelumnya mengambil keluaran `expo-image-manipulator`, mendekode
 * Base64-nya, lalu memperlakukan byte hasilnya seolah-olah buffer piksel RGBA.
 * Itu keliru: isi sebuah berkas PNG adalah header, lalu blok IDAT yang
 * dimampatkan dengan DEFLATE. Rata-rata warna, hue, simpangan baku luminansi,
 * dan kerapatan tepi yang dihitung dari byte tersebut bukan statistik foto,
 * melainkan statistik aliran byte terkompresi — angka yang terlihat meyakinkan
 * tetapi tidak berhubungan sama sekali dengan benda yang difoto.
 *
 * Ada dua jalan keluar yang jujur: berhenti menghitung fitur warna sama sekali,
 * atau benar-benar mendekode gambarnya. Berkas ini memilih yang kedua.
 *
 * MENGAPA PNG, BUKAN JPEG
 * -----------------------
 * PNG dipilih karena lossless dan dekodernya muat dalam satu berkas: DEFLATE
 * (RFC 1951) plus lima jenis filter baris (RFC 2083). Dekoder JPEG baseline
 * memerlukan Huffman, dekuantisasi, IDCT 8×8, dan upsampling kroma — sepuluh
 * kali lipat kode, dan artefak lossy-nya justru mengotori statistik warna yang
 * ingin kita ukur. Karena gambar sudah diperkecil menjadi 64×64 sebelum
 * dikodekan, ukuran berkas PNG-nya kecil dan pemampatannya cepat.
 *
 * BATASAN YANG DISENGAJA
 * ----------------------
 * Fungsi ini hanya menangani PNG kedalaman 8 bit non-interlaced (color type
 * 0/2/3/4/6) — persis yang dikeluarkan `expo-image-manipulator` di Android dan
 * iOS. Untuk bentuk lain ia mengembalikan `null`, dan TrashScan menampilkan
 * "belum yakin" alih-alih menebak. Menebak dari data yang tidak terbaca adalah
 * kesalahan yang membuat berkas ini harus ditulis ulang.
 */

// ─── Inflate (DEFLATE, RFC 1951) ─────────────────────────────

const MAX_BITS = 15;

/** Tabel panjang salinan untuk simbol 257–285. */
const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258,
];
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
];
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
];
/** Urutan baku pembacaan panjang kode untuk alfabet code-length. */
const CLEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

interface Huffman {
  /** counts[n] = banyaknya simbol yang kodenya sepanjang n bit. */
  counts: Int32Array;
  /** Simbol diurutkan menaik menurut panjang kode, lalu menurut nilai simbol. */
  symbols: Int32Array;
}

/**
 * Menyusun tabel Huffman kanonik dari daftar panjang kode.
 *
 * Memakai bentuk counts/symbols seperti `puff` rujukan zlib: hemat memori dan
 * tidak memerlukan pembentukan tabel pencarian, yang penting karena dekode
 * hanya berjalan sekali per pemindaian.
 */
function buildHuffman(lengths: Uint8Array, count: number): Huffman {
  const counts = new Int32Array(MAX_BITS + 1);
  for (let i = 0; i < count; i++) counts[lengths[i]!]!++;

  const symbols = new Int32Array(count);
  if (counts[0] === count) return { counts, symbols };

  const offsets = new Int32Array(MAX_BITS + 2);
  for (let len = 1; len <= MAX_BITS; len++) {
    offsets[len + 1] = offsets[len]! + counts[len]!;
  }
  for (let sym = 0; sym < count; sym++) {
    const len = lengths[sym]!;
    if (len !== 0) symbols[offsets[len]!++] = sym;
  }
  return { counts, symbols };
}

class BitReader {
  private byteIndex = 0;
  private bitBuffer = 0;
  private bitCount = 0;
  /** Ditandai true bila aliran habis di tengah pembacaan. */
  overrun = false;

  constructor(private readonly data: Uint8Array) {}

  readBits(n: number): number {
    while (this.bitCount < n) {
      if (this.byteIndex >= this.data.length) {
        this.overrun = true;
        return 0;
      }
      this.bitBuffer |= this.data[this.byteIndex++]! << this.bitCount;
      this.bitCount += 8;
    }
    const value = this.bitBuffer & ((1 << n) - 1);
    this.bitBuffer >>>= n;
    this.bitCount -= n;
    return value;
  }

  /** Buang sisa bit sampai batas byte (dipakai blok stored). */
  alignToByte(): void {
    this.bitBuffer = 0;
    this.bitCount = 0;
  }

  readStoredHeader(): { len: number; ok: boolean } {
    this.alignToByte();
    if (this.byteIndex + 4 > this.data.length) return { len: 0, ok: false };
    const len = this.data[this.byteIndex]! | (this.data[this.byteIndex + 1]! << 8);
    const nlen = this.data[this.byteIndex + 2]! | (this.data[this.byteIndex + 3]! << 8);
    this.byteIndex += 4;
    return { len, ok: (len ^ 0xffff) === nlen };
  }

  copyStored(len: number, out: ByteSink): boolean {
    if (this.byteIndex + len > this.data.length) return false;
    for (let i = 0; i < len; i++) out.push(this.data[this.byteIndex + i]!);
    this.byteIndex += len;
    return true;
  }

  decodeSymbol(table: Huffman): number {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= MAX_BITS; len++) {
      code |= this.readBits(1);
      if (this.overrun) return -1;
      const count = table.counts[len]!;
      if (code - first < count) return table.symbols[index + (code - first)]!;
      index += count;
      first = (first + count) << 1;
      code <<= 1;
    }
    return -1;
  }
}

/** Buffer keluaran yang tumbuh sendiri; ukuran awal ditebak dari IHDR. */
class ByteSink {
  private buffer: Uint8Array;
  length = 0;

  constructor(initialCapacity: number) {
    this.buffer = new Uint8Array(Math.max(1024, initialCapacity));
  }

  push(byte: number): void {
    if (this.length === this.buffer.length) {
      const bigger = new Uint8Array(this.buffer.length * 2);
      bigger.set(this.buffer);
      this.buffer = bigger;
    }
    this.buffer[this.length++] = byte;
  }

  at(index: number): number {
    return this.buffer[index]!;
  }

  toUint8Array(): Uint8Array {
    return this.buffer.subarray(0, this.length);
  }
}

/**
 * Membuka aliran DEFLATE mentah (tanpa header zlib).
 * Mengembalikan `null` bila aliran rusak atau memakai blok yang tidak sah.
 */
export function inflateRaw(data: Uint8Array, expectedSize: number): Uint8Array | null {
  const reader = new BitReader(data);
  const out = new ByteSink(expectedSize);

  let fixedLit: Huffman | null = null;
  let fixedDist: Huffman | null = null;

  for (;;) {
    const isFinal = reader.readBits(1);
    const type = reader.readBits(2);
    if (reader.overrun) return null;

    if (type === 0) {
      const { len, ok } = reader.readStoredHeader();
      if (!ok) return null;
      if (!reader.copyStored(len, out)) return null;
    } else if (type === 1 || type === 2) {
      let litTable: Huffman;
      let distTable: Huffman;

      if (type === 1) {
        if (!fixedLit || !fixedDist) {
          const litLengths = new Uint8Array(288);
          for (let i = 0; i < 144; i++) litLengths[i] = 8;
          for (let i = 144; i < 256; i++) litLengths[i] = 9;
          for (let i = 256; i < 280; i++) litLengths[i] = 7;
          for (let i = 280; i < 288; i++) litLengths[i] = 8;
          fixedLit = buildHuffman(litLengths, 288);
          const distLengths = new Uint8Array(30).fill(5);
          fixedDist = buildHuffman(distLengths, 30);
        }
        litTable = fixedLit;
        distTable = fixedDist;
      } else {
        const hlit = reader.readBits(5) + 257;
        const hdist = reader.readBits(5) + 1;
        const hclen = reader.readBits(4) + 4;
        if (reader.overrun || hlit > 286 || hdist > 30) return null;

        const clenLengths = new Uint8Array(19);
        for (let i = 0; i < hclen; i++) {
          clenLengths[CLEN_ORDER[i]!] = reader.readBits(3);
        }
        if (reader.overrun) return null;
        const clenTable = buildHuffman(clenLengths, 19);

        const lengths = new Uint8Array(hlit + hdist);
        let index = 0;
        while (index < hlit + hdist) {
          const symbol = reader.decodeSymbol(clenTable);
          if (symbol < 0) return null;
          if (symbol < 16) {
            lengths[index++] = symbol;
          } else if (symbol === 16) {
            if (index === 0) return null;
            const previous = lengths[index - 1]!;
            let repeat = 3 + reader.readBits(2);
            while (repeat-- > 0 && index < lengths.length) lengths[index++] = previous;
          } else if (symbol === 17) {
            let repeat = 3 + reader.readBits(3);
            while (repeat-- > 0 && index < lengths.length) lengths[index++] = 0;
          } else {
            let repeat = 11 + reader.readBits(7);
            while (repeat-- > 0 && index < lengths.length) lengths[index++] = 0;
          }
          if (reader.overrun) return null;
        }

        litTable = buildHuffman(lengths.subarray(0, hlit), hlit);
        distTable = buildHuffman(lengths.subarray(hlit), hdist);
      }

      for (;;) {
        const symbol = reader.decodeSymbol(litTable);
        if (symbol < 0) return null;
        if (symbol < 256) {
          out.push(symbol);
          continue;
        }
        if (symbol === 256) break;

        const lengthIndex = symbol - 257;
        if (lengthIndex >= LENGTH_BASE.length) return null;
        const copyLength = LENGTH_BASE[lengthIndex]! + reader.readBits(LENGTH_EXTRA[lengthIndex]!);

        const distSymbol = reader.decodeSymbol(distTable);
        if (distSymbol < 0 || distSymbol >= DIST_BASE.length) return null;
        const distance = DIST_BASE[distSymbol]! + reader.readBits(DIST_EXTRA[distSymbol]!);
        if (reader.overrun || distance > out.length) return null;

        const start = out.length - distance;
        for (let i = 0; i < copyLength; i++) {
          out.push(out.at(start + i));
        }
      }
    } else {
      return null; // type 3 tidak sah
    }

    if (isFinal) break;
  }

  return out.toUint8Array();
}

// ─── PNG ─────────────────────────────────────────────────────

export interface DecodedImage {
  width: number;
  height: number;
  /** Piksel RGBA berurutan, panjang = width × height × 4. */
  rgba: Uint8Array;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Jumlah kanal per warna menurut color type PNG. */
function channelsFor(colorType: number): number {
  switch (colorType) {
    case 0:
      return 1; // grayscale
    case 2:
      return 3; // truecolor
    case 3:
      return 1; // indeks palet
    case 4:
      return 2; // grayscale + alpha
    case 6:
      return 4; // truecolor + alpha
    default:
      return 0;
  }
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) >>> 0) +
    (bytes[offset + 1]! << 16) +
    (bytes[offset + 2]! << 8) +
    bytes[offset + 3]!
  );
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Mendekode berkas PNG 8-bit non-interlaced menjadi buffer RGBA.
 * Mengembalikan `null` untuk berkas rusak maupun untuk varian yang tidak
 * didukung — pemanggil harus memperlakukan keduanya sebagai "tidak terbaca".
 */
export function decodePng(bytes: Uint8Array): DecodedImage | null {
  if (bytes.length < 8 + 25) return null;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return null;
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  let palette: Uint8Array | null = null;
  const idatParts: Uint8Array[] = [];
  let idatTotal = 0;

  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type =
      String.fromCharCode(bytes[offset + 4]!) +
      String.fromCharCode(bytes[offset + 5]!) +
      String.fromCharCode(bytes[offset + 6]!) +
      String.fromCharCode(bytes[offset + 7]!);
    const dataStart = offset + 8;
    if (dataStart + length + 4 > bytes.length) return null;

    if (type === 'IHDR') {
      if (length < 13) return null;
      width = readUint32BE(bytes, dataStart);
      height = readUint32BE(bytes, dataStart + 4);
      bitDepth = bytes[dataStart + 8]!;
      colorType = bytes[dataStart + 9]!;
      interlace = bytes[dataStart + 12]!;
    } else if (type === 'PLTE') {
      palette = bytes.subarray(dataStart, dataStart + length);
    } else if (type === 'IDAT') {
      const part = bytes.subarray(dataStart, dataStart + length);
      idatParts.push(part);
      idatTotal += part.length;
    } else if (type === 'IEND') {
      break;
    }

    offset = dataStart + length + 4; // lewati CRC
  }

  const channels = channelsFor(colorType);
  if (
    width <= 0 ||
    height <= 0 ||
    // Batas kewarasan: TrashScan selalu memperkecil gambar dulu, jadi PNG yang
    // jauh lebih besar dari itu pasti bukan berasal dari alur kita.
    width > 4096 ||
    height > 4096 ||
    bitDepth !== 8 ||
    channels === 0 ||
    interlace !== 0 ||
    idatTotal === 0 ||
    (colorType === 3 && !palette)
  ) {
    return null;
  }

  // Gabungkan seluruh blok IDAT — encoder boleh memecahnya sesuka hati.
  let compressed: Uint8Array;
  if (idatParts.length === 1) {
    compressed = idatParts[0]!;
  } else {
    compressed = new Uint8Array(idatTotal);
    let cursor = 0;
    for (const part of idatParts) {
      compressed.set(part, cursor);
      cursor += part.length;
    }
  }

  // Lewati 2 byte header zlib (CMF + FLG). Bit FDICT tidak pernah dipakai
  // encoder PNG; bila muncul, aliran tidak dapat dibuka tanpa kamus.
  if (compressed.length < 3) return null;
  if ((compressed[1]! & 0x20) !== 0) return null;
  const raw = compressed.subarray(2);

  const stride = width * channels;
  const expected = height * (stride + 1);
  const inflated = inflateRaw(raw, expected);
  if (!inflated || inflated.length < expected) return null;

  // ── Buka filter baris (RFC 2083 §6) ──
  const pixels = new Uint8Array(height * stride);
  let inCursor = 0;
  let rowStart = 0;
  let previousRowStart = -1;

  for (let y = 0; y < height; y++) {
    const filter = inflated[inCursor++]!;
    for (let x = 0; x < stride; x++) {
      const rawByte = inflated[inCursor + x]!;
      const left = x >= channels ? pixels[rowStart + x - channels]! : 0;
      const up = previousRowStart >= 0 ? pixels[previousRowStart + x]! : 0;
      const upLeft =
        previousRowStart >= 0 && x >= channels ? pixels[previousRowStart + x - channels]! : 0;

      let value: number;
      switch (filter) {
        case 0:
          value = rawByte;
          break;
        case 1:
          value = rawByte + left;
          break;
        case 2:
          value = rawByte + up;
          break;
        case 3:
          value = rawByte + ((left + up) >> 1);
          break;
        case 4:
          value = rawByte + paeth(left, up, upLeft);
          break;
        default:
          return null; // filter tidak dikenal → berkas rusak
      }
      pixels[rowStart + x] = value & 0xff;
    }
    inCursor += stride;
    previousRowStart = rowStart;
    rowStart += stride;
  }

  // ── Normalkan menjadi RGBA ──
  const rgba = new Uint8Array(width * height * 4);
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i++) {
    const src = i * channels;
    const dst = i * 4;
    switch (colorType) {
      case 0: {
        const grey = pixels[src]!;
        rgba[dst] = grey;
        rgba[dst + 1] = grey;
        rgba[dst + 2] = grey;
        rgba[dst + 3] = 255;
        break;
      }
      case 2:
        rgba[dst] = pixels[src]!;
        rgba[dst + 1] = pixels[src + 1]!;
        rgba[dst + 2] = pixels[src + 2]!;
        rgba[dst + 3] = 255;
        break;
      case 3: {
        const entry = pixels[src]! * 3;
        const plte = palette!;
        if (entry + 2 >= plte.length) return null;
        rgba[dst] = plte[entry]!;
        rgba[dst + 1] = plte[entry + 1]!;
        rgba[dst + 2] = plte[entry + 2]!;
        rgba[dst + 3] = 255;
        break;
      }
      case 4: {
        const grey = pixels[src]!;
        rgba[dst] = grey;
        rgba[dst + 1] = grey;
        rgba[dst + 2] = grey;
        rgba[dst + 3] = pixels[src + 1]!;
        break;
      }
      default:
        rgba[dst] = pixels[src]!;
        rgba[dst + 1] = pixels[src + 1]!;
        rgba[dst + 2] = pixels[src + 2]!;
        rgba[dst + 3] = pixels[src + 3]!;
        break;
    }
  }

  return { width, height, rgba };
}
