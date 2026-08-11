# Daftar Komponen Perangkat Lunak dan Lisensinya

**BinGo** — Tim mips-avr · GEMASTIK XIX Divisi Pengembangan Perangkat Lunak

Dokumen ini memenuhi ketentuan Deliverables babak penyisihan: _"Daftar komponen
(atau software library) yang dapat digunakan beserta lisensi dari komponen
(atau software library) tersebut."_

Yang didaftar adalah seluruh pustaka pihak ketiga yang **dideklarasikan langsung**
oleh BinGo pada berkas `package.json` tiap paket dalam monorepo. Versi dan lisensi
dibaca langsung dari `package.json` masing-masing paket di dalam `node_modules`.

Perangkat lunak BinGo sendiri dirilis di bawah **MIT License** — lihat berkas
`LICENSE` pada akar repositori.

## Root — perkakas monorepo

| Komponen     | Versi | Lisensi    | Jenis        |
| ------------ | ----- | ---------- | ------------ |
| `prettier`   | 3.8.3 | MIT        | pengembangan |
| `typescript` | 5.9.3 | Apache-2.0 | pengembangan |

## apps/backend — REST API NestJS + Prisma

| Komponen                           | Versi    | Lisensi      | Jenis        |
| ---------------------------------- | -------- | ------------ | ------------ |
| `@nestjs/common`                   | 10.4.22  | MIT          | runtime      |
| `@nestjs/config`                   | 3.3.0    | MIT          | runtime      |
| `@nestjs/core`                     | 10.4.22  | MIT          | runtime      |
| `@nestjs/jwt`                      | 10.2.0   | MIT          | runtime      |
| `@nestjs/passport`                 | 10.0.3   | MIT          | runtime      |
| `@nestjs/platform-express`         | 10.4.22  | MIT          | runtime      |
| `@nestjs/swagger`                  | 7.4.2    | MIT          | runtime      |
| `@nestjs/terminus`                 | 10.3.0   | MIT          | runtime      |
| `@prisma/client`                   | 5.22.0   | Apache-2.0   | runtime      |
| `@types/multer`                    | 2.1.0    | MIT          | runtime      |
| `bcrypt`                           | 5.1.1    | MIT          | runtime      |
| `class-transformer`                | 0.5.1    | MIT          | runtime      |
| `class-validator`                  | 0.14.4   | MIT          | runtime      |
| `helmet`                           | 7.2.0    | MIT          | runtime      |
| `multer`                           | 2.1.1    | MIT          | runtime      |
| `passport`                         | 0.7.0    | MIT          | runtime      |
| `passport-jwt`                     | 4.0.1    | MIT          | runtime      |
| `passport-local`                   | 1.0.0    | MIT          | runtime      |
| `reflect-metadata`                 | 0.2.2    | Apache-2.0   | runtime      |
| `rxjs`                             | 7.8.2    | Apache-2.0   | runtime      |
| `zod`                              | 3.25.76  | MIT          | runtime      |
| `@nestjs/cli`                      | 10.4.9   | MIT          | pengembangan |
| `@nestjs/schematics`               | 10.2.3   | MIT          | pengembangan |
| `@nestjs/testing`                  | 10.4.22  | MIT          | pengembangan |
| `@types/bcrypt`                    | 5.0.2    | MIT          | pengembangan |
| `@types/express`                   | 4.17.25  | MIT          | pengembangan |
| `@types/jest`                      | 29.5.14  | MIT          | pengembangan |
| `@types/node`                      | 20.19.41 | MIT          | pengembangan |
| `@types/passport-jwt`              | 4.0.1    | MIT          | pengembangan |
| `@types/passport-local`            | 1.0.38   | MIT          | pengembangan |
| `@types/supertest`                 | 6.0.3    | MIT          | pengembangan |
| `@typescript-eslint/eslint-plugin` | 7.18.0   | MIT          | pengembangan |
| `@typescript-eslint/parser`        | 7.18.0   | BSD-2-Clause | pengembangan |
| `dotenv`                           | 16.4.7   | BSD-2-Clause | pengembangan |
| `eslint`                           | 8.57.1   | MIT          | pengembangan |
| `eslint-config-prettier`           | 9.1.2    | MIT          | pengembangan |
| `eslint-plugin-prettier`           | 5.5.5    | MIT          | pengembangan |
| `jest`                             | 29.7.0   | MIT          | pengembangan |
| `prettier`                         | 3.8.3    | MIT          | pengembangan |
| `prisma`                           | 5.22.0   | Apache-2.0   | pengembangan |
| `rimraf`                           | 5.0.10   | ISC          | pengembangan |
| `source-map-support`               | 0.5.21   | MIT          | pengembangan |
| `supertest`                        | 7.2.2    | MIT          | pengembangan |
| `ts-jest`                          | 29.4.9   | MIT          | pengembangan |
| `ts-loader`                        | 9.5.7    | MIT          | pengembangan |
| `ts-node`                          | 10.9.2   | MIT          | pengembangan |
| `tsconfig-paths`                   | 4.2.0    | MIT          | pengembangan |
| `typescript`                       | 5.9.3    | Apache-2.0   | pengembangan |

## apps/mobile — Aplikasi Expo React Native

| Komponen                         | Versi    | Lisensi    | Jenis        |
| -------------------------------- | -------- | ---------- | ------------ |
| `@babel/runtime`                 | 7.29.2   | MIT        | runtime      |
| `@react-navigation/native`       | 6.1.18   | MIT        | runtime      |
| `@tanstack/react-query`          | 5.100.10 | MIT        | runtime      |
| `axios`                          | 1.16.1   | MIT        | runtime      |
| `date-fns`                       | 4.1.0    | MIT        | runtime      |
| `expo`                           | 51.0.39  | MIT        | runtime      |
| `expo-camera`                    | 15.0.16  | MIT        | runtime      |
| `expo-constants`                 | 16.0.2   | MIT        | runtime      |
| `expo-image-manipulator`         | 12.0.5   | MIT        | runtime      |
| `expo-image-picker`              | 15.1.0   | MIT        | runtime      |
| `expo-linking`                   | 6.3.1    | MIT        | runtime      |
| `expo-location`                  | 17.0.1   | MIT        | runtime      |
| `expo-router`                    | 3.5.24   | MIT        | runtime      |
| `expo-secure-store`              | 13.0.2   | MIT        | runtime      |
| `expo-status-bar`                | 1.12.1   | MIT        | runtime      |
| `nativewind`                     | 4.0.36   | MIT        | runtime      |
| `react`                          | 18.2.0   | MIT        | runtime      |
| `react-native`                   | 0.74.5   | MIT        | runtime      |
| `react-native-fast-tflite`       | 3.0.1    | MIT        | runtime      |
| `react-native-css-interop`       | 0.0.36   | MIT        | runtime      |
| `react-native-gesture-handler`   | 2.16.2   | MIT        | runtime      |
| `react-native-reanimated`        | 3.10.1   | MIT        | runtime      |
| `react-native-nitro-modules`     | 0.36.5   | MIT        | runtime      |
| `react-native-safe-area-context` | 4.10.5   | MIT        | runtime      |
| `react-native-screens`           | 3.31.1   | MIT        | runtime      |
| `tailwindcss`                    | 3.4.19   | MIT        | runtime      |
| `zustand`                        | 4.5.7    | MIT        | runtime      |
| `@babel/core`                    | 7.29.0   | MIT        | pengembangan |
| `@expo/config-plugins`           | 54.0.5   | MIT        | pengembangan |
| `@testing-library/jest-native`   | 5.4.3    | MIT        | pengembangan |
| `@testing-library/react-native`  | 12.9.0   | MIT        | pengembangan |
| `@types/jest`                    | 29.5.14  | MIT        | pengembangan |
| `@types/react`                   | 18.2.79  | MIT        | pengembangan |
| `@types/react-native`            | 0.73.0   | MIT        | pengembangan |
| `jest`                           | 29.7.0   | MIT        | pengembangan |
| `jest-expo`                      | 51.0.4   | MIT        | pengembangan |
| `react-test-renderer`            | 18.2.0   | MIT        | pengembangan |
| `typescript`                     | 5.3.3    | Apache-2.0 | pengembangan |

## packages/shared-types

| Komponen     | Versi | Lisensi    | Jenis        |
| ------------ | ----- | ---------- | ------------ |
| `typescript` | 5.9.3 | Apache-2.0 | pengembangan |

## packages/shared-utils

| Komponen      | Versi    | Lisensi    | Jenis        |
| ------------- | -------- | ---------- | ------------ |
| `@types/jest` | 29.5.14  | MIT        | pengembangan |
| `@types/node` | 20.19.41 | MIT        | pengembangan |
| `jest`        | 29.7.0   | MIT        | pengembangan |
| `ts-jest`     | 29.4.9   | MIT        | pengembangan |
| `typescript`  | 5.9.3    | Apache-2.0 | pengembangan |

## packages/i18n

| Komponen     | Versi | Lisensi    | Jenis        |
| ------------ | ----- | ---------- | ------------ |
| `typescript` | 5.9.3 | Apache-2.0 | pengembangan |

## Ringkasan

| Lisensi      | Jumlah komponen |
| ------------ | --------------- |
| MIT          | 82              |
| Apache-2.0   | 10              |
| BSD-2-Clause | 2               |
| ISC          | 1               |

**Total komponen langsung: 95**

Tidak ditemukan komponen berlisensi copyleft kuat (GPL, AGPL, atau LGPL) di
antara dependensi langsung, sehingga tidak ada kewajiban yang memaksa BinGo
mengubah lisensinya sendiri.
