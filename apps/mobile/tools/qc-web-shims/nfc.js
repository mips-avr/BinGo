/**
 * Shim NFC untuk harness tangkapan layar berbasis web.
 *
 * `useNfcTag` sudah membungkus `require('react-native-nfc-manager')` dalam
 * try/catch, jadi secara teori shim ini tidak wajib. Ia tetap ada karena tanpa
 * shim, Metro ikut mem-bundle seluruh modul native beserta ketergantungannya ke
 * dalam berkas web — memperbesar bundel QC tanpa guna, dan memunculkan galat
 * konsol yang mengaburkan galat sungguhan yang justru dicari harness ini.
 *
 * `isSupported` mengembalikan false, sehingga layar kartu merender keadaan
 * "ponsel ini tidak mendukung NFC" — dan itu memang keadaan yang paling perlu
 * diperiksa pikselnya, karena di situlah jalur nomor kartu manual harus tetap
 * terlihat dan terpakai.
 */
const noop = async () => undefined;

module.exports = {
  __esModule: true,
  default: {
    start: noop,
    isSupported: async () => false,
    isEnabled: async () => false,
    requestTechnology: noop,
    getTag: async () => null,
    cancelTechnologyRequest: noop,
  },
  NfcTech: { Ndef: 'Ndef' },
};
