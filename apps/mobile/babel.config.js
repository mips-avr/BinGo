module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || api.env('test');

  // Jest: hindari nativewind/babel yang memuat react-native-worklets/plugin
  // (menarik Metro 0.84+ ke monorepo). Runtime Expo tetap pakai NativeWind penuh.
  if (isTest) {
    return {
      presets: ['babel-preset-expo'],
      plugins: [],
    };
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
