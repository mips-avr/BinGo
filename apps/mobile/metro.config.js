/* eslint-disable @typescript-eslint/no-var-requires */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;

/**
 * Bundling web hanya dipakai oleh perkakas QC tangkapan layar
 * (`tools/qc-screenshots`). Dua modul native tidak punya implementasi browser
 * yang berguna, jadi keduanya dialihkan ke shim saat dan hanya saat
 * `BINGO_WEB_QC` diset. Build Android/iOS tidak tersentuh.
 */
if (process.env.BINGO_WEB_QC) {
  const shims = {
    'expo-secure-store': path.resolve(projectRoot, 'tools/qc-web-shims/secure-store.js'),
    'expo-camera': path.resolve(projectRoot, 'tools/qc-web-shims/camera.js'),
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
