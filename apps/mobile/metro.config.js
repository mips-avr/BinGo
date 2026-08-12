const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

/**
 * Tidak ada `watchFolders`, `nodeModulesPaths`, `unstable_enableSymlinks`, atau
 * `disableHierarchicalLookup` di sini, dan itu disengaja.
 *
 * Sejak SDK 52 `expo/metro-config` mengenali monorepo sendiri dan menyetel
 * ketiganya dengan benar. Menyetelnya manual justru menabrak resolusi pnpm yang
 * memakai symlink: `disableHierarchicalLookup` melarang Metro menelusuri ke
 * direktori induk, sehingga paket yang di-symlink dari `.pnpm` tidak ketemu.
 */
const config = getDefaultConfig(projectRoot);

/**
 * Bundling web hanya dipakai oleh perkakas QC tangkapan layar
 * (`tools/qc-screenshots`). Tiga modul native tidak punya implementasi browser
 * yang berguna, jadi ketiganya dialihkan ke shim saat dan hanya saat
 * `BINGO_WEB_QC` diset. Build Android/iOS tidak tersentuh.
 */
if (process.env.BINGO_WEB_QC || process.env.EXPO_PUBLIC_WEB_BUILD) {
  const shims = {
    'expo-secure-store': path.resolve(projectRoot, 'tools/qc-web-shims/secure-store.js'),
    'expo-camera': path.resolve(projectRoot, 'tools/qc-web-shims/camera.js'),
    'react-native-nfc-manager': path.resolve(projectRoot, 'tools/qc-web-shims/nfc.js'),
  };
  const base = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && shims[moduleName]) {
      return { type: 'sourceFile', filePath: shims[moduleName] };
    }
    return (base || context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
