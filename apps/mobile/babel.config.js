module.exports = function (api) {
  const isTest = process.env.NODE_ENV === 'test' || api.env('test');

  // Satu kali saja — jangan pakai api.cache(true) + preset yang juga set cache.
  api.cache.using(() => (isTest ? 'test' : 'production'));

  /**
   * Tidak ada plugin Reanimated di sini, dan itu disengaja.
   *
   * Sejak Reanimated 4 plugin babelnya pindah dari `react-native-reanimated/plugin`
   * ke paket `react-native-worklets/plugin`. Menyebut nama lama membuat build
   * gagal. Menyebut nama baru pun tidak perlu: `babel-preset-expo` sejak SDK 54
   * memasang plugin worklets sendiri begitu ia melihat Reanimated terpasang, dan
   * menyebutkannya lagi di sini justru menerapkannya dua kali.
   */
  return {
    presets: ['babel-preset-expo'],
  };
};
