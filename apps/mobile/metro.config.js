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
 * Pengalihan modul khusus web.
 *
 * Dulu blok ini dipagari `process.env.BINGO_WEB_QC || EXPO_PUBLIC_WEB_BUILD`,
 * dan pagar itulah yang membuat produksi putih total: CD tidak pernah menyetel
 * variabelnya, jadi shim zustand tidak terpasang, `import.meta.env` masuk ke
 * bundel script klasik, dan peramban menolak seluruh bundel sebelum React
 * sempat dirender. Perbaikannya ada di repo tapi tidak pernah aktif.
 *
 * Pagarnya sekarang dihapus karena memang tidak pernah dibutuhkan: penjaga
 * yang sebenarnya adalah `platform === 'web'` di bawah. Build Android/iOS tidak
 * pernah melewati cabang itu, sehingga tidak ada satu pun yang berubah bagi
 * mereka — sementara setiap build web, dari mana pun ia dijalankan, sekarang
 * mustahil kehilangan shim-nya.
 */
{
  const shims = {
    'expo-secure-store': path.resolve(projectRoot, 'tools/qc-web-shims/secure-store.js'),
    'expo-camera': path.resolve(projectRoot, 'tools/qc-web-shims/camera.js'),
    'react-native-nfc-manager': path.resolve(projectRoot, 'tools/qc-web-shims/nfc.js'),
    // Metro 0.83 memilih kondisi `import` dari exports map Zustand pada web,
    // lalu memasukkan `import.meta.env` ESM ke dalam bundle script klasik.
    // Browser menolak seluruh bundle sebelum React sempat dirender. Build CJS
    // resmi Zustand tidak mengandung import.meta dan tetap identik secara API.
    zustand: path.resolve(projectRoot, 'node_modules/zustand/index.js'),
    'zustand/vanilla': path.resolve(projectRoot, 'node_modules/zustand/vanilla.js'),
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
