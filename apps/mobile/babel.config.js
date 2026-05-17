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
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-reanimated/plugin sudah disertakan oleh nativewind/babel
  };
};
