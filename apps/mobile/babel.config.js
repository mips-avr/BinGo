module.exports = function (api) {
  const isTest = process.env.NODE_ENV === 'test' || api.env('test');

  // Satu kali saja — jangan pakai api.cache(true) + preset yang juga set cache.
  api.cache.using(() => (isTest ? 'test' : 'production'));

  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
    };
  }

  return {
    presets: ['babel-preset-expo'],
    // Wajib berada di posisi terakhir.
    plugins: ['react-native-reanimated/plugin'],
  };
};
