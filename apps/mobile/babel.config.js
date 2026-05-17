module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || api.env('test');
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Plugin reanimated tidak dipakai saat menjalankan Jest (memerlukan
    // native worklets), jadi hanya aktif di build runtime.
    plugins: isTest ? [] : ['react-native-reanimated/plugin'],
  };
};
