/* eslint-disable @typescript-eslint/no-var-requires */
const { withAppBuildGradle } = require('@expo/config-plugins');

const SIGNING_MARKER = 'bingoRelease {';

/**
 * Expo CNG membuat android/app/build.gradle dari template pada setiap build.
 * Plugin ini menambahkan release signing tanpa menyimpan path atau password
 * keystore dalam source control. Nilainya hanya dibaca dari environment CI.
 */
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (result) => {
    if (result.modResults.language !== 'groovy') {
      throw new Error('BinGo release signing hanya mendukung Gradle Groovy.');
    }

    let contents = result.modResults.contents;
    if (contents.includes(SIGNING_MARKER)) return result;

    const signingBlock = /\n    signingConfigs \{[\s\S]*?\n    \}/;
    const match = contents.match(signingBlock);
    if (!match) throw new Error('Tidak menemukan signingConfigs pada android/app/build.gradle.');

    const releaseSigning = `
        if (System.getenv('BINGO_ANDROID_KEYSTORE_PATH')) {
            bingoRelease {
                storeFile file(System.getenv('BINGO_ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('BINGO_ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('BINGO_ANDROID_KEY_ALIAS')
                keyPassword System.getenv('BINGO_ANDROID_KEY_PASSWORD')
            }
        }`;
    const augmentedSigning = match[0].replace(/\n    \}$/, `${releaseSigning}\n    }`);
    contents = contents.replace(match[0], augmentedSigning);

    const releaseBuildSigning =
      /(\n        release \{[\s\S]*?\n            )signingConfig signingConfigs\.debug/;
    if (!releaseBuildSigning.test(contents)) {
      throw new Error('Tidak menemukan release signingConfig pada android/app/build.gradle.');
    }
    contents = contents.replace(
      releaseBuildSigning,
      `$1signingConfig System.getenv('BINGO_ANDROID_KEYSTORE_PATH') ? signingConfigs.bingoRelease : signingConfigs.debug`,
    );

    result.modResults.contents = contents;
    return result;
  });
};
